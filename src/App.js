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


// =================== Dashboard Page ===================
function DashboardPage({ alerts }) {
  const [shipments, setShipments] = React.useState([]);
  const [selectedShipment, setSelectedShipment] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [directions, setDirections] = React.useState(null);

  const { ref: mapRef, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // ✅ Load shipments
  React.useEffect(() => {
    fetch("/data/shipments.json")
      .then((res) => res.json())
      .then((data) =>
        setShipments(
          data.map((s) => ({
            ...s,
            predictedDelay: Math.random() < 0.3,
          }))
        )
      )
      .catch((err) => console.error("Error loading shipments:", err));
  }, []);

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
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Active Shipments</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{shipments.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Delayed Deliveries</h3>
          <p className="mt-2 text-3xl font-bold text-red-500">{delayedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Utilization Rate</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{utilizationRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <ShipmentFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Alerts + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Alerts</h3>
          <ul className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent alerts 🎉</p>
            ) : (
              alerts.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  onClick={() => {
                    console.log("Clicked alert:", a.shipmentId);
                    console.log("Shipments:", shipments);

                    const match = shipments.find(
                      (s) => s.id === a.shipmentId || s.shipmentId === a.shipmentId
                    );

                    console.log("Match found:", match);

                    if (match) {
                      handleShipmentSelect(match);
                    } else {
                      console.warn("No shipment matched:", a.shipmentId);
                    }
                  }}
                  className={`cursor-pointer text-sm px-3 py-2 rounded-lg transition
                    ${
                      a.type.toLowerCase().includes("delay")
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : a.type.toLowerCase().includes("reroute")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                >
                  <span className="font-medium">{a.shipmentId}</span> → {a.type}
                  <span className="block text-xs text-gray-500">{a.timestamp}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Map */}
        <div ref={mapRef} className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          {!inView && (
            <div className="p-6 text-gray-500 text-center">
              📍 Map will load when visible...
            </div>
          )}
          {inView && loadError && (
            <div className="p-6 text-red-500 text-center">
              ❌ Error loading Google Maps. Please check your connection or API key.
            </div>
          )}
          {inView && !isLoaded && !loadError && (
            <div className="p-6 text-gray-500 text-center">⏳ Loading Map...</div>
          )}
          {inView && isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={
                selectedShipment
                  ? { lat: selectedShipment.lat, lng: selectedShipment.lng }
                  : defaultCenter
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
                  <div style={{ fontSize: "14px" }}>
                    <strong>Shipment {selectedShipment.id}</strong>
                    <br />
                    Status: {selectedShipment.status}
                    <br />
                    Origin: {selectedShipment.origin}
                    <br />
                    Destination: {selectedShipment.destination}
                    {selectedShipment.predictedDelay && (
                      <>
                        <br />
                        <span className="text-yellow-600 font-medium">
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
                    polylineOptions: { strokeColor: "#1E90FF", strokeWeight: 5 },
                    suppressMarkers: true,
                  }}
                />
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  );
}


// =================== Shipments Page ===================
function ShipmentsPage() {
  const [shipments, setShipments] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    fetch("/data/shipments.json")
      .then((res) => res.json())
      .then((data) =>
        setShipments(
          data.map((s) => ({
            ...s,
            predictedDelay: Math.random() < 0.3, // mock prediction
          }))
        )
      )
      .catch((err) => console.error("Error loading shipments:", err));
  }, []);

  const filteredShipments = filterShipments(shipments, statusFilter, searchTerm);

  return (
    <div className="p-6 space-y-6">
      <ShipmentFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <table className="w-full text-sm text-left text-gray-600 bg-white rounded-2xl shadow-sm overflow-hidden">
        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
          <tr>
            <th className="px-6 py-3">Shipment ID</th>
            <th className="px-6 py-3">Origin</th>
            <th className="px-6 py-3">Destination</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredShipments.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="px-6 py-4 font-medium flex items-center gap-2">
                {s.id}
                {s.predictedDelay && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Predicted Delay
                  </span>
                )}
              </td>
              <td className="px-6 py-4">{s.origin}</td>
              <td className="px-6 py-4">{s.destination}</td>
              <td
                className={`px-6 py-4 font-semibold ${
                  s.status === "Delayed"
                    ? "text-red-600"
                    : s.status === "Delivered"
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {s.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =================== Other Pages ===================
function RoutesPage() {
  const [shipments, setShipments] = React.useState([]);
  const [selectedShipment, setSelectedShipment] = React.useState(null);
  const [directions, setDirections] = React.useState(null);

  // ✅ Filters
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");

  // ✅ Traffic toggle
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

  // ✅ Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesStatus =
      statusFilter === "All" ? true : s.status === statusFilter;
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ✅ Select shipment + request multiple routes with traffic
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
          provideRouteAlternatives: true, // 🚀 Multiple routes
          drivingOptions: {
            departureTime: new Date(), // 🚦 Real-time traffic
            trafficModel: "bestguess",
          },
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
    <div className="p-6 space-y-6">
      {/* ================= Stats ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Total Routes</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{totalRoutes}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Delayed Routes</h3>
          <p className="mt-2 text-3xl font-bold text-red-500">{delayedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700">Utilization Rate</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {utilizationRate}%
          </p>
        </div>
      </div>

      {/* ================= Main Layout: List + Map ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== Shipment List with Filters ===== */}
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:col-span-1 overflow-y-auto max-h-[650px]">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Shipments</h3>

          {/* Filters */}
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Search by ID, origin, destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Delayed">Delayed</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <ul className="space-y-2">
            {filteredShipments.length === 0 ? (
              <p className="text-gray-500 text-sm">No matching shipments</p>
            ) : (
              filteredShipments.map((s) => (
                <li
                  key={s.id}
                  onClick={() => handleShipmentSelect(s)}
                  className={`cursor-pointer p-3 rounded-lg border transition ${
                    selectedShipment?.id === s.id
                      ? "bg-blue-50 border-blue-400"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-800">{s.id}</span>
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
                  <p className="text-xs text-gray-500">
                    {s.origin} → {s.destination}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* ===== Map ===== */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <h3 className="text-lg font-medium text-gray-700">Routes Map</h3>
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`px-4 py-1.5 rounded-lg font-medium text-sm transition ${
                showTraffic
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {showTraffic ? "Hide Traffic" : "Show Traffic"}
            </button>
          </div>

          {loadError && (
            <div className="p-6 text-red-500 text-center">
              ❌ Error loading Google Maps
            </div>
          )}
          {!isLoaded && !loadError && (
            <div className="p-6 text-gray-500 text-center">⏳ Loading Map...</div>
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
              {filteredShipments.map((s) => (
                <Marker
                  key={s.id}
                  position={{ lat: s.lat, lng: s.lng }}
                  onClick={() => handleShipmentSelect(s)}
                  title={`${s.id} - ${s.status}`}
                />
              ))}

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

              {directions &&
                directions.routes.map((route, idx) => (
                  <DirectionsRenderer
                    key={idx}
                    directions={{ ...directions, routes: [route] }}
                    options={{
                      polylineOptions: {
                        strokeColor: idx === 0 ? "#1E90FF" : "#A0A0A0", // main vs alternate
                        strokeOpacity: 0.8,
                        strokeWeight: idx === 0 ? 6 : 4,
                      },
                      suppressMarkers: true,
                      preserveViewport: true,
                    }}
                  />
                ))}

              {showTraffic && <TrafficLayer />}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  );
}


function AlertsPage({ alerts }) {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">All Alerts</h2>

      <div className="bg-white shadow-sm rounded-2xl divide-y">
        {alerts.length === 0 ? (
          <p className="p-4 text-gray-500">No alerts at the moment 🎉</p>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-800">
                  Shipment {a.shipmentId}
                </p>
                <p className="text-sm text-gray-500">{a.message}</p>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                    a.type.toLowerCase().includes("delay")
                      ? "bg-red-100 text-red-700"
                      : a.type.toLowerCase().includes("reroute")
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {a.type}
                </span>
                <span className="text-xs text-gray-400">{a.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



const initialPartners = [
  {
    id: 1,
    name: "DHL",
    description: "Global logistics partner",
    logo: "/logos/dhl.png",
    status: "Connected",
    lastSynced: "2h ago",
    hub: { lat: 28.6139, lng: 77.209 }, // Delhi hub
  },
  {
    id: 2,
    name: "FedEx",
    description: "Express delivery solutions",
    logo: "/logos/fedex.png",
    status: "Disconnected",
    lastSynced: null,
    hub: { lat: 19.076, lng: 72.8777 }, // Mumbai hub
  },
  {
    id: 3,
    name: "Blue Dart",
    description: "Domestic logistics network",
    logo: "/logos/bluedart.png",
    status: "Connected",
    lastSynced: "5h ago",
    hub: { lat: 12.9716, lng: 77.5946 }, // Bangalore hub
  },
];

function PartnersPage() {
  const [partners, setPartners] = React.useState(initialPartners);
  const [showMap, setShowMap] = React.useState(false);
  const [pendingApiKey, setPendingApiKey] = React.useState({});
  const [connectingPartner, setConnectingPartner] = React.useState(null);
  const [selectedHub, setSelectedHub] = React.useState(null);

  // Google Maps Loader
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // ===== Handlers =====
  const connectPartner = (id) => {
    const apiKey = pendingApiKey[id];
    if (!apiKey) return;

    setPartners((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "Connected", lastSynced: "Just now" } : p
      )
    );
    setPendingApiKey((prev) => ({ ...prev, [id]: "" }));
    setConnectingPartner(null);
  };

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

  // ===== Render =====
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Partners</h2>
        <button
          onClick={() => setShowMap(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          📍 View All Hubs on Map
        </button>
      </div>
      <p className="text-gray-600">
        Manage your logistics and delivery partners, sync data, and monitor
        integration health.
      </p>

      {/* Partner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition flex flex-col justify-between"
          >
            {/* Partner Logo + Name */}
            <div className="flex items-center space-x-3">
              <img
                src={p.logo}
                alt={p.name}
                className="w-12 h-12 rounded-full border"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.description}</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4">
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  p.status === "Connected"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {p.status}
              </span>
              {p.lastSynced && (
                <p className="text-xs text-gray-500 mt-1">
                  ⏱ Last synced: {p.lastSynced}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2">
              {p.status === "Connected" ? (
                <>
                  <button
                    onClick={() => disconnectPartner(p.id)}
                    className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={() => syncPartner(p.id)}
                    className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    🔄 Sync
                  </button>
                </>
              ) : connectingPartner === p.id ? (
                <>
                  <input
                    type="text"
                    placeholder="Enter API Key"
                    className="border px-3 py-2 text-sm rounded-lg w-full"
                    value={pendingApiKey[p.id] || ""}
                    onChange={(e) =>
                      setPendingApiKey((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => connectPartner(p.id)}
                    disabled={!pendingApiKey[p.id]}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                  >
                    Confirm Connect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConnectingPartner(p.id)}
                  className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Map Modal (global for all partners) */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-11/12 md:w-3/4 lg:w-2/3 relative">
            <button
              onClick={() => setShowMap(false)}
              className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 z-50"
            >
              ✕
            </button>
            <div className="p-4 text-gray-700 font-medium">All Partner Hubs</div>
            <div style={{ height: "500px", width: "100%" }}>
              {loadError && (
                <div className="p-6 text-red-500 text-center">
                  ❌ Error loading map
                </div>
              )}
              {!isLoaded && !loadError && (
                <div className="p-6 text-gray-500 text-center">
                  ⏳ Loading map...
                </div>
              )}

              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{ lat: 20.5937, lng: 78.9629 }}
                  zoom={5}
                >
                  {partners.map(
                    (p) =>
                      p.hub && (
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
                      )
                  )}

                  {selectedHub && (
                    <InfoWindow
                      position={selectedHub.hub}
                      onCloseClick={() => setSelectedHub(null)}
                    >
                      <div style={{ fontSize: "14px" }}>
                        <strong>{selectedHub.name}</strong> <br />
                        Status:{" "}
                        <span
                          className={
                            selectedHub.status === "Connected"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {selectedHub.status}
                        </span>
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







// =================== Layout ===================
function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const routeToTitle = {
    "/dashboard": "Dashboard",
    "/shipments": "Shipments",
    "/routes": "Routes",
    "/alerts": "Alerts",
    "/partners": "3PL Partners",
  };
  const pageTitle = routeToTitle[location.pathname] || "";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden sm:block fixed h-full">
        <div className="h-full flex flex-col justify-between p-4">
          <div>
            {/* Logo + Title */}
            <NavLink to="/dashboard" className="flex items-center gap-3 mb-6">
              

              <img
                src={caLogo}
                alt="Caldera Logo"
                className="h-12 w-12 object-contain shadow-sm"
              />

              
              <span className="text-2xl font-bold text-blue-600 tracking-tight">
                Caldera
              </span>
            </NavLink>

            {/* Navigation Links */}
            {["dashboard", "shipments", "routes", "alerts", "partners"].map((link) => (
              <NavLink
                key={link}
                to={`/${link}`}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`
                }
              >
                {link.charAt(0).toUpperCase() + link.slice(1)}
              </NavLink>
            ))}
          </div>

          {/* Footer */}
          <div className="text-sm text-gray-400">© 2025 Caldera</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col pl-64">
        <header className="flex items-center justify-between bg-white px-6 py-4 border-b shadow-sm fixed left-64 right-0 top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">{pageTitle}</h2>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-blue-600">🔔</button>
            <div className="relative">
              <img
                src="/user.jpg"
                alt="User Avatar"
                className="h-8 w-8 rounded-full object-cover border border-gray-300 cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50">
                  <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Settings
                  </a>
                  <a href="#" className="block px-4 py-2 text-red-600 hover:bg-gray-100">
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="mt-16">{children}</div>
      </main>
    </div>
  );
}

// =================== App ===================

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

