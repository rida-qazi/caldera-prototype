import React, { useMemo, useState, useEffect } from "react";
import { GoogleMap, Marker, DirectionsRenderer, } from "@react-google-maps/api";
import ShipmentFilters, {
  filterShipments,
} from "../components/ShipmentFilters";
import { useGoogleMaps } from "../components/GoogleMapsLoader";

/* =========================================================
   MOCK DATABASE
========================================================= */

const shipments = [
  {
    id: "SHP-24018",
    vehicle: "KA01AB1234",
    origin: "Bengaluru",
    destination: "Mysuru",
    status: "In Transit",
    eta: "4:35 PM",
    speed: "54 km/h",
    risk: "Low",
    predictedDelay: false,

    lat: 12.9716,
    lng: 77.5946,

    route: [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.684, lng: 77.19 },
      { lat: 12.2958, lng: 76.6394 },
    ],
  },

  {
    id: "SHP-24021",
    vehicle: "KA05CD5678",
    origin: "Hubballi",
    destination: "Belagavi",
    status: "Delayed",
    eta: "7:10 PM",
    speed: "39 km/h",
    risk: "High",
    predictedDelay: true,

    lat: 15.3647,
    lng: 75.124,

    route: [
      { lat: 15.3647, lng: 75.124 },
      { lat: 15.67, lng: 74.87 },
      { lat: 15.8497, lng: 74.4977 },
    ],
  },

  {
    id: "SHP-24025",
    vehicle: "KA03EF9012",
    origin: "Chennai",
    destination: "Bengaluru",
    status: "In Transit",
    eta: "6:05 PM",
    speed: "61 km/h",
    risk: "Medium",
    predictedDelay: false,

    lat: 13.0827,
    lng: 80.2707,

    route: [
      { lat: 13.0827, lng: 80.2707 },
      { lat: 12.7, lng: 79.8 },
      { lat: 12.9716, lng: 77.5946 },
    ],
  },

  {
    id: "SHP-24030",
    vehicle: "TN09GH3456",
    origin: "Hyderabad",
    destination: "Vijayawada",
    status: "Delivered",
    eta: "--",
    speed: "--",
    risk: "Low",
    predictedDelay: false,

    lat: 17.385,
    lng: 78.4867,

    route: [
      { lat: 17.385, lng: 78.4867 },
      { lat: 16.8, lng: 79.7 },
      { lat: 16.5062, lng: 80.648 },
    ],
  },
];

/* ========================================================= */

