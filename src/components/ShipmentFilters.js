import React from "react";

export default function ShipmentFilters({
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center">
      <input
        type="text"
        placeholder="Search by ID, Origin, Destination"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/2"
      />
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2"
      >
        <option value="All">All Statuses</option>
        <option value="In-Transit">In-Transit</option>
        <option value="Delayed">Delayed</option>
        <option value="Delivered">Delivered</option>
      </select>
    </div>
  );
}

// Helper for filtering in pages
export function filterShipments(shipments, statusFilter, searchTerm) {
  const normalize = (str) =>
    str?.replace(/\s+/g, "-").toLowerCase();

  return shipments.filter((s) => {
    const matchesStatus =
      statusFilter === "All" ||
      normalize(s.status) === normalize(statusFilter);

    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });
}
