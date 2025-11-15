// src/pages/Dashboard.js
import React from 'react';

export default function Dashboard() {
  return (
    <div className="flex-1 p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 bg-base-100 shadow-sm rounded-xl">
          <div className="text-sm text-info">Active Shipments</div>
          <div className="text-3xl font-bold text-primary mt-2">5</div>
        </div>

        <div className="card p-4 bg-base-100 shadow-sm rounded-xl">
          <div className="text-sm text-info">Delayed Deliveries</div>
          <div className="text-3xl font-bold text-danger mt-2">2</div>
        </div>

        <div className="card p-4 bg-base-100 shadow-sm rounded-xl">
          <div className="text-sm text-info">Utilization Rate</div>
          <div className="text-3xl font-bold text-primary mt-2">60%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-1">
          <div className="card p-4 bg-base-100 shadow-sm rounded-xl">
            <h3 className="font-medium mb-3">Recent Alerts</h3>
            <ul className="space-y-3">
              <li className="p-3 rounded-lg bg-red-50 text-red-700">SHIP-1023 → Predicted Delay</li>
              <li className="p-3 rounded-lg bg-red-50 text-red-700">SHIP-1017 → Delay</li>
              <li className="p-3 rounded-lg bg-blue-50 text-primary">SHIP-1009 → Reroute</li>
            </ul>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <div className="card p-2 bg-base-100 shadow-sm rounded-xl h-72 overflow-hidden">
            {/* Placeholder for a map component */}
            <div className="w-full h-full flex items-center justify-center text-info">Map will appear here</div>
          </div>
        </div>
      </div>
    </div>
  );
}
