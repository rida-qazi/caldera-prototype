import React from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "../components/GoogleMapsLoader";

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
 
 

  const { isLoaded, loadError } = useGoogleMaps();


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

export default PartnersPage;

