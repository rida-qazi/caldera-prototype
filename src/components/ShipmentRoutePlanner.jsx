import React from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  TrafficLayer,
} from "@react-google-maps/api";
import { useGoogleMaps } from "./GoogleMapsLoader";

const mapContainerStyle = { width: "100%", height: "520px" };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const statusColors = {
  "In Transit": {
    marker: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    route: "#1E90FF",
  },
  Delayed: {
    marker: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    route: "#D9534F",
  },
  Delivered: {
    marker: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
    route: "#4CAF50",
  },
  default: {
    marker: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    route: "#888888",
  },
};

function CO2Donut({ savedPercent = 40 }) {
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
          Using consolidated and optimized routing.
        </p>
      </div>
    </div>
  );
}

function AIInsight({ delayedCount, utilizationRate, selectedShipment }) {
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

  if (selectedShipment?.status === "Delayed") {
    title = `AI Insight for ${selectedShipment.id}`;
    message =
      "This shipment is running behind schedule. Rerouting via a less congested corridor could improve ETA and save fuel.";
  }

  return (
    <div className="bg-white rounded-soft shadow-sm border border-cal-border p-3 md:col-span-2">
      <p className="text-xs font-semibold text-cal-muted mb-1">✨ {title}</p>
      <p className="text-sm text-cal-text leading-snug">{message}</p>
    </div>
  );
}

function RouteTimeline({ shipment }) {
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
      <p className="text-xs text-cal-muted mb-2">
        Route Timeline — {shipment.id}
      </p>
      <ol className="relative border-l border-cal-border/70 ml-3 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="ml-3">
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
}

export default function ShipmentRoutePlanner({
  shipments,
  selectedShipment,
  onSelectShipment,
}) {
  const [directions, setDirections] = React.useState(null);
  const [showTraffic, setShowTraffic] = React.useState(false);
  const { isLoaded, loadError } = useGoogleMaps();

  const delayedCount = shipments.filter(
    (shipment) => shipment.status === "Delayed"
  ).length;
  const utilizationRate = shipments.length
    ? Math.round(((shipments.length - delayedCount) / shipments.length) * 100)
    : 0;

  React.useEffect(() => {
    setDirections(null);

    if (!selectedShipment || !isLoaded || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: selectedShipment.origin,
        destination: selectedShipment.destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: "bestguess",
        },
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        } else {
          console.error("Directions error:", status);
        }
      }
    );
  }, [isLoaded, selectedShipment]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-cal-muted">Visible Shipments</p>
          <p className="mt-2 text-2xl font-bold text-cal-primary-deep">
            {shipments.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-cal-muted">Delayed Routes</p>
          <p className="mt-2 text-2xl font-bold text-red-500">
            {delayedCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-cal-muted">Utilization Rate</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {utilizationRate}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b">
          <div>
            <h3 className="text-lg font-medium text-cal-text">
              Route Planning
            </h3>
            <p className="text-xs text-cal-muted">
              Select Route in the table or choose a marker to inspect alternatives.
            </p>
          </div>
          <button
            onClick={() => setShowTraffic((visible) => !visible)}
            className={`px-4 py-1.5 rounded-lg font-medium text-sm transition ${
              showTraffic
                ? "bg-cal-primary text-white shadow-sm"
                : "bg-cal-bg text-cal-text hover:bg-cal-primary-soft"
            }`}
          >
            {showTraffic ? "Hide Traffic" : "Show Traffic"}
          </button>
        </div>

        {selectedShipment && (
          <div className="p-4 border-b border-cal-border bg-cal-bg/70 space-y-4">
            <div>
              <h4 className="font-heading font-semibold text-cal-text">
                Route Optimization — {selectedShipment.id}
              </h4>
              <p className="text-xs text-cal-muted">
                {selectedShipment.origin} → {selectedShipment.destination}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border">
                <p className="text-cal-muted text-xs">Distance</p>
                <p className="mt-1">
                  <span className="line-through text-cal-muted text-xs">
                    87 km
                  </span>{" "}
                  <span className="font-semibold text-cal-text">63 km</span>
                </p>
              </div>
              <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border">
                <p className="text-cal-muted text-xs">Fuel Cost</p>
                <p className="mt-1">
                  <span className="line-through text-cal-muted text-xs">
                    ₹1400
                  </span>{" "}
                  <span className="font-semibold text-cal-text">₹920</span>
                </p>
              </div>
              <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border">
                <p className="text-cal-muted text-xs">CO₂ Emissions</p>
                <p className="mt-1">
                  <span className="line-through text-cal-muted text-xs">
                    4.1 kg
                  </span>{" "}
                  <span className="font-semibold text-cal-text">2.3 kg</span>
                </p>
              </div>
              <div className="bg-white p-3 rounded-soft shadow-sm border border-cal-border flex items-center justify-center">
                <CO2Donut savedPercent={40} />
              </div>
            </div>

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

        {loadError && (
          <div className="p-6 text-red-500 text-center">
            Error loading Google Maps
          </div>
        )}
        {!isLoaded && !loadError && (
          <div className="p-6 text-cal-muted text-center">Loading map...</div>
        )}
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={
              selectedShipment
                ? {
                    lat: selectedShipment.lat,
                    lng: selectedShipment.lng,
                  }
                : defaultCenter
            }
            zoom={selectedShipment ? 6 : 5}
          >
            {shipments.map((shipment) => {
              const isSelected = selectedShipment?.id === shipment.id;
              const icon = {
                url:
                  statusColors[shipment.status]?.marker ||
                  statusColors.default.marker,
                scaledSize: new window.google.maps.Size(
                  isSelected ? 40 : 30,
                  isSelected ? 40 : 30
                ),
              };

              return (
                <Marker
                  key={shipment.id}
                  position={{ lat: shipment.lat, lng: shipment.lng }}
                  icon={icon}
                  onClick={() => onSelectShipment(shipment)}
                  title={`${shipment.id} - ${shipment.status}`}
                />
              );
            })}

            {selectedShipment && (
              <InfoWindow
                position={{
                  lat: selectedShipment.lat,
                  lng: selectedShipment.lng,
                }}
                onCloseClick={() => onSelectShipment(null)}
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
              directions.routes.map((route, index) => {
                const mainColor =
                  statusColors[selectedShipment?.status]?.route ||
                  statusColors.default.route;

                return (
                  <DirectionsRenderer
                    key={route.summary || index}
                    directions={{ ...directions, routes: [route] }}
                    options={{
                      polylineOptions: {
                        strokeColor: index === 0 ? mainColor : "#A0A0A0",
                        strokeOpacity: index === 0 ? 1 : 0.6,
                        strokeWeight: index === 0 ? 6 : 4,
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
    </section>
  );
}

