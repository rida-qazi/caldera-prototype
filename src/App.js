import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import React, { useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  useJsApiLoader,
  TrafficLayer,
} from "@react-google-maps/api";
import { useInView } from "react-intersection-observer";
import ShipmentFilters, { filterShipments } from "./components/ShipmentFilters";
import caLogo from "./assets/ca.png";
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import './index.css';
import Layout from "./components/Layout";
import { supabase } from "./supabaseClient";
import DeliveryPieChart from "./components/DeliveryPieChart";
import DelayLineChart from "./components/DelayLineChart";
console.log("Line chart component loaded:", DelayLineChart);


// =================== Dashboard Page ===================
function DashboardPage({ alerts }) {
  const [shipments, setShipments] = React.useState([]);
  const [selectedShipment, setSelectedShipment] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [directions, setDirections] = React.useState(null);
  const [analytics, setAnalytics] = React.useState(null);


  const { ref: mapRef, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
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

  function getStaticShipments() {
    return [
      {
        id: "SHP001",
        origin: "Mumbai, India",
        destination: "Delhi, India",
        lat: 19.0760,
        lng: 72.8777,
        status: "In Transit",
        predictedDelay: false
      },
      {
        id: "SHP002",
        origin: "Bengaluru, India",
        destination: "Hyderabad, India",
        lat: 12.9716,
        lng: 77.5946,
        status: "Delayed",
        predictedDelay: true
      },
      {
        id: "SHP003",
        origin: "Chennai, India",
        destination: "Kolkata, India",
        lat: 13.0827,
        lng: 80.2707,
        status: "Delivered",
        predictedDelay: false
      },
      {
        id: "SHP004",
        origin: "Ahmedabad, India",
        destination: "Pune, India",
        lat: 23.0225,
        lng: 72.5714,
        status: "In Transit",
        predictedDelay: false
      },
      {
        id: "SHP005",
        origin: "Jaipur, India",
        destination: "Lucknow, India",
        lat: 26.9124,
        lng: 75.7873,
        status: "Delayed",
        predictedDelay: true
      }
    ];
  }


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

  const filteredShipments = filterShipments(shipments, statusFilter, searchTerm);

  // ✅ Select shipment + draw route
  const handleShipmentSelect = (shipment) => {
    setSelectedShipment(shipment);
    if (window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: shipment.origin,
          destination: shipment.destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            setDirections(result);
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Top hero / intro */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-cal-primary-deep">
            Smart, greener deliveries 🌿
          </h1>
          <p className="text-sm text-cal-muted mt-1 max-w-xl">
            Monitor shipments, predict delays, and reduce emissions with Caldera’s intelligent logistics dashboard.
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
          <p className="mt-2 text-2xl font-heading text-cal-text">{analytics ? analytics.totalShipments : "..."}</p>
          <p className="text-[11px] text-cal-muted mt-1">
            Across all monitored routes.
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Delayed Deliveries</p>
          <p className="mt-2 text-2xl font-heading text-red-600">{analytics ? analytics.delayed : "..."}</p>
          <p className="text-[11px] text-cal-muted mt-1">
            Shipments currently marked as delayed.
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Utilization Rate</p>
          <p className="mt-2 text-2xl font-heading text-cal-primary-deep">
            {analytics ? Math.round((analytics.onTime / analytics.totalShipments) * 100) : "..."}%
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Higher is better — fewer disruptions.
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Predicted Risk</p>
          <p className="mt-2 text-2xl font-heading text-amber-600">
            {shipments.filter(s => s.predictedDelay).length}
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Shipments flagged with potential future delays.
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Avg Delay</p>
          <p className="mt-2 text-2xl font-heading text-cal-primary-deep">
            {analytics ? analytics.avgDelayHours.toFixed(1) : "..."} hrs
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Across all shipments with valid timestamps.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        {analytics && (
          <div className="h-full">
            <DeliveryPieChart analytics={analytics} />
          </div>
        )}
        {/* Line Chart */}
        {analytics?.delayTimeline && (
          <div className="h-full">
            <DelayLineChart data={analytics.delayTimeline} />
          </div>
        )}
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
        <div
          ref={mapRef}
          className="lg:col-span-2 glass-card shadow-sm overflow-hidden min-h-[320px] flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-cal-border/60">
            <div>
              <h3 className="text-sm font-heading text-cal-text">Live Shipment Map</h3>
              <p className="text-[11px] text-cal-muted">
                Click an alert or marker to inspect shipment details.
              </p>
            </div>
          </div>

          <div className="flex-1">
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
                    : { lat: 20.5937, lng: 78.9629 }
                }
                zoom={selectedShipment ? 6 : 5}
              >
                {filteredShipments.map((s) => (
                  <Marker
                    key={s.id}
                    position={{ lat: s.lat, lng: s.lng }}
                    icon={getMarkerIcon(s.status)}
                    title={`${s.id} - ${s.status}`}
                    onClick={() => handleShipmentSelect(s)}
                  />
                ))}

                {selectedShipment && (
                  <InfoWindow
                    position={{ lat: selectedShipment.lat, lng: selectedShipment.lng }}
                    onCloseClick={() => {
                      setSelectedShipment(null);
                      setDirections(null);
                    }}
                  >
                    <div style={{ fontSize: "12px" }}>
                      <strong>Shipment {selectedShipment.id}</strong>
                      <br />
                      Status: {selectedShipment.status}
                      <br />
                      {selectedShipment.origin} → {selectedShipment.destination}
                      {selectedShipment.predictedDelay && (
                        <>
                          <br />
                          <span className="text-amber-700 font-medium">
                            ⚠ Predicted Delay
                          </span>
                        </>
                      )}
                    </div>
                  </InfoWindow>
                )}

                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: { strokeColor: "#4E8055", strokeWeight: 5 },
                      suppressMarkers: true,
                    }}
                  />
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      </section>


    </div>
  );

}


