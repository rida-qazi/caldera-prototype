import React from "react";

function NetworkPage() {
  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}

      <div>

        
        <p className="text-cal-muted mt-2">
          Manage your company's participation in the Caldera logistics
          collaboration network.
        </p>
      </div>


      {/* ================= OVERVIEW ================= */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Active Companies</p>
          <p className="mt-2 text-2xl font-heading text-cal-text">18</p>
          <p className="text-[11px] text-cal-muted mt-1">
            Connected to the Caldera Network
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Trusted Companies</p>
          <p className="mt-2 text-2xl font-heading text-red-600">12</p>
          <p className="text-[11px] text-cal-muted mt-1">
            Preferred collaboration partners
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">3PL Revenue</p>
          <p className="mt-2 text-2xl font-heading text-cal-primary-deep">
            ₹3.42 L
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Earned through load matching
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-cal-muted uppercase tracking-wide">Empty trips Prevented</p>
          <p className="mt-2 text-2xl font-heading text-amber-600">
            64
          </p>
          <p className="text-[11px] text-cal-muted mt-1">
            Estimated network savings
          </p>
        </div>
        
      </section>     
      
      


      {/* ================= SETTINGS + TRUSTED ================= */}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* SETTINGS */}

        <div className="lg:col-span-2 rounded-3xl bg-white border border-gray-200 shadow-sm p-6">

          <h2 className="text-xl font-semibold mb-6">
            Network Settings
          </h2>

          <div className="space-y-6">

            <div>

              <p className="font-medium mb-3">
                Participation
              </p>

              <div className="space-y-3">

                <label className="flex items-center gap-3">

                  <input type="checkbox" defaultChecked />

                  Participate in Load Matching

                </label>

                <label className="flex items-center gap-3">

                  <input type="checkbox" defaultChecked />

                  Share Outgoing Vehicles

                </label>

                <label className="flex items-center gap-3">

                  <input type="checkbox" defaultChecked />

                  Share Return Trips

                </label>

              </div>

            </div>

            <hr />

            <div>

              <p className="font-medium mb-3">
                Incoming Match Requests
              </p>

              <div className="space-y-3">

                <label className="flex items-center gap-3">

                  <input
                    type="radio"
                    name="approval"
                  />

                  Always Ask

                </label>

                <label className="flex items-center gap-3">

                  <input
                    type="radio"
                    name="approval"
                    defaultChecked
                  />

                  Auto Accept Trusted Companies

                </label>

                <label className="flex items-center gap-3">

                  <input
                    type="radio"
                    name="approval"
                  />

                  Auto Accept Everyone

                </label>

              </div>

            </div>

            <hr />

            <div>

              <label className="font-medium block mb-3">
                Matching Radius
              </label>

              <input
                type="range"
                min="50"
                max="500"
                defaultValue="150"
                className="w-full"
              />

              <p className="text-sm text-cal-muted mt-2">
                150 km
              </p>

            </div>

            <div>

              <label className="font-medium block mb-3">
                Minimum Remaining Capacity
              </label>

              <input
                type="range"
                min="0"
                max="100"
                defaultValue="30"
                className="w-full"
              />

              <p className="text-sm text-cal-muted mt-2">
                30%
              </p>

            </div>

            <div>

              <label className="font-medium block mb-3">
                Eligible Vehicle Types
              </label>

              <div className="grid grid-cols-2 gap-3">

                <label><input type="checkbox" defaultChecked /> Closed Body</label>

                <label><input type="checkbox" defaultChecked /> Container</label>

                <label><input type="checkbox" defaultChecked /> LCV</label>

                <label><input type="checkbox" /> Refrigerated</label>

                <label><input type="checkbox" /> Hazardous</label>

                <label><input type="checkbox" /> Oversized</label>

              </div>

            </div>

          </div>

        </div>

        {/* TRUSTED COMPANIES */}

        <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">

          <div className="px-5 py-5 border-b">

            <h2 className="text-xl font-semibold">
              Trusted Companies
            </h2>

            <p className="text-sm text-cal-muted mt-1">
              Preferred collaboration partners.
            </p>

          </div>

          <div className="max-h-[560px] overflow-y-auto">




            {[
              "ABC Logistics",
              "Sri Venkateshwara Logistics",
              "Express Cargo",
              "South India Movers",
              "BlueLine Logistics",
              "Prime Freight",
              "National Transport",
              "Swift Logistics",
            ].map((company) => (
              <div
                key={company}
                className="px-5 py-4 border-b last:border-b-0 hover:bg-cal-primary-soft transition cursor-pointer"
              >
                <div className="font-semibold text-cal-heading">
                  {company}
                </div>

                <div className="text-sm text-cal-muted mt-1">
                  ★★★★☆ &nbsp;•&nbsp; Trusted Company
                </div>

                <div className="flex justify-between mt-3 text-xs text-cal-muted">

                  <span>42 Successful Matches</span>

                  <span className="font-medium text-green-600">
                    ₹84,200
                  </span>

                </div>
              </div>
            ))}

          </div>

        </div>

      </div>

      {/* ================= MATCHING HISTORY ================= */}

      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-6 py-5 border-b">

          <h2 className="text-xl font-semibold">
            Matching History
          </h2>

          <p className="text-sm text-cal-muted mt-1">
            Previous collaborations through the Caldera Network.
          </p>

        </div>

        <table className="w-full text-sm">

          <thead className="bg-cal-primary-soft">

            <tr>

              <th className="px-6 py-3 text-left">
                Date
              </th>

              <th className="px-6 py-3 text-left">
                Order
              </th>

              <th className="px-6 py-3 text-left">
                Company
              </th>

              <th className="px-6 py-3 text-left">
                Type
              </th>

              <th className="px-6 py-3 text-left">
                  Matching Fee
              </th>

              <th className="px-6 py-3 text-left">
                Revenue
              </th>

            </tr>

          </thead>

          <tbody>

          <tr className="border-t">

              <td className="px-6 py-4">
                  24 Jun
              </td>

              <td className="px-6 py-4">
                  ORD-2418
              </td>

              <td className="px-6 py-4">
                  ABC Logistics
              </td>

              <td className="px-6 py-4">
                  Shared Out
              </td>

              <td className="px-6 py-4 text-green-600 font-medium">
                  + ₹1,250
              </td>

              <td className="px-6 py-4 font-medium">
                  ₹18,700
              </td>

          </tr>

          <tr className="border-t">

              <td className="px-6 py-4">
                  22 Jun
              </td>

              <td className="px-6 py-4">
                  ORD-2405
              </td>

              <td className="px-6 py-4">
                  South India Movers
              </td>

              <td className="px-6 py-4">
                  Shared In
              </td>

              <td className="px-6 py-4 text-red-500 font-medium">
                  − ₹1,800
              </td>

              <td className="px-6 py-4 font-medium">
                  ₹21,400
              </td>

          </tr>

          <tr className="border-t">

              <td className="px-6 py-4">
                  19 Jun
              </td>

              <td className="px-6 py-4">
                  ORD-2391
              </td>

              <td className="px-6 py-4">
                  Prime Freight
              </td>

              <td className="px-6 py-4">
                  Shared Out
              </td>

              <td className="px-6 py-4 text-green-600 font-medium">
                  + ₹900
              </td>

              <td className="px-6 py-4 font-medium">
                  ₹15,900
              </td>

          </tr>

          </tbody>


        </table>

      </div>

      {/* ================= NETWORK INSIGHTS ================= */}

      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-6">
          Network Insights
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">

          <div>

            <p className="text-xs uppercase tracking-wider text-cal-muted">
              Successful Matches
            </p>

            <h3 className="text-3xl font-bold mt-2">
              186
            </h3>

          </div>

          <div>

            <p className="text-xs uppercase tracking-wider text-cal-muted">
              Acceptance Rate
            </p>

            <h3 className="text-3xl font-bold mt-2">
              82 %
            </h3>

          </div>

          <div>

            <p className="text-xs uppercase tracking-wider text-cal-muted">
              Average Response
            </p>

            <h3 className="text-3xl font-bold mt-2">
              14 min
            </h3>

          </div>

          <div>

            <p className="text-xs uppercase tracking-wider text-cal-muted">
              Fleet Utilization Gain
            </p>

            <h3 className="text-3xl font-bold mt-2">
              18 %
            </h3>

          </div>

          <div>

            <p className="text-xs uppercase tracking-wider text-cal-muted">
              Average Revenue per Match
            </p>

            <h3 className="text-3xl font-bold mt-2 text-green-600">
              ₹1,840
            </h3>

          </div>

          <div>

            <p className="text-xs uppercase tracking-wider text-cal-muted">
              Total Network Revenue
            </p>

            <h3 className="text-3xl font-bold mt-2 text-green-600">
              ₹3.42 L
            </h3>

          </div>

        </div>

      </div>

    </div>
  );
}

export default NetworkPage;