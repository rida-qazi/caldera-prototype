import React, { useState } from "react";
const mockOrders = [
  {
    id: "ORD-24001",
    customer: "ABC Steel Pvt. Ltd.",
    pickup: "Peenya, Bengaluru",
    destination: "Mysuru",
    status: "Pending",
    assignmentStatus: "Unassigned",
    assignedVehicle: "KA01AB3579",
    weight: "8 T",
    vehicle: "Closed Body Truck",
  },
  {
    id: "ORD-24002",
    customer: "Fresh Farms",
    pickup: "KR Market",
    destination: "Mangaluru",
    status: "Assigned",
    assignmentStatus: "Own Fleet",
    assignedVehicle: "KA01AB2222",
    weight: "3 T",
    vehicle: "Refrigerated Truck",
  },
  {
    id: "ORD-24003",
    customer: "Tech Electronics",
    pickup: "Whitefield",
    destination: "Chennai",
    status: "Assigned",
    assignmentStatus: "3PL Network",
    assignedVehicle: "KA01AB5432",
    weight: "5 T",
    vehicle: "Container Truck",
  },
  {
    id: "ORD-24004",
    customer: "BuildWell Cement",
    pickup: "Tumakuru",
    destination: "Hubballi",
    status: "Pending",
    assignmentStatus: "Unassigned",
    assignedVehicle: "KA01AB1234",
    weight: "16 T",
    vehicle: "Trailer",
  },
  {
    id: "ORD-24005",
    customer: "MediCare Logistics",
    pickup: "Electronic City",
    destination: "Coimbatore",
    status: "In Transit",
    assignmentStatus: "Own Fleet",
    assignedVehicle: "KA01AB1111",
    weight: "2 T",
    vehicle: "LCV",
  },
];