// =================== Shipments Page ===================
function ShipmentsPage() {
  const [shipments, setShipments] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  

  const [sortBy, setSortBy] = React.useState("id"); // "id" | "origin" | "destination" | "status" | "risk"
  const [sortDirection, setSortDirection] = React.useState("asc"); // "asc" | "desc"

  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 5;

  const [selectedShipment, setSelectedShipment] = React.useState(null);

  // For mini map in modal
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // ============= Load shipments =============
  
  async function loadShipments() {
    try {
      let query = supabase
        .from("shipments")
        .select("*")
        .order("entry_date", { ascending: false });

      // ---- SEARCH FILTER ----
      if (searchTerm.trim().length > 0) {
        const t = searchTerm.trim();
        query = query.or(
          `order_number.ilike.%${t}%,order_id::text.ilike.%${t}%,product_name.ilike.%${t}%`
        );
      }

      // ---- STATUS FILTER ----
      if (statusFilter !== "All") {
        if (statusFilter === "On Hold") {
          query = query.eq("on_hold", true);
        } else {
          query = query.eq("current_status", statusFilter);
        }
      }

      const { data, error } = await query;
      console.log("🚚 RAW SHIPMENTS FROM SUPABASE:", data?.[0]);

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      // ---- NORMALIZE SHIPMENTS ----
      const rows = data.map((s) => {
        // Fix status
        const status =
          s.current_status ||
          (s.on_hold
            ? "On Hold"
            : s.movement_type === "2"
            ? "Delivered"
            : s.movement_type === "3"
            ? "Delayed"
            : "In Transit");

        // Origin fallback logic
        const origin =
          s.origin_city && s.origin_state
            ? `${s.origin_city}, ${s.origin_state}`
            : s.origin_pincode
            ? `Pincode ${s.origin_pincode}`
            : "Unknown";

        // Destination fallback logic
        const destination =
          s.dest_city && s.dest_state
            ? `${s.dest_city}, ${s.dest_state}`
            : s.dest_pincode
            ? `Pincode ${s.dest_pincode}`
            : "Unknown";

        // Smarter Predicted Delay Logic
        let predictedDelay = false;

        // Case 1: Shipment is already DELAYED → 50% chance predicted
        if (status === "Delayed") {
          predictedDelay = Math.random() < 0.5;
        }

        // Case 2: Shipment is ON TIME → small 5% chance predicted
        else if (status === "On Time") {
          predictedDelay = Math.random() < 0.05;
        }

        // Case 3: Shipment is IN TRANSIT → medium 20% chance predicted
        else if (status === "In Transit") {
          predictedDelay = Math.random() < 0.2;
        }

        // 📦 RISK SCORE LOGIC
        let baseRisk = 30; // everyone starts with 30

        // Actual Status impact
        if (status === "Delayed") baseRisk += 40;       // high impact
        else if (status === "In Transit") baseRisk += 15;
        else if (status === "On Time") baseRisk -= 10;

        // Predicted Delay impact
        if (predictedDelay) baseRisk += 20;

        // SLA Tightness
        if (s.actual_delivery && s.eta) {
          const diff = new Date(s.actual_delivery) - new Date(s.eta);
          if (diff > 0) baseRisk += 25;   // delivered late
          else baseRisk += 0;             // on-time deliveries unaffected
        }

        // Add soft randomness (±5)
        baseRisk += Math.floor(Math.random() * 10 - 5);

        // Clamp between 5 and 100
        const riskScore = Math.min(100, Math.max(5, baseRisk));



        return {
          ...s,
          id: String(s.id),

          origin,
          destination,
          status,

          // Temporary coords until GPS tracking is added
          lat: 20.5 + Math.random(),
          lng: 78.9 + Math.random(),

          predictedDelay,
          riskScore,

          delayHours:
            s.actual_delivery && s.eta
              ? (new Date(s.actual_delivery) - new Date(s.eta)) / 3600000
              : null,
        };
      });

      setShipments(rows);
    } catch (err) {
      console.error("Load shipments failed:", err);
    }
  }




 
  



  // Reset page when filters change

  React.useEffect(() => {
    loadShipments();
  }, [statusFilter, searchTerm]);

  // ============= Risk score helper (AI-ish 😎) =============
  const computeRiskScore = (shipment) => {
    let base = 10;

    if (shipment.status === "Delayed") base += 60;
    if (shipment.status === "In Transit") base += 30;
    if (shipment.status === "Delivered") base -= 20;

    if (shipment.predictedDelay) base += 25;

    // slight randomization so it looks “alive”
    base += Math.floor(Math.random() * 10) - 5; // -5 to +4

    return Math.max(0, Math.min(100, base));
  };

  // ============= Filter + sort + paginate =============

  const filteredShipments = filterShipments(
    shipments,
    statusFilter,
    searchTerm
  );

  const sortedShipments = React.useMemo(() => {
    const withRisk = filteredShipments.map((s) => ({
      ...s,
      _riskScore: computeRiskScore(s),
    }));

    const sorted = [...withRisk].sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case "origin":
          valA = a.origin.toLowerCase();
          valB = b.origin.toLowerCase();
          break;
        case "destination":
          valA = a.destination.toLowerCase();
          valB = b.destination.toLowerCase();
          break;
        case "status":
          valA = a.status.toLowerCase();
          valB = b.status.toLowerCase();
          break;
        case "risk":
          valA = a._riskScore;
          valB = b._riskScore;
          break;
        case "id":
        default:
          valA = a.id.toLowerCase();
          valB = b.id.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredShipments, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedShipments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedShipments = sortedShipments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ============= Sorting UI handler =============
  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey) return <span className="ml-1 text-gray-300">↕</span>;
    return (
      <span className="ml-1 text-gray-400">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // ============= Export CSV =============
  const handleExportCsv = () => {
    const headers = [
      "Shipment ID",
      "Origin",
      "Destination",
      "Status",
      "Predicted Delay",
      "Risk Score",
    ];

    const rows = sortedShipments.map((s) => [
      s.id,
      s.origin,
      s.destination,
      s.status,
      s.predictedDelay ? "Yes" : "No",
      computeRiskScore(s),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "caldera_shipments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // ============= Modal close =============
  const closeModal = () => setSelectedShipment(null);

  return (
    <div className="p-6 space-y-6">
      {/* ===== Top Bar: Filters + Export ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <ShipmentFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        <button
          onClick={handleExportCsv}
          className="self-start md:self-auto px-4 py-2 bg-cal-primary text-white rounded-lg text-sm hover:bg-cal-primary-deep transition"
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* ===== Table ===== */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-cal-primary-soft text-gray-800">
            <tr>
              <th
                className="px-6 py-3 text-left font-semibold cursor-pointer select-none"
                onClick={() => handleSort("id")}
              >
                Shipment ID {renderSortIcon("id")}
              </th>
              <th
                className="px-6 py-3 text-left font-semibold cursor-pointer select-none"
                onClick={() => handleSort("origin")}
              >
                Origin {renderSortIcon("origin")}
              </th>
              <th
                className="px-6 py-3 text-left font-semibold cursor-pointer select-none"
                onClick={() => handleSort("destination")}
              >
                Destination {renderSortIcon("destination")}
              </th>
              <th
                className="px-6 py-3 text-left font-semibold cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                Status {renderSortIcon("status")}
              </th>
              <th
                className="px-6 py-3 text-left font-semibold cursor-pointer select-none"
                onClick={() => handleSort("risk")}
              >
                Risk Score {renderSortIcon("risk")}
              </th>
            </tr>
          </thead>

          <tbody>
            {pagedShipments.map((s, idx) => {
              const risk = s._riskScore ?? computeRiskScore(s);

              let riskColor = "bg-green-100 text-green-700";
              if (risk >= 70) riskColor = "bg-red-100 text-red-700";
              else if (risk >= 40) riskColor = "bg-yellow-100 text-yellow-700";

              return (
                <tr
                  key={s.id}
                  className={`transition border-b last:border-none cursor-pointer
                    ${idx % 2 === 0 ? "bg-white" : "bg-cal-primary-soft/40"}
                    hover:bg-cal-primary-soft/80
                  `}
                  onClick={() => setSelectedShipment(s)}
                >
                  {/* Shipment ID + Predicted Delay */}
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    {s.id}
                    {s.predictedDelay && (
                      <span
                        className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Predicted Delay
                      </span>
                    )}
                  </td>

                  {/* Origin */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📦</span>
                      {s.origin}
                    </div>
                  </td>

                  {/* Destination */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📍</span>
                      {s.destination}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full
                      ${
                        s.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : s.status === "Delayed"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {s.status}
                    </span>
                  </td>

                  {/* Risk score */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${riskColor}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {risk} / 100
                    </span>
                  </td>
                </tr>
              );
            })}

            {pagedShipments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-400">
                  No shipments match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Pagination ===== */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>
          Showing{" "}
          {sortedShipments.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1}{" "}
          –{" "}
          {Math.min(currentPage * PAGE_SIZE, sortedShipments.length)} of{" "}
          {sortedShipments.length} shipments
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded-md disabled:opacity-40"
          >
            ◀
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded-md disabled:opacity-40"
          >
            ▶
          </button>
        </div>
      </div>

      {/* ===== Shipment Detail Modal ===== */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-11/12 max-w-xl relative p-6">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold text-cal-text mb-1">
              Shipment {selectedShipment.id}
            </h3>
            <p className="text-sm text-cal-muted mb-4">
              {selectedShipment.origin} → {selectedShipment.destination}
            </p>

            {/* Status + Risk */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full
                ${
                  selectedShipment.status === "Delivered"
                    ? "bg-green-100 text-green-700"
                    : selectedShipment.status === "Delayed"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }
              `}
              >
                {selectedShipment.status}
              </span>

              {selectedShipment.predictedDelay && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Predicted Delay
                </span>
              )}

              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                Risk: {computeRiskScore(selectedShipment)} / 100
              </span>
            </div>

            {/* Map preview */}
            <div className="mb-4">
              <p className="text-xs font-medium text-cal-muted mb-1">
                Live location preview
              </p>
              <div className="w-full h-48 rounded-xl overflow-hidden border border-cal-border">
                {loadError && (
                  <div className="w-full h-full flex items-center justify-center text-red-500 text-xs">
                    Error loading map
                  </div>
                )}
                {!loadError && !isLoaded && (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Loading map...
                  </div>
                )}
                {isLoaded && selectedShipment.lat && selectedShipment.lng && (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={{
                      lat: selectedShipment.lat,
                      lng: selectedShipment.lng,
                    }}
                    zoom={6}
                  >
                    <Marker
                      position={{
                        lat: selectedShipment.lat,
                        lng: selectedShipment.lng,
                      }}
                      title={selectedShipment.id}
                    />
                  </GoogleMap>
                )}
                {isLoaded &&
                  (!selectedShipment.lat || !selectedShipment.lng) && (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No live coordinates available for this shipment
                    </div>
                  )}
              </div>
            </div>

            {/* Footer info */}
            <div className="text-xs text-cal-muted space-y-1">
              <p>
                <span className="font-medium text-cal-text">Origin:</span>{" "}
                {selectedShipment.origin}
              </p>
              <p>
                <span className="font-medium text-cal-text">Destination:</span>{" "}
                {selectedShipment.destination}
              </p>
              {selectedShipment.eta && (
                <p>
                  <span className="font-medium text-cal-text">ETA:</span>{" "}
                  {selectedShipment.eta}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// =================== Routes Page ===================
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

// =================== Alerts Page ===================

function AlertsPage() {
  // ---------- Helpers ----------
  const [alerts, setAlerts] = React.useState([]);
  const getSeverity = (type) => {
    if (type.toLowerCase().includes("predicted")) return "medium";
    if (type.toLowerCase().includes("delay")) return "high";
    if (type.toLowerCase().includes("reroute")) return "low";
    return "low";
  };

  const getSeverityStyles = (sev) => {
    if (sev === "high")
      return "bg-red-100 text-red-700 border border-red-200";
    if (sev === "medium")
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    return "bg-blue-100 text-blue-700 border border-blue-200";
  };

  const estimateCO2Impact = () => {
    return (Math.random() * 0.6 + 0.2).toFixed(2); // 0.2–0.8 kg
  };

  const estimateDelayImpact = () => {
    return Math.floor(Math.random() * 60) + 10; // 10–70 mins
  };

  const estimateDownstreamImpact = () => {
    return Math.random() < 0.3 ? 2 : 0;
  };

  const getSuggestion = (type) => {
    if (type.toLowerCase().includes("delay"))
      return "Consider alternate low-traffic route.";
    if (type.toLowerCase().includes("predicted"))
      return "Shift departure by 20–30 mins to avoid congestion.";
    return "Monitor traffic and confirm ETA.";
  };

  // ---------- Root Cause Logic ----------

  React.useEffect(() => {

    // 🔄 Shuffle helper
    function shuffle(array) {
      return array
        .map((item) => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);
    }

    async function loadAlerts() {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error loading alerts:", error);
      } else {
        setAlerts(shuffle(data));  // 👈 MIXED ORDER
      }
    }

    loadAlerts();
  }, []);




  const getRootCause = (alert) => {
    const msg = alert.message.toLowerCase();
    const type = alert.type.toLowerCase();

    if (msg.includes("congestion") || msg.includes("traffic"))
      return "Traffic Congestion";
    if (msg.includes("weather") || msg.includes("rain") || msg.includes("storm"))
      return "Weather Disruption";
    if (msg.includes("hub") || msg.includes("processing"))
      return "Hub Processing Delay";
    if (msg.includes("reroute") || type.includes("reroute"))
      return "Route Inefficiency";
    if (msg.includes("driver") || msg.includes("schedule"))
      return "Driver Schedule Issue";

    // fallback
    return "Unknown – Requires Review";
  };

  const getRootCauseExplanation = (cause) => {
    switch (cause) {
      case "Traffic Congestion":
        return "Heavy congestion detected on major highway segments.";
      case "Weather Disruption":
        return "Recent weather conditions impacted travel time.";
      case "Hub Processing Delay":
        return "Sorting/handling delays at distribution hub.";
      case "Route Inefficiency":
        return "Current route has bottlenecks or slow segments.";
      case "Driver Schedule Issue":
        return "Driver shift timing mismatch or early/late departure.";
      default:
        return "Needs investigation.";
    }
  };

  // ---------- Group alerts ----------
  const today = [];
  const week = [];
  const older = [];

  alerts.forEach((a) => {
    const d = new Date(a.timestamp);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);

    if (diff <= 1) today.push(a);
    else if (diff <= 7) week.push(a);
    else older.push(a);
  });

  const sortBySeverity = (list) =>
    [...list].sort((a, b) => {
      const sevRank = { high: 3, medium: 2, low: 1 };
      return (
        sevRank[getSeverity(b.type)] - sevRank[getSeverity(a.type)]
      );
    });

  return (
    <div className="p-6 space-y-8">
      {/* ---------- Overview Cards ---------- */}
      <h2 className="text-3xl font-heading font-bold text-cal-text">
        Alerts Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">Total Alerts</p>
          <p className="text-3xl font-bold text-cal-primary">
            {alerts.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">High Severity</p>
          <p className="text-3xl font-bold text-red-500">
            {alerts.filter((a) => getSeverity(a.type) === "high").length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">Predicted Delays</p>
          <p className="text-3xl font-bold text-yellow-600">
            {alerts.filter((a) =>
              a.type.toLowerCase().includes("predicted")
            ).length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">Estimated CO₂ Impact Saved</p>
          <p className="text-xl font-bold text-cal-primary">
            ~{(alerts.length * 0.32).toFixed(2)} kg
          </p>
        </div>
      </div>

      {/* ---------- Section Lists ---------- */}
      {[
        { title: "Today", data: sortBySeverity(today) },
        { title: "This Week", data: sortBySeverity(week) },
        { title: "Older Alerts", data: sortBySeverity(older) },
      ].map(
        (section) =>
          section.data.length > 0 && (
            <div key={section.title} className="space-y-4">
              <h3 className="text-xl font-semibold text-cal-text">
                {section.title}
              </h3>

              <div className="bg-white rounded-2xl shadow divide-y">
                {section.data.map((a) => {
                  const severity = getSeverity(a.type);
                  const cause = getRootCause(a);

                  return (
                    <div
                      key={a.id}
                      className="p-4 hover:bg-cal-primary-soft transition"
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-heading font-semibold text-cal-text">
                            Shipment {a.shipmentId}
                          </p>
                          <p className="text-sm text-cal-muted">{a.message}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityStyles(
                            severity
                          )}`}
                        >
                          {a.type}
                        </span>
                      </div>

                      {/* Smart Insights Section */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <p className="text-cal-muted">
                          ⏱ Delay Impact:{" "}
                          <span className="font-medium">
                            {estimateDelayImpact()} mins
                          </span>
                        </p>
                        <p className="text-cal-muted">
                          🌍 CO₂ Impact:{" "}
                          <span className="font-medium">
                            {estimateCO2Impact()} kg
                          </span>
                        </p>
                        <p className="text-cal-muted">
                          🔁 Downstream Impact:{" "}
                          <span className="font-medium">
                            {estimateDownstreamImpact()} shipments
                          </span>
                        </p>
                      </div>

                      {/* Root Cause Analysis */}
                      <div className="mt-3 p-3">
                        <p className="text-sm font-medium text-cal-primary-deep">
                           Root Cause: {cause}
                        </p>
                        <p className="text-xs text-cal-muted mt-1">
                          {getRootCauseExplanation(cause)}
                        </p>
                      </div>

                      {/* Suggestion */}
                      <p className="mt-3 text-sm text-cal-primary-deep font-medium">
                        💡 {getSuggestion(a.type)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}





// =============================
// Mock Partners (same as yours)
// =============================
const initialPartners = [
  {
    id: 1,
    name: "DHL",
    description: "Global logistics partner",
    logo: "/logos/dhl.png",
    status: "Connected",
    lastSynced: "2h ago",
    hub: { lat: 28.6139, lng: 77.209 },
  },
  {
    id: 2,
    name: "FedEx",
    description: "Express delivery solutions",
    logo: "/logos/fedex.png",
    status: "Disconnected",
    lastSynced: null,
    hub: { lat: 19.076, lng: 72.8777 },
  },
  {
    id: 3,
    name: "Blue Dart",
    description: "Domestic logistics network",
    logo: "/logos/bluedart.png",
    status: "Connected",
    lastSynced: "5h ago",
    hub: { lat: 12.9716, lng: 77.5946 },
  },
];

// =============================
// Helper: Health Score
// =============================
function computeHealth(p) {
  let statusScore = p.status === "Connected" ? 60 : 0;
  let syncScore = p.lastSynced ? 30 : 5;
  let latencyScore = Math.floor(Math.random() * 10) + 5;

  return statusScore + syncScore + latencyScore;
}


// =================== Partners Page ===================

function PartnersPage() {
  const [partners, setPartners] = React.useState(initialPartners);
  const [showMap, setShowMap] = React.useState(false);
  const [pendingApiKey, setPendingApiKey] = React.useState({});
  const [connectingPartner, setConnectingPartner] = React.useState(null);
  const [selectedHub, setSelectedHub] = React.useState(null);

  // For the modal
  const [connectModal, setConnectModal] = React.useState({
    open: false,
    partner: null,
  });

  // Google Maps Loader
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // =============================
  // Actions
  // =============================
  const disconnectPartner = (id) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "Disconnected", lastSynced: null } : p
      )
    );
  };

  const syncPartner = (id) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, lastSynced: "Just now" } : p
      )
    );
  };

  const openConnectModal = (partner) => {
    setConnectModal({ open: true, partner });
  };

  const confirmConnect = () => {
    const p = connectModal.partner;
    const apiKey = pendingApiKey[p.id];

    if (!apiKey) return;

    setPartners((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? {
              ...x,
              status: "Connected",
              lastSynced: "Just now",
            }
          : x
      )
    );

    setPendingApiKey((prev) => ({ ...prev, [p.id]: "" }));
    setConnectModal({ open: false, partner: null });
  };

  // =============================
  // Mock summary stats
  // =============================
  function getSummaryStats() {
    return {
      orders: Math.floor(Math.random() * 200) + 20,
      latency: Math.floor(Math.random() * 400) + 150, // 150–550 ms
      activity: ["High", "Moderate", "Low"][Math.floor(Math.random() * 3)],
    };
  }

  // =============================
  // Page Render
  // =============================
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-cal-text">Partners</h2>

        <button
          onClick={() => setShowMap(true)}
          className="px-4 py-2 bg-cal-primary text-white rounded-lg hover:bg-cal-primary-deep transition"
        >
          📍 View All Hubs on Map
        </button>
      </div>

      <p className="text-cal-muted">
        Manage your logistics partners, monitor integration health, and sync data.
      </p>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((p) => {
          const health = computeHealth(p);
          const stats = getSummaryStats();

          return (
            <div
              key={p.id}
              className="bg-cal-surface border border-cal-border rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
            >
              {/* Logo + Name */}
              <div className="flex items-center gap-4">
                <img
                  src={p.logo}
                  alt={p.name}
                  className="w-12 h-12 rounded-full border border-cal-border"
                />
                <div>
                  <h3 className="text-lg font-semibold text-cal-text">
                    {p.name}
                  </h3>
                  <p className="text-sm text-cal-muted">{p.description}</p>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 space-y-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    p.status === "Connected"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.status}
                </span>

                {p.lastSynced && (
                  <p className="text-xs text-cal-muted">
                    ⏱ Last synced: {p.lastSynced}
                  </p>
                )}
              </div>

              <hr className="my-4 border-cal-border" />

              {/* Health */}
              <div>
                <p className="text-sm font-medium text-cal-text">
                  Integration Health:{" "}
                  <span
                    className={`font-semibold ${
                      health > 80
                        ? "text-green-600"
                        : health > 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {health}%
                  </span>
                </p>

                {/* Sync dots */}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-green-500 text-sm">●</span>
                  <span className="text-green-500 text-sm">●</span>
                  <span className="text-yellow-500 text-sm">●</span>
                </div>

                {/* Summary stats */}
                <p className="text-xs text-cal-muted mt-2">
                  Synced <span className="font-semibold">{stats.orders}</span> orders •{" "}
                  {stats.latency}ms latency • {stats.activity} hub activity
                </p>
              </div>

              <hr className="my-4 border-cal-border" />

              {/* Actions */}
              {p.status === "Connected" ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => syncPartner(p.id)}
                    className="px-3 py-2 text-sm rounded-lg bg-cal-primary-soft text-cal-primary hover:bg-green-100"
                  >
                    🔄 Sync Now
                  </button>

                  <button
                    onClick={() => disconnectPartner(p.id)}
                    className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openConnectModal(p)}
                  className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ================================
          Connect Modal
      ================================= */}
      {connectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
            <h3 className="text-lg font-semibold text-cal-text">
              Connect with {connectModal.partner.name}
            </h3>

            <p className="text-sm text-cal-muted mt-1">
              Enter your API key to enable secure integration.
            </p>

            <input
              type="text"
              className="border border-cal-border px-3 py-2 rounded-lg w-full mt-4"
              placeholder="API Key"
              value={pendingApiKey[connectModal.partner.id] || ""}
              onChange={(e) =>
                setPendingApiKey((prev) => ({
                  ...prev,
                  [connectModal.partner.id]: e.target.value,
                }))
              }
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConnectModal({ open: false, partner: null })}
                className="text-cal-muted px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!pendingApiKey[connectModal.partner.id]}
                onClick={confirmConnect}
                className="px-4 py-2 bg-cal-primary text-white rounded-lg disabled:opacity-40"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          HUB MAP MODAL
      ================================= */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-11/12 md:w-3/4 lg:w-2/3 relative">
            <button
              onClick={() => setShowMap(false)}
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg"
            >
              ✕
            </button>

            <div className="p-4 font-medium text-cal-text">All Partner Hubs</div>

            <div style={{ height: "500px", width: "100%" }}>
              {!isLoaded && <p className="text-center p-4">Loading map...</p>}

              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{ height: "100%", width: "100%" }}
                  center={{ lat: 20.5937, lng: 78.9629 }}
                  zoom={5}
                >
                  {partners.map((p) => (
                    <Marker
                      key={p.id}
                      position={p.hub}
                      onClick={() => setSelectedHub(p)}
                      icon={{
                        url:
                          p.status === "Connected"
                            ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                            : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      }}
                    />
                  ))}

                  {selectedHub && (
                    <InfoWindow
                      position={selectedHub.hub}
                      onCloseClick={() => setSelectedHub(null)}
                    >
                      <div style={{ fontSize: "13px" }}>
                        <strong>{selectedHub.name}</strong>
                        <br />
                        Status: {selectedHub.status}
                        <br />
                        {selectedHub.lastSynced
                          ? `Last synced: ${selectedHub.lastSynced}`
                          : "Not synced yet"}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




// =================== App ===================
export default function App() {
  const [alerts, setAlerts] = React.useState([]);

  React.useEffect(() => {
    const mockAlerts = [
      {
        id: 1,
        shipmentId: "SHIP-1023",
        type: "Predicted Delay",
        message: "High chance of delay on route Mumbai → Delhi",
        timestamp: "2025-09-06 14:22",
      },
      {
        id: 2,
        shipmentId: "SHIP-1017",
        type: "Delay",
        message: "Shipment delayed near Bengaluru hub",
        timestamp: "2025-09-05 19:40",
      },
      {
        id: 3,
        shipmentId: "SHIP-1009",
        type: "Reroute",
        message: "Shipment rerouted via Pune due to congestion",
        timestamp: "2025-09-04 09:15",
      },
    ];
    setAlerts(mockAlerts);
  }, []);

 return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage alerts={alerts} />} />
                <Route path="/shipments" element={<ShipmentsPage />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/alerts" element={<AlertsPage alerts={alerts} />} />
                <Route path="/partners" element={<PartnersPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}