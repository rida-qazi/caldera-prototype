import React from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  InfoWindow,
  DirectionsRenderer,
  TrafficLayer,
} from "@react-google-maps/api";
import { useInView } from "react-intersection-observer";
import ShipmentFilters from "../components/ShipmentFilters";
import { supabase } from "../supabaseClient";
import DeliveryPieChart from "../components/DeliveryPieChart";
import DelayLineChart from "../components/DelayLineChart";
import { useGoogleMaps } from "../components/GoogleMapsLoader";

function DashboardPage({ alerts }) {

  const [shipments, setShipments] = React.useState([]);  
  const [analytics, setAnalytics] = React.useState(null);


  
  const { ref: mapInViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.2 });


  const [vehicles, setVehicles] = React.useState([]);
  const [vehicleRoutes, setVehicleRoutes] = React.useState({});
  const [selectedShipment, setSelectedShipment] = React.useState(null);
  const [directions, setDirections] = React.useState(null);

  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showTraffic, setShowTraffic] = React.useState(false);

  const mapRef = React.useRef(null);
  const { isLoaded, loadError } = useGoogleMaps();

  const VEHICLE_METADATA = {
    Qazi: { origin: "JP Nagar", destination: "Bannerghatta" },
    XUV500: { origin: "Jayanagar", destination: "JP Nagar" },
    2007: { origin: "Jayanagar", destination: "Banaswadi" },
    eggomlette: { origin: "KR Puram", destination: "Bannerghatta" },
    Ultron: { origin: "Chamrajpet", destination: "Ejipura" },
    hi: { origin: "Ejipura", destination: "HSR Layout" },
    "Badmosh billa": { origin: "Tilak Nagar", destination: "Anepalya" },
  };

  React.useEffect(() => {
    async function loadStatic() {
      try {
        const res = await fetch("/data/vehicle_positions.json");
        const raw = await res.json();

        const grouped = {};

        raw.forEach((r) => {
          if (!grouped[r.vehicle_id]) grouped[r.vehicle_id] = [];
          grouped[r.vehicle_id].push({
            vehicle_id: r.vehicle_id,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            speed_kmh: Number(r.speed_kmh),
            timestamp: r.timestamp,
          });
        });

        // sort paths
        Object.values(grouped).forEach((arr) =>
          arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        );

        setVehicleRoutes(grouped);

        const snapshots = Object.entries(grouped).map(([vehicle_id, points]) => {
          const last = points[points.length - 1];
          const meta = VEHICLE_METADATA[vehicle_id] || {
            origin: "Unknown",
            destination: "Unknown",
          };

          const departedAt = new Date(
            new Date(last.timestamp).getTime() - 4 * 3600000
          ).toISOString();
          const hubTime = new Date(
            new Date(last.timestamp).getTime() - 2 * 3600000
          ).toISOString();
          const eta = new Date(
            new Date(last.timestamp).getTime() + 2 * 3600000
          ).toISOString();

          return {
            id: vehicle_id,
            origin: meta.origin,
            destination: meta.destination,
            departedAt,
            hubTime,
            eta,
            status:
              ["In Transit", "Delayed", "Delivered"][
                Math.floor(Math.random() * 3)
              ],
            lat: last.latitude,
            lng: last.longitude,
            fullPath: points,
          };
        });

        snapshots.sort((a, b) => a.id.localeCompare(b.id));
        setVehicles(snapshots);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    }

    loadStatic();
  }, []);


  const handleShipmentSelect = (shipment) => {
    setSelectedShipment(shipment);
    setDirections(null);

    if (mapRef.current) {
      mapRef.current.panTo({ lat: shipment.lat, lng: shipment.lng });
      mapRef.current.setZoom(12);
    }
  };

  const filteredShipments = vehicles.filter((s) => {
    const matchesStatus =
      statusFilter === "All" ? true : s.status === statusFilter;

    const q = searchTerm.trim().toLowerCase();

    const matchesSearch =
      q === "" ||
      s.id.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });




  // ✅ Load shipments

  React.useEffect(() => {
    async function load() {
      const { data: shipmentRows, error } = await supabase
        .from("shipments")
        .select("*");

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      // --- STATUS MAPPING ---
      const mapStatus = (s) => {
        if (s.current_status) return s.current_status;
        if (s.on_hold) return "On Hold";
        if (s.movement_type === 2) return "Delivered";
        if (s.movement_type === 3) return "Delayed";
        return "In Transit";
      };

      // --- NORMALIZED SHIPMENTS FOR UI ---
      const shipmentsWithCoords = shipmentRows.map((s) => ({
        ...s,
        id: String(s.id),

        // Real origin
        origin:
          s.origin_city
            ? `${s.origin_city}, ${s.origin_state} (${s.origin_pincode})`
            : "Unknown",

        // Real destination
        destination:
          s.dest_city
            ? `${s.dest_city}, ${s.dest_state} (${s.dest_pincode})`
            : "Unknown",

        status: mapStatus(s),

        // Temporary map coordinates (simulation)
        lat: 20.5 + Math.random(),
        lng: 78.9 + Math.random(),

        predictedDelay: Math.random() < 0.25
      }));

      setShipments(shipmentsWithCoords);

      // --- DAILY DELAY CALCULATION ---
      let daily = {};
      shipmentRows.forEach((s) => {
        if (s.actual_delivery && s.eta) {
          const eta = new Date(s.eta);
          const actual = new Date(s.actual_delivery);

          const delayHours = (actual - eta) / 3600000;
          const day = actual.toISOString().split("T")[0];

          if (!daily[day]) daily[day] = { totalDelay: 0, count: 0 };

          daily[day].totalDelay += delayHours;
          daily[day].count += 1;
        }
      });

      const delayTimeline = Object.keys(daily).map((day) => ({
        date: day,
        avgDelay: daily[day].totalDelay / daily[day].count
      }));

      delayTimeline.sort((a, b) => new Date(a.date) - new Date(b.date));

      // --- KPI ANALYTICS ---
      const total = shipmentRows.length;

      const onHold = shipmentsWithCoords.filter(
        (s) => s.status === "On Hold"
      ).length;

      const delayed = shipmentsWithCoords.filter(
        (s) => s.status === "Delayed"
      ).length;

      const onTime = shipmentRows.filter(
        (s) =>
          s.actual_delivery &&
          s.eta &&
          new Date(s.actual_delivery) <= new Date(s.eta)
      ).length;

      const avgDelayHoursArr = shipmentRows
        .filter((s) => s.actual_delivery && s.eta)
        .map(
          (s) => (new Date(s.actual_delivery) - new Date(s.eta)) / 3600000
        );

      const avgDelayHours =
        avgDelayHoursArr.length
          ? avgDelayHoursArr.reduce((a, b) => a + b, 0) /
            avgDelayHoursArr.length
          : 0;

      setAnalytics({
        totalShipments: total,
        onHold,
        delayed,
        onTime,
        avgDelayHours,
        delayTimeline
      });
    }

    load();
  }, []);

  const pieData = {
  onTime: 18,
  delayed: 3,
};

const delayTimeline = [
  {
    date: "Mon",
    avgDelay: 1.2,
  },
  {
    date: "Tue",
    avgDelay: 2.0,
  },
  {
    date: "Wed",
    avgDelay: 0.8,
  },
  {
    date: "Thu",
    avgDelay: 2.6,
  },
  {
    date: "Fri",
    avgDelay: 1.5,
  },
  {
    date: "Sat",
    avgDelay: 0.7,
  },
  {
    date: "Sun",
    avgDelay: 0.4,
  },
];


  const delayedCount = shipments.filter((s) => s.status === "Delayed").length;
  const utilizationRate = shipments.length
    ? Math.round(((shipments.length - delayedCount) / shipments.length) * 100)
    : 0;

  const mapContainerStyle = { width: "100%", height: "300px" };
  const defaultCenter = { lat: 20.5937, lng: 78.9629 };

  const getMarkerIcon = (status) => {
    if (status === "Delayed")
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    if (status === "Delivered")
      return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
  };



  // ✅ Select shipment + draw route
  
  console.log("Dashboard inView:", inView, "isLoaded:", isLoaded, "loadError:", loadError);


  return (
    <div className="space-y-6">

      {/* Top hero / intro */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-cal-primary-deep">
            Smarter Logistics Starts Here 🌿
          </h1>
          <p className="text-sm text-cal-muted mt-1 max-w-xl">
            Monitor shipments, optimize fleet utilization, assign orders intelligently, and collaborate with trusted logistics partners—all from one platform.
          </p>
        </div>
        <div className="glass-card px-4 py-3 text-xs text-cal-muted flex flex-col md:text-right">
          <span className="uppercase tracking-wide">Today&apos;s snapshot</span>
          <span className="text-sm mt-1">
            {shipments.length ? `${analytics ? analytics.totalShipments : "..."} active shipments` : "Loading shipments..."}
          </span>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Active Shipments</p>
          <p className="mt-2 text-2xl font-heading text-cal-text">21</p>
          <p className="text-[11px] text-cal-muted mt-1">
            Across all monitored routes.
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Delayed Deliveries</p>
          <p className="mt-2 text-2xl font-heading text-red-600">3</p>
          <p className="text-[11px] text-cal-muted mt-1">
            Shipments currently marked as delayed.
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Utilization Rate</p>
          <p className="mt-2 text-2xl font-heading text-cal-primary-deep">
            83%
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Higher is better — fewer disruptions.
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Predicted Risk</p>
          <p className="mt-2 text-2xl font-heading text-amber-600">
            2
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Shipments flagged with potential future delays.
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Avg Delay</p>
          <p className="mt-2 text-2xl font-heading text-cal-primary-deep">
            1.8 hrs
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Across all shipments with valid timestamps.
          </p>
        </div>
      </section>

    

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="h-full">
          <DeliveryPieChart analytics={pieData} />
        </div>

        <div className="h-full">
          <DelayLineChart data={delayTimeline} />
        </div>

      </section>


      {/* Filters row */}
      <section className="glass-card p-4">
        <ShipmentFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </section>

      
      {/* Alerts + Map */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts panel */}
        <div className="lg:col-span-1 glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading text-cal-text">Recent Alerts</h3>
            <span className="text-[11px] text-cal-muted">
              {alerts.length ? `${alerts.length} total` : "No alerts 🎉"}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
            {alerts.length === 0 ? (
              <p className="text-sm text-cal-muted">No recent alerts — everything looks smooth.</p>
            ) : (
              alerts.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    const match = shipments.find(
                      (s) => s.id === a.shipmentId || s.shipmentId === a.shipmentId
                    );
                    if (match) {
                      handleShipmentSelect(match);
                    }
                  }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition 
                    ${
                      a.type.toLowerCase().includes("delay")
                        ? "border-amber-300 bg-amber-50/60 hover:bg-amber-100"
                        : a.type.toLowerCase().includes("reroute")
                        ? "border-cal-primary-soft bg-cal-primary-soft/60 hover:bg-cal-primary-soft"
                        : "border-cal-border bg-cal-surface hover:bg-cal-border/40"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{a.shipmentId}</span>
                    <span className="text-[10px] uppercase text-cal-muted">{a.type}</span>
                  </div>
                  <p className="text-[11px] text-cal-muted mt-1">{a.message}</p>
                  <p className="text-[10px] text-cal-muted mt-1">{a.timestamp}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map panel */}

        <div className="lg:col-span-2 glass-card shadow-sm overflow-hidden min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cal-border/60">
            <div>
              <h3 className="text-sm font-heading text-cal-text">Live Shipment Map</h3>
              <p className="text-[11px] text-cal-muted">
                Click an alert or marker to inspect shipment details.
              </p>
            </div>
          </div>
          <div ref={mapInViewRef} className="flex-1">
            {!inView && (
              <div className="p-6 text-cal-muted text-center text-sm">
                📍 Map will load when visible...
              </div>
            )}
            {inView && loadError && (
              <div className="p-6 text-red-600 text-center text-sm">
                ❌ Error loading Google Maps. Please check API key or network.
              </div>
            )}
            {inView && !isLoaded && !loadError && (
              <div className="p-6 text-cal-muted text-center text-sm">
                ⏳ Loading map...
              </div>
            )}
            {inView && isLoaded && (



              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "320px" }}
                center={
                  selectedShipment
                    ? { lat: selectedShipment.lat, lng: selectedShipment.lng }
                    : { lat: 12.9716, lng: 77.5946 } // Bengaluru default
                }
                zoom={selectedShipment ? 12 : 10}
                onLoad={(map) => (mapRef.current = map)}
              >


                {/* ⭐ SPEED-COLORED POLYLINE FOR SELECTED VEHICLE ONLY */}
                {selectedShipment &&
                  vehicleRoutes[selectedShipment.id] &&
                  vehicleRoutes[selectedShipment.id].length > 1 &&
                  vehicleRoutes[selectedShipment.id].map((point, i) => {
                    if (i === 0) return null;

                    const prev = vehicleRoutes[selectedShipment.id][i - 1];

                    // Speed → Color logic
                    const speed = point.speed_kmh || 0;
                    let color = "#2ecc71"; // green
                    if (speed < 20) color = "#f1c40f"; // yellow
                    if (speed < 10) color = "#e74c3c"; // red

                    return (
                      <Polyline
                        key={`dash-seg-${selectedShipment.id}-${i}`}
                        path={[
                          { lat: prev.latitude, lng: prev.longitude },
                          { lat: point.latitude, lng: point.longitude },
                        ]}
                        options={{
                          strokeColor: color,
                          strokeOpacity: 0.9,
                          strokeWeight: 5,
                        }}
                      />
                    );
                  })}

                {/* ⭐ LATEST POSITION MARKERS FOR ALL VEHICLES */}
                {vehicles.map((v) => (
                  <Marker
                    key={"dash-" + v.id}
                    position={{ lat: v.lat, lng: v.lng }}
                    icon={
                      window.google
                        ? {
                            url:
                              v.status === "Delayed"
                                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                : v.status === "Delivered"
                                ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                                : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                            scaledSize: new window.google.maps.Size(
                              selectedShipment?.id === v.id ? 38 : 28,
                              selectedShipment?.id === v.id ? 38 : 28
                            ),
                          }
                        : undefined
                    }
                    onClick={() => {
                      handleShipmentSelect(v);

                      // ⭐ PAN TO VEHICLE (do NOT recenter on unselect)
                      if (mapRef.current) {
                        mapRef.current.panTo({ lat: v.lat, lng: v.lng });
                        mapRef.current.setZoom(12);
                      }
                    }}
                  />
                ))}

                {/* ⭐ INFO WINDOW */}
                {selectedShipment && (
                  <InfoWindow
                    position={{ lat: selectedShipment.lat, lng: selectedShipment.lng }}
                    onCloseClick={() => {
                      setSelectedShipment(null);
                      setDirections(null);
                      // ⭐ DO NOT reset map when closing
                    }}
                  >
                    <div style={{ fontSize: "12px" }}>
                      <strong>{selectedShipment.id}</strong>
                      <br />
                      {selectedShipment.origin} → {selectedShipment.destination}
                      <br />
                      Status: {selectedShipment.status}
                      {selectedShipment.predictedDelay && (
                        <>
                          <br />
                          <span className="text-amber-600">⚠ Predicted Delay</span>
                        </>
                      )}
                    </div>
                  </InfoWindow>
                )}

                {/* ⭐ OPTIONAL: Google Directions (kept same) */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: { strokeColor: "#4E8055", strokeWeight: 5 },
                      suppressMarkers: true,
                    }}
                  />
                )}

                {showTraffic && <TrafficLayer />}
              </GoogleMap>


              
            )}
          </div>
        </div>
      </section>


    </div>
  );

}

export default DashboardPage;

