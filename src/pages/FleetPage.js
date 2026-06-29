import React, { useState } from "react";

const mockFleet = [
  {
    id: "KA01AB1234",
    type: "Closed Body",
    capacity: "12 T",
    capabilities: "Regular",
    status: "On Route",
    location: "Bengaluru",
    shipment: "SHIP-24001",
    enabled: true,
  },
  {
    id: "KA05CD5678",
    type: "Container",
    capacity: "18 T",
    capabilities: "Container",
    status: "Available",
    location: "Mysuru",
    shipment: "—",
    enabled: true,
  },
  {
    id: "KA03EF9012",
    type: "LCV",
    capacity: "2 T",
    capabilities: "Regular",
    status: "Available",
    location: "Tumakuru",
    shipment: "—",
    enabled: false,
  },
  {
    id: "TN09GH3456",
    type: "Refrigerated",
    capacity: "8 T",
    capabilities: "Refrigerated",
    status: "On Route",
    location: "Chennai",
    shipment: "SHIP-23982",
    enabled: true,
  },
  {
    id: "KA41JK7890",
    type: "Trailer",
    capacity: "24 T",
    capabilities: "Oversized",
    status: "Maintenance",
    location: "Bengaluru",
    shipment: "—",
    enabled: false,
  },
];


function FleetPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  return (
    <div className="p-6 space-y-6">

      {/* ===== Header ===== */}
      <div>

        <p className="text-sm text-cal-muted mt-1">
          Manage company vehicles, monitor availability, and prepare your fleet for assignments.
        </p>
      </div>

      {/* ===== Top Bar: Search + Filters + Add Vehicle ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="flex-1">

          <div className="flex flex-wrap gap-3">

            {/* Search */}
            <input
              type="text"
              placeholder="Search by vehicle number, type or location..."
              className="flex-1 min-w-[260px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cal-primary"
            />

            {/* Status */}
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option>All Status</option>
              <option>Available</option>
              <option>On Route</option>
              <option>Maintenance</option>
            </select>

            {/* Capability */}
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option>All Capabilities</option>
              <option>Regular</option>
              <option>Container</option>
              <option>Fragile</option>
              <option>Refrigerated</option>
              <option>Oversized</option>
              <option>Hazardous</option>
            </select>

          </div>

        </div>


        <button
          onClick={() => setShowAddVehicle(true)}
          className="self-start md:self-auto px-4 py-2 bg-cal-primary text-white rounded-lg text-sm hover:bg-cal-primary-deep transition"
        >
          + Add Vehicle
        </button>


      </div>

      {/* ===== Fleet Table ===== */}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">

        <table className="w-full text-sm text-gray-700">

          <thead className="bg-cal-primary-soft text-gray-800">

            <tr>

              <th className="px-6 py-3 text-left font-semibold">
                Vehicle
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Type
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Capacity
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Capabilities
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Status
              </th>

              <th className="px-6 py-3 text-left font-semibold">
                Location
              </th>

              <th className="px-6 py-3 text-center font-semibold">
                3PL
              </th>

            </tr>

          </thead>

          <tbody>

          {mockFleet.map((vehicle) => (

          <tr
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              className="border-t hover:bg-gray-50 cursor-pointer"
          >

          <td className="px-6 py-4 font-medium">
              {vehicle.id}
          </td>

          <td className="px-6 py-4">
              {vehicle.type}
          </td>

          <td className="px-6 py-4">
              {vehicle.capacity}
          </td>

          <td className="px-6 py-4">
              {vehicle.capabilities}
          </td>

          <td className="px-6 py-4">

          <span
          className={`px-2 py-1 rounded-full text-xs
          ${
          vehicle.status==="Available"
          ? "bg-green-100 text-green-700"
          : vehicle.status==="On Route"
          ? "bg-blue-100 text-blue-700"
          : "bg-orange-100 text-orange-700"
          }`}
          >

          {vehicle.status}

          </span>

          </td>

          <td className="px-6 py-4">
              {vehicle.location}
          </td>

          <td className="px-6 py-4 text-center">

          {vehicle.enabled ? "🟢" : "⚪"}

          </td>

          </tr>

          ))}

          </tbody>          

        </table>

      </div>





      {/* ===== Pagination ===== */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>
          Showing 1 – 5 of 18 vehicles
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled
            className="px-2 py-1 border rounded-md opacity-40"
          >
            ◀
          </button>

          <span>Page 1 of 1</span>

          <button
            disabled
            className="px-2 py-1 border rounded-md opacity-40"
          >
            ▶
          </button>
        </div>
      </div>

      {/* ===== Fleet Overview ===== */}
      <div className="glass-card p-4">

        <h3 className="text-lg font-semibold text-cal-text mb-5">
          Fleet Overview
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Total Vehicles
            </p>
            <p className="text-2xl font-semibold text-cal-text mt-1">
              18
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Available
            </p>
            <p className="text-2xl font-semibold text-green-600 mt-1">
              5
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              On Route
            </p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">
              11
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Maintenance
            </p>
            <p className="text-2xl font-semibold text-orange-500 mt-1">
              2
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              3PL Enabled
            </p>
            <p className="text-2xl font-semibold text-purple-600 mt-1">
              9
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Fleet Utilization
            </p>
            <p className="text-2xl font-semibold text-cal-text mt-1">
              83%
            </p>
          </div>

        </div>

      </div>

      {/* ===== Vehicle Details Panel (Placeholder) ===== */}

      {selectedVehicle && (

      <div>
      
        <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl border-l border-gray-200 z-50">

          <div className="flex items-center justify-between p-6 border-b">

            <h3 className="text-xl font-semibold text-cal-text">
              Vehicle Details
            </h3>


            <button
            onClick={() => setSelectedVehicle(null)}
            className="text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>


            

          </div>

          <div className="p-6 space-y-5">

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                Registration Number
              </p>
              <p className="font-medium mt-1">{selectedVehicle.id}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                Vehicle Type
              </p>
              <p className="font-medium mt-1">{selectedVehicle.type}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                Capacity
              </p>
              <p className="font-medium mt-1">{selectedVehicle.capacity}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                Capabilities
              </p>
              <p className="font-medium mt-1">{selectedVehicle.capabilities}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                Current Status
              </p>
              <p className="font-medium mt-1">{selectedVehicle.status}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                Current Location
              </p>
              <p className="font-medium mt-1">{selectedVehicle.location}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                Current Shipment
              </p>
              <p className="font-medium mt-1">{selectedVehicle.shipment}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-cal-muted">
                3PL Availability
              </p>
              <p className="font-medium mt-1">{selectedVehicle.enabled ? "Enabled" : "Disabled"}</p>
            </div>

            <button className="w-full mt-6 px-4 py-3 rounded-xl bg-cal-primary text-white hover:bg-cal-primary-deep transition">
              Edit Vehicle
            </button>

          </div>

        </div>

      </div>
      )}

      {showAddVehicle && (

      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">

              <div className="max-h-[85vh] overflow-y-auto">

                  {/* Header */}

                  <div className="flex items-center justify-between border-b px-6 py-5">

                      <div>

                          <h2 className="text-2xl font-semibold">
                              Add Vehicle
                          </h2>

                          <p className="text-sm text-cal-muted mt-1">
                              Register a vehicle in your fleet.
                          </p>

                      </div>

                      <button
                          onClick={() => setShowAddVehicle(false)}
                          className="text-2xl text-gray-400 hover:text-gray-700"
                      >
                          ×
                      </button>

                  </div>

                  {/* Body */}

                  <div className="p-6 space-y-6">

                      {/* Basic Information */}

                      <div>

                          <h3 className="font-semibold mb-4">
                              Vehicle Information
                          </h3>

                          <div className="grid grid-cols-2 gap-5">

                              <input
                                  placeholder="Registration Number"
                                  className="border rounded-lg px-4 py-3"
                              />

                              <select className="border rounded-lg px-4 py-3">

                                  <option>Vehicle Type</option>
                                  <option>LCV</option>
                                  <option>Closed Body</option>
                                  <option>Container</option>
                                  <option>Trailer</option>
                                  <option>Refrigerated</option>

                              </select>

                              <input
                                  placeholder="Capacity (T)"
                                  className="border rounded-lg px-4 py-3"
                              />

                              <input
                                  placeholder="Current Location"
                                  className="border rounded-lg px-4 py-3"
                              />

                          </div>

                      </div>

                      {/* Capabilities */}

                      <div>

                          <h3 className="font-semibold mb-4">
                              Capabilities
                          </h3>

                          <div className="grid grid-cols-2 gap-3">

                              <label><input type="checkbox" /> Regular</label>

                              <label><input type="checkbox" /> Refrigerated</label>

                              <label><input type="checkbox" /> Container</label>

                              <label><input type="checkbox" /> Fragile</label>

                              <label><input type="checkbox" /> Hazardous</label>

                              <label><input type="checkbox" /> Oversized</label>

                          </div>

                      </div>

                      {/* 3PL */}

                      <div>

                          <h3 className="font-semibold mb-4">
                              3PL Settings
                          </h3>

                          <label className="flex items-center gap-3">

                              <input type="checkbox" />

                              Enable this vehicle for 3PL Load Matching

                          </label>

                      </div>

                      {/* Notes */}

                      <div>

                          <h3 className="font-semibold mb-4">
                              Notes
                          </h3>

                          <textarea
                              rows="4"
                              placeholder="Additional information..."
                              className="border rounded-lg px-4 py-3 w-full"
                          />

                      </div>

                  </div>

                  {/* Footer */}

                  <div className="border-t px-6 py-4 flex justify-end gap-4">

                      <button
                          onClick={() => setShowAddVehicle(false)}
                          className="px-5 py-3 border rounded-lg"
                      >
                          Cancel
                      </button>

                      <button
                          className="px-6 py-3 bg-cal-primary text-white rounded-lg"
                      >
                          Save Vehicle
                      </button>

                  </div>

              </div>

          </div>

      </div>

      )}     
    </div>
  );
}

export default FleetPage;