import React from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  useJsApiLoader,
  TrafficLayer,
} from "@react-google-maps/api";

function RoutesPage() {
  const [shipments, setShipments] = React.useState([]);
  const [selectedShipment, setSelectedShipment] = React.useState(null);
  const [directions, setDirections] = React.useState(null);

  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showTraffic, setShowTraffic] = React.useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  React.useEffect(() => {
    fetch("/data/shipments.json")
      .then((res) => res.json())
      .then((data) => setShipments(data))
      .catch((err) => console.error("Error loading shipments:", err));
  }, []);

  const mapContainerStyle = { width: "100%", height: "650px" };
  const defaultCenter = { lat: 20.5937, lng: 78.9629 };

  const delayedCount = shipments.filter((s) => s.status === "Delayed").length;
  const totalRoutes = shipments.length;
  const utilizationRate = shipments.length
    ? Math.round(((shipments.length - delayedCount) / shipments.length) * 100)
    : 0;

  // 🌿 Color logic for markers + routes
  const statusColors = {
    "In Transit": {
      marker: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      route: "#1E90FF",
    },
    Delayed: {
      marker: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      route: "#D9534F",
    },
    Delivered: {
      marker: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
      route: "#4CAF50",
    },
    default: {
      marker: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
      route: "#888888",
    },
  };

  // 🔍 Filter shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = statusFilter === "All" ? true : s.status === statusFilter;
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // 📌 Donut chart for CO₂ savings
  const CO2Donut = ({ savedPercent = 40 }) => {
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, savedPercent));
    const offset = circumference * (1 - clamped / 100);

    return (
      <div className="flex items-center gap-3">
        <svg width="70" height="70" className="shrink-0">
          <circle
            cx="35"
            cy="35"
            r={radius}
            stroke="#E0E8E0"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="35"
            cy="35"
            r={radius}
            stroke="#6ABF69"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 35 35)"
          />
        </svg>
        <div>
          <p className="text-xs text-cal-muted">CO₂ Saved vs Baseline</p>
          <p className="text-lg font-heading font-semibold text-cal-text">
            {clamped}%
          </p>
          <p className="text-[11px] text-cal-muted">
            Using consolidated & optimized routing.
          </p>
        </div>
      </div>
    );
  };

  // 🤖 AI insight card
  const AIInsight = ({ delayedCount, utilizationRate, selectedShipment }) => {
    let title = "AI Route Insight";
    let message =
      "Current routing pattern is stable. Consider consolidating nearby deliveries to unlock more CO₂ savings.";

    if (delayedCount > 0) {
      message =
        "Multiple routes are delayed. Try scheduling departures slightly earlier and avoiding peak congestion corridors.";
    }

    if (utilizationRate < 70) {
      message =
        "Fleet utilization is below optimal. Combining partially loaded routes could reduce both cost and emissions.";
    }

    if (selectedShipment && selectedShipment.status === "Delayed") {
      title = `AI Insight for ${selectedShipment.id}`;
      message =
        "This shipment is running behind schedule. Rerouting via a less congested corridor and pulling it into a consolidated drop could improve ETA and save fuel.";
    }

    return (
      <div className="bg-white rounded-soft shadow-sm border border-cal-border p-3 md:col-span-2 hover:shadow-md transition">
        <p className="text-xs font-semibold text-cal-muted mb-1">
          ✨ {title}
        </p>
        <p className="text-sm text-cal-text leading-snug">{message}</p>
      </div>
    );
  };

  // 📦 Simple delivery timeline
  const RouteTimeline = ({ shipment }) => {
    if (!shipment) {
      return (
        <div className="bg-white rounded-soft shadow-sm border border-cal-border p-3">
          <p className="text-xs text-cal-muted mb-1">Route Timeline</p>
          <p className="text-sm text-cal-muted">
            Select a shipment to view its latest route updates.
          </p>
        </div>
      );
    }

    // Mocked stages (you can wire real timestamps later)
    const steps = [
      {
        label: "Departed origin hub",
        time: shipment.departedAt || "Today · 08:15",
        status: "done",
      },
      {
        label: "Reached regional hub",
        time: shipment.hubTime || "Today · 12:40",
        status: "done",
      },
      {
        label: "On route to destination",
        time: "In progress",
        status: "current",
      },
      {
        label: "Scheduled delivery",
        time: shipment.eta || "Today · 18:30",
        status: "upcoming",
      },
    ];

    return (
      <div className="bg-white rounded-soft shadow-sm border border-cal-border p-3">
        <p className="text-xs text-cal-muted mb-2">Route Timeline — {shipment.id}</p>
        <ol className="relative border-l border-cal-border/70 ml-3 space-y-2">
          {steps.map((step, idx) => (
            <li key={idx} className="ml-3">
              <span
                className={`absolute -left-[7px] mt-1 w-3 h-3 rounded-full ${
                  step.status === "done"
                    ? "bg-cal-primary"
                    : step.status === "current"
                    ? "bg-amber-500"
                    : "bg-cal-border"
                }`}
              />
              <p className="text-xs font-medium text-cal-text">{step.label}</p>
              <p className="text-[11px] text-cal-muted">{step.time}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  // 💡 When a shipment is selected, request routes
  const handleShipmentSelect = (shipment) => {
    setSelectedShipment(shipment);
    setDirections(null);

    if (window.google) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: shipment.origin,
          destination: shipment.destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: "bestguess",
          },
        },
        (result, status) => {
          if (status === "OK" && result) setDirections(result);
          else console.error("Directions error:", status);
        }
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* ================= Stats ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-medium text-cal-muted">Total Routes</h3>
          <p className="mt-2 text-3xl font-bold text-cal-primary-deep">
            {totalRoutes}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-medium text-cal-muted">Delayed Routes</h3>
          <p className="mt-2 text-3xl font-bold text-red-500">{delayedCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-medium text-cal-muted">Utilization Rate</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {utilizationRate}%
          </p>
        </div>
      </div>

      {/* ================= Main Layout: List + Map ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== Shipment List ===== */}
        <div className="bg-white rounded-2xl shadow-sm p-4 overflow-y-auto max-h-[650px]">
          <h3 className="text-lg font-medium text-cal-text mb-4">Shipments</h3>

          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Search by ID, origin, destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cal-primary-soft"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cal-primary-soft"
            >
              <option value="All">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Delayed">Delayed</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <ul className="space-y-2">
            {filteredShipments.length === 0 ? (
              <p className="text-cal-muted text-sm">No matching shipments</p>
            ) : (
              filteredShipments.map((s) => (
                <li
                  key={s.id}
                  onClick={() => handleShipmentSelect(s)}
                  className={`cursor-pointer p-3 rounded-lg border transition transform ${
                    selectedShipment?.id === s.id
                      ? "bg-cal-primary-soft border-cal-primary translate-y-[1px] shadow-inner"
                      : "hover:bg-cal-bg border-cal-border hover:-translate-y-[1px] hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-cal-text">{s.id}</span>
                    <span
                      className={`text-sm font-semibold ${
                        s.status === "Delayed"
                          ? "text-red-600"
                          : s.status === "Delivered"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-cal-muted">
                    {s.origin} → {s.destination}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* ===== Map Section ===== */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <div>
              <h3 className="text-lg font-medium text-cal-text">Routes Map</h3>
              <p className="text-xs text-cal-muted">
                Select a shipment to see its optimized route and impact.
              </p>
            </div>
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`px-4 py-1.5 rounded-lg font-medium text-sm transition ${
                showTraffic
                  ? "bg-cal-primary text-white shadow-sm"
                  : "bg-cal-bg text-cal-text hover:bg-cal-primary-soft"
              }`}
            >
              {showTraffic ? "Hide Traffic" : "Show Traffic"}
            </button>
          </div>

          {/* 🌿 Optimization + Insights section */}
          {selectedShipment && (
            <div className="p-4 border-b border-cal-border bg-cal-bg/70 backdrop-blur-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                <h4 className="text-md font-heading font-semibold text-cal-text">
                  Route Optimization — {selectedShipment.id}
                </h4>
                <span className="text-[11px] text-cal-muted">
                  Compared to a typical baseline route for similar distance.
                </span>
              </div>

              {/* Metrics + donut */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border">
                  <p className="text-cal-muted text-xs">Distance</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="line-through text-cal-muted text-xs">
                      87 km
                    </span>
                    <span className="font-semibold text-cal-text">63 km</span>
                    <span className="text-green-600 font-bold">↓</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border">
                  <p className="text-cal-muted text-xs">Fuel Cost</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="line-through text-cal-muted text-xs">
                      ₹1400
                    </span>
                    <span className="font-semibold text-cal-text">₹920</span>
                    <span className="text-green-600 font-bold">↓</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border">
                  <p className="text-cal-muted text-xs">CO₂ Emissions</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="line-through text-cal-muted text-xs">
                      4.1 kg
                    </span>
                    <span className="font-semibold text-cal-text">2.3 kg</span>
                    <span className="text-green-600 font-bold">↓</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border flex items-center justify-center">
                  <CO2Donut savedPercent={40} />
                </div>
              </div>

              {/* AI insight + timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <AIInsight
                  delayedCount={delayedCount}
                  utilizationRate={utilizationRate}
                  selectedShipment={selectedShipment}
                />
                <RouteTimeline shipment={selectedShipment} />
              </div>
            </div>
          )}

          {/* Map */}
          <div className="flex-1">
            {loadError && (
              <div className="p-6 text-red-500 text-center">
                ❌ Error loading Google Maps
              </div>
            )}

            {!isLoaded && !loadError && (
              <div className="p-6 text-cal-muted text-center">
                ⏳ Loading Map...
              </div>
            )}

            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  selectedShipment
                    ? { lat: selectedShipment.lat, lng: selectedShipment.lng }
                    : defaultCenter
                }
                zoom={selectedShipment ? 6 : 5}
              >
                {/* Markers with size change on selection */}
                {filteredShipments.map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  let icon;

                  if (window.google) {
                    icon = {
                      url:
                        statusColors[s.status]?.marker ||
                        statusColors.default.marker,
                      scaledSize: new window.google.maps.Size(
                        isSelected ? 40 : 30,
                        isSelected ? 40 : 30
                      ),
                    };
                  } else {
                    icon =
                      statusColors[s.status]?.marker ||
                      statusColors.default.marker;
                  }

                  return (
                    <Marker
                      key={s.id}
                      position={{ lat: s.lat, lng: s.lng }}
                      icon={icon}
                      onClick={() => handleShipmentSelect(s)}
                      title={`${s.id} - ${s.status}`}
                    />
                  );
                })}

                {/* Info window */}
                {selectedShipment && (
                  <InfoWindow
                    position={{
                      lat: selectedShipment.lat,
                      lng: selectedShipment.lng,
                    }}
                    onCloseClick={() => {
                      setSelectedShipment(null);
                      setDirections(null);
                    }}
                  >
                    <div style={{ fontSize: "14px" }}>
                      <strong>Shipment {selectedShipment.id}</strong>
                      <br />
                      {selectedShipment.origin} → {selectedShipment.destination}
                      <br />
                      Status: {selectedShipment.status}
                    </div>
                  </InfoWindow>
                )}

                {/* Color-coded routes */}
                {directions &&
                  directions.routes.map((route, idx) => {
                    const mainColor =
                      statusColors[selectedShipment?.status]?.route ||
                      statusColors.default.route;

                    return (
                      <DirectionsRenderer
                        key={idx}
                        directions={{ ...directions, routes: [route] }}
                        options={{
                          polylineOptions: {
                            strokeColor: idx === 0 ? mainColor : "#A0A0A0",
                            strokeOpacity: idx === 0 ? 1 : 0.6,
                            strokeWeight: idx === 0 ? 6 : 4,
                          },
                          suppressMarkers: true,
                          preserveViewport: true,
                        }}
                      />
                    );
                  })}

                {showTraffic && <TrafficLayer />}
              </GoogleMap>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoutesPage;

