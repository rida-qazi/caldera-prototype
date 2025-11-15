// src/components/Sidebar.js
import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-base-100 h-screen border-r border-base-200 p-4 hidden md:block">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          {/* swap with your logo img if you want */}
          <span className="text-primary font-bold">C</span>
        </div>
        <h1 className="text-xl font-semibold text-primary">Caldera</h1>
      </div>

      <nav className="space-y-2">
        <a className="block px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium" href="#">Dashboard</a>
        <a className="block px-3 py-2 rounded-lg hover:bg-base-200" href="#">Shipments</a>
        <a className="block px-3 py-2 rounded-lg hover:bg-base-200" href="#">Routes</a>
        <a className="block px-3 py-2 rounded-lg hover:bg-base-200" href="#">Alerts</a>
        <a className="block px-3 py-2 rounded-lg hover:bg-base-200" href="#">Partners</a>
      </nav>

      <div className="mt-auto text-sm text-info pt-6">© {new Date().getFullYear()} Caldera</div>
    </aside>
  );
}
