import React from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import ShipmentFilters, { filterShipments } from "../components/ShipmentFilters";
import { supabase } from "../supabaseClient";
import { useGoogleMaps } from "../components/GoogleMapsLoader";

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
 
  

  const { isLoaded, loadError } = useGoogleMaps();


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

export default ShipmentsPage;