function OrdersPage() {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showNewOrder, setShowNewOrder] = useState(false);
  return (
    <div className="p-6 space-y-6">

      {/* ===== Header ===== */}

      <div>


        <p className="text-sm text-cal-muted mt-1">
          Manage incoming shipment requests and assign vehicles.
        </p>
      </div>

      {/* ===== Search & Filters ===== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="flex-1">

          <div className="flex flex-wrap gap-3">

            <input
              type="text"
              placeholder="Search by Order ID, Customer or Destination..."
              className="flex-1 min-w-[260px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cal-primary"
            />

            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">

              <option>All Status</option>

              <option>Pending</option>

              <option>Assigned</option>

              <option>In Transit</option>

              <option>Delivered</option>

            </select>

            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">

              <option>All Assignments</option>

              <option>Own Fleet</option>

              <option>3PL Network</option>

              <option>Unassigned</option>

            </select>

          </div>

        </div>


        <button
            onClick={() => setShowNewOrder(true)}
            className="self-start md:self-auto px-4 py-2 bg-cal-primary text-white rounded-lg text-sm hover:bg-cal-primary-deep transition"
        >
            + New Order
        </button>


      </div>

      {/* ===== Orders Table ===== */}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">

        <table className="w-full text-sm text-gray-700">

          <thead className="bg-cal-primary-soft">

            <tr>

              <th className="px-6 py-3 text-left">
                Order
              </th>

              <th className="px-6 py-3 text-left">
                Customer
              </th>

              <th className="px-6 py-3 text-left">
                Pickup
              </th>

              <th className="px-6 py-3 text-left">
                Destination
              </th>

                <th className="px-6 py-3 text-left">
                    Assignment Status
                </th>

                <th className="px-6 py-3 text-left">
                    Assigned Vehicle
                </th>


            </tr>

          </thead>

          <tbody>

            {mockOrders.map((order) => (

            <tr
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="border-t hover:bg-gray-50 cursor-pointer"
            >

                <td className="px-6 py-4 font-medium text-cal-primary">
                    {order.id}
                </td>

                <td className="px-6 py-4">
                    {order.customer}
                </td>

                <td className="px-6 py-4">
                    {order.pickup}
                </td>

                <td className="px-6 py-4">
                    {order.destination}
                </td>


                <td className="px-6 py-4">

                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
                        ${
                            order.assignmentStatus === "Own Fleet"
                                ? "bg-blue-100 text-blue-700"
                                : order.assignmentStatus === "3PL Network"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                        {order.assignmentStatus}
                    </span>

                </td>

                <td className="px-6 py-4 font-medium">

                    {order.assignedVehicle}

                </td>


            </tr>

            ))}

            </tbody>

        </table>

      </div>


      {/* ===== Pagination ===== */}

      <div className="flex items-center justify-between text-xs text-gray-500">

        <span>
          Showing 0 - 0 of 0 orders
        </span>

        <div className="flex items-center gap-2">

          <button
            disabled
            className="px-2 py-1 border rounded-md opacity-40"
          >
            ◀
          </button>

          <span>
            Page 1 of 1
          </span>

          <button
            disabled
            className="px-2 py-1 border rounded-md opacity-40"
          >
            ▶
          </button>

        </div>

      </div>

      {/* ===== Assignment Insights ===== */}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        <h3 className="text-lg font-semibold text-cal-text mb-5">
          Assignment Insights
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Orders Today
            </p>

            <p className="text-2xl font-semibold mt-1">
              24
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Assigned to Fleet
            </p>

            <p className="text-2xl font-semibold text-blue-600 mt-1">
              15
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Assigned via 3PL
            </p>

            <p className="text-2xl font-semibold text-purple-600 mt-1">
              6
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Pending Assignment
            </p>

            <p className="text-2xl font-semibold text-orange-500 mt-1">
              3
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Empty Trips Prevented
            </p>

            <p className="text-2xl font-semibold text-green-600 mt-1">
              5
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cal-muted">
              Fleet Utilization
            </p>

            <p className="text-2xl font-semibold mt-1">
              83%
            </p>
          </div>

        </div>

      </div>

      {/* ===== Order Details Drawer ===== */}

      {selectedOrder && (

        <div>

        
        <div className="fixed inset-y-0 right-0 w-[480px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">

            <h3 className="text-xl font-semibold">
                {selectedOrder.id}
            </h3>
            <p className="text-sm text-cal-muted mt-1">
                Order Details & Assignment
            </p>

            <button onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-700">
              ✕
            </button>

          </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">

                <div>

                    <h4 className="text-sm font-semibold text-cal-heading mb-4">
                        Order Information
                    </h4>

                    <div className="grid grid-cols-2 gap-4">

                        <div>

                            <p className="text-xs uppercase tracking-wide text-cal-muted">
                                Customer
                            </p>

                            <p className="font-semibold text-cal-text mt-1">
                                {selectedOrder.customer}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-cal-muted">
                                Pickup
                            </p>

                            <p className="font-semibold mt-1">
                                {selectedOrder.pickup}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-cal-muted">
                                Destination
                            </p>

                            <p className="font-semibold mt-1">
                                {selectedOrder.destination}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-cal-muted">
                                Cargo Weight
                            </p>

                            <p className="font-semibold mt-1">
                                {selectedOrder.weight}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-cal-muted">
                                Required Vehicle
                            </p>

                            <p className="font-semibold mt-1">
                                {selectedOrder.vehicle}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-cal-muted">
                                Assignment Status
                            </p>

                            <p className="font-semibold mt-1">
                                {selectedOrder.assignmentStatus}
                            </p>

                        </div>

                    </div>

                </div>     

            <hr />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                <p className="text-sm font-medium text-blue-800">
                    Ready for Assignment
                </p>

                <p className="text-sm text-blue-700 mt-1">
                    Select a vehicle from your fleet or assign this order to a 3PL partner.
                </p>

            </div>

            <div>

              <p className="font-semibold mb-3">
                Assignment Method
              </p>

              <div className="space-y-3">

                <label className="flex items-center gap-2">

                  <input type="radio" name="assignment" />

                  Own Fleet

                </label>

                <label className="flex items-center gap-2">

                  <input type="radio" name="assignment" />

                  3PL Network

                </label>

              </div>

            </div>

            <div className="border rounded-xl p-4 bg-gray-50">

              <p className="font-medium mb-2">
                Available Vehicles
              </p>

              <p className="text-sm text-gray-500">
                Vehicles will appear here after selecting an assignment method.
              </p>

            </div>


            <div className="sticky bottom-0 bg-white pt-4 border-t">

                <button className="w-full py-3 rounded-xl bg-cal-primary text-white hover:bg-cal-primary-deep transition">
                    Assign Vehicle
                </button>

            </div>


          </div>

        </div>

      </div>
      )}

{showNewOrder && (

<div className="fixed top-0 left-0 w-screen h-screen bg-black/40 flex items-center justify-center z-[9999]">


    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}

        <div className="flex items-center justify-between border-b px-8 py-5">

            <div>

                <h2 className="text-2xl font-semibold">
                    Create New Order
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                    Enter shipment details to create a new delivery request.
                </p>

            </div>

            <button
                onClick={() => setShowNewOrder(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
            >
                ×
            </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-8">

            {/* Customer */}

            <div>

                <h3 className="font-semibold mb-4">
                    Customer Information
                </h3>

                <div className="grid grid-cols-2 gap-5">

                    <input
                        placeholder="Customer Name"
                        className="border rounded-lg px-4 py-3"
                    />

                    <input
                        placeholder="Contact Person"
                        className="border rounded-lg px-4 py-3"
                    />

                    <input
                        placeholder="Contact Number"
                        className="border rounded-lg px-4 py-3"
                    />

                    <input
                        placeholder="Email (Optional)"
                        className="border rounded-lg px-4 py-3"
                    />

                </div>

            </div>

            {/* Shipment */}

            <div>

                <h3 className="font-semibold mb-4">
                    Shipment Details
                </h3>

                <div className="space-y-4">

                    <input
                        placeholder="Pickup Location"
                        className="border rounded-lg px-4 py-3 w-full"
                    />

                    <input
                        placeholder="Destination"
                        className="border rounded-lg px-4 py-3 w-full"
                    />

                </div>

            </div>

            {/* Requirements */}

            <div>

                <h3 className="font-semibold mb-4">
                    Shipment Requirements
                </h3>

                <div className="grid grid-cols-3 gap-5">

                    <select className="border rounded-lg px-4 py-3">

                        <option>
                            Required Vehicle
                        </option>

                        <option>
                            LCV
                        </option>

                        <option>
                            Closed Body
                        </option>

                        <option>
                            Open Truck
                        </option>

                        <option>
                            Container
                        </option>

                        <option>
                            Refrigerated
                        </option>

                    </select>

                    <input
                        placeholder="Weight"
                        className="border rounded-lg px-4 py-3"
                    />

                    <input
                        placeholder="Volume"
                        className="border rounded-lg px-4 py-3"
                    />

                </div>

            </div>

            {/* Special Requirements */}

            <div>

                <h3 className="font-semibold mb-4">
                    Special Requirements
                </h3>

                <div className="grid grid-cols-2 gap-4">

                    <label><input type="checkbox" /> Refrigerated</label>

                    <label><input type="checkbox" /> Fragile</label>

                    <label><input type="checkbox" /> Hazardous</label>

                    <label><input type="checkbox" /> Oversized</label>

                </div>

            </div>

            {/* Commercial */}

            <div>

                <h3 className="font-semibold mb-4">
                    Commercial
                </h3>

                <input
                    placeholder="Customer Quote (₹)"
                    className="border rounded-lg px-4 py-3 w-full"
                />

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

        <div className="border-t px-8 py-5 flex justify-end gap-4">

            <button
                onClick={() => setShowNewOrder(false)}
                className="px-5 py-3 border rounded-lg"
            >
                Cancel
            </button>

            <button
                className="px-6 py-3 bg-cal-primary text-white rounded-lg"
            >
                Create Order
            </button>

        </div>

    </div>

</div>
</div>

)}


    </div>
  );
}

export default OrdersPage;