function ShipmentsPage() {
  const { isLoaded } = useGoogleMaps();

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [directions, setDirections] = useState(null);

  useEffect(() => {

    if (!selectedShipment || !window.google) {
      setDirections(null);
      return;
    }

    const directionsService =
      new window.google.maps.DirectionsService();

    directionsService.route(
      {

        origin: selectedShipment.origin,

        destination: selectedShipment.destination,

        travelMode:
          window.google.maps.TravelMode.DRIVING,

      },

      (result, status) => {

        if (status === "OK") {

          setDirections(result);

        }

      }

    );

  }, [selectedShipment]);

  
  const filteredShipments = useMemo(() => {
    return filterShipments(
      shipments,
      statusFilter,
      searchTerm
    );
  }, [statusFilter, searchTerm]);

  
  return (
    <div className="space-y-6">

      {/* ================= Header ================= */}

      <div>


        <br></br>
        <p className="text-sm text-cal-muted mt-1 max-w-xl">
          Track live shipments, monitor routes and predict delays.
        </p>

      </div>

      {/* ================= Filters ================= */}

      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">

        <div className="flex-1">

          <ShipmentFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

        </div>

        <button
          className="px-5 py-2 bg-cal-primary text-white rounded-xl hover:bg-cal-primary-deep transition"
        >
          Export CSV
        </button>

      </div>


      {/* ================= Shipment Table ================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-cal-primary-soft text-gray-800">

            <tr>

              <th className="px-6 py-3 text-left font-semibold">
                Shipment
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Vehicle
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Destination
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                ETA
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Status
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Risk
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredShipments.map((shipment) => (

              <tr
                key={shipment.id}
                onClick={() => setSelectedShipment(shipment)}
                className={`border-t cursor-pointer transition hover:bg-gray-50 ${
                  selectedShipment?.id === shipment.id
                    ? "bg-cal-primary-soft"
                    : ""
                }`}
              >

                <td className="px-6 py-4 font-medium">

                  {shipment.id}

                </td>

                <td className="px-6 py-4">

                  {shipment.vehicle}

                </td>

                <td className="px-6 py-4">

                  {shipment.destination}

                </td>

                <td className="px-6 py-4">

                  {shipment.eta}

                </td>

                <td className="px-6 py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      shipment.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : shipment.status === "In Transit"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >

                    {shipment.status}

                  </span>

                </td>

                <td className="px-6 py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      shipment.risk === "Low"
                        ? "bg-green-100 text-green-700"
                        : shipment.risk === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >

                    {shipment.risk}

                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* ================= Operational Summary ================= */}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Active Shipments</p>
          <p className="mt-2 text-2xl font-heading text-cal-text">24</p>

        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Delayed</p>
          <p className="mt-2 text-2xl font-heading text-red-600">3</p>

        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Average ETA</p>
          <p className="mt-2 text-2xl font-heading text-cal-primary-deep">2.8 hrs</p>

        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">High Risk</p>
          <p className="mt-2 text-2xl font-heading text-amber-600">
            2
          </p>

        </div>
        
      </section>


      {/* ================= Shipment Details + Map ================= */}

      <div className="grid lg:grid-cols-3 gap-6">




        {/* ================= LEFT PANEL ================= */}

        {selectedShipment && (

          <div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full">

              <h2 className="text-xl font-semibold mb-6">
                {selectedShipment.id}
              </h2>

              <div className="grid grid-cols-2 gap-5 text-sm">

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cal-muted">
                    Vehicle
                  </p>

                  <p className="font-medium mt-1">
                    {selectedShipment.vehicle}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cal-muted">
                    Status
                  </p>

                  <p className="font-medium mt-1">
                    {selectedShipment.status}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cal-muted">
                    Origin
                  </p>

                  <p className="font-medium mt-1">
                    {selectedShipment.origin}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cal-muted">
                    Destination
                  </p>

                  <p className="font-medium mt-1">
                    {selectedShipment.destination}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cal-muted">
                    ETA
                  </p>

                  <p className="font-medium mt-1">
                    {selectedShipment.eta}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cal-muted">
                    Current Speed
                  </p>

                  <p className="font-medium mt-1">
                    {selectedShipment.speed}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cal-muted">
                    Delay Prediction
                  </p>

                  <p
                    className={`font-medium mt-1 ${
                      selectedShipment.predictedDelay
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedShipment.predictedDelay
                      ? "High Risk"
                      : "Low Risk"}
                  </p>
                </div>

              </div>

              {/* AI Insight */}

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                <h3 className="font-semibold text-blue-700 mb-2">
                  AI Insight
                </h3>

                <p className="text-sm text-gray-700">

                  {selectedShipment.predictedDelay
                    ? "Heavy traffic expected ahead. Suggested reroute via alternate highway."
                    : "Shipment is progressing normally. No operational issues detected."}

                </p>

              </div>

              {/* Timeline */}

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">

                <h3 className="text-lg font-semibold text-cal-heading mb-5">
                  Shipment Timeline
                </h3>

                <div className="relative ml-3">

                  {/* Vertical Line */}
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200"></div>

                  {/* Step 1 */}
                  <div className="relative flex items-start mb-6">

                    <div className="w-4 h-4 rounded-full bg-green-500 z-10"></div>

                    <div className="ml-5">

                      <p className="font-medium text-gray-800">
                        Pickup Complete
                      </p>

                      <p className="text-sm text-gray-500">
                        Today • 08:15
                      </p>

                    </div>

                  </div>

                  {/* Step 2 */}

                  <div className="relative flex items-start mb-6">

                    <div className="w-4 h-4 rounded-full bg-green-500 z-10"></div>

                    <div className="ml-5">

                      <p className="font-medium text-gray-800">
                        Left Origin Hub
                      </p>

                      <p className="text-sm text-gray-500">
                        Today • 09:40
                      </p>

                    </div>

                  </div>

                  {/* Step 3 */}

                  <div className="relative flex items-start mb-6">

                    <div className="w-4 h-4 rounded-full bg-orange-500 z-10"></div>

                    <div className="ml-5">

                      <p className="font-medium text-gray-800">
                        Currently In Transit
                      </p>

                      <p className="text-sm text-orange-600">
                        In Progress
                      </p>

                    </div>

                  </div>

                  {/* Step 4 */}

                  <div className="relative flex items-start">

                    <div className="w-4 h-4 rounded-full bg-gray-300 z-10"></div>

                    <div className="ml-5">

                      <p className="font-medium text-gray-400">
                        Destination Delivery
                      </p>

                      <p className="text-sm text-gray-400">
                        Estimated • 4:35 PM
                      </p>

                    </div>

                  </div>

                </div>

              </div>              

            </div>

          </div>

        )}

        {/* ================= MAP ================= */}

        <div
          className={`transition-all duration-300 ${
            selectedShipment
              ? "lg:col-span-2"
              : "lg:col-span-3"
          }`}
        >
         

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            <div className="px-6 py-4 border-b">

              <h2 className="text-xl font-semibold">
                Live Fleet Map
              </h2>

            </div>

            <div style={{ height: "500px" }}>

              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                  center={{ lat: 13.5, lng: 78.5 }}
                  zoom={6}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {/* Vehicle Markers */}


                  {filteredShipments.map((shipment) => (
                    <Marker
                      key={shipment.id}
                      position={{
                        lat: shipment.lat,
                        lng: shipment.lng,
                      }}
                      title={shipment.id}
                      icon={{
                        url:
                          shipment.status === "Delivered"
                            ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                            : shipment.status === "Delayed"
                            ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",

                        scaledSize: new window.google.maps.Size(40, 40),
                      }}
                    />
                  ))}



                  {/* Highlight Selected Route */}

                  {selectedShipment && (
                    <>

                      {directions && (

                        <DirectionsRenderer

                          directions={directions}

                          options={{
                            
                            polylineOptions: {

                              strokeColor: "#2563EB",

                              strokeWeight: 5,

                            },

                          }}

                        />

                      )}

                    </>
                  )}
                </GoogleMap>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShipmentsPage;