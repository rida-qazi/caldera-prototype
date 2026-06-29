import React from "react";
import { supabase } from "../supabaseClient";

function AlertsPage() {
  // ---------- Helpers ----------
  const [alerts, setAlerts] = React.useState([]);
  const getSeverity = (type) => {
    if (type.toLowerCase().includes("predicted")) return "medium";
    if (type.toLowerCase().includes("delay")) return "high";
    if (type.toLowerCase().includes("reroute")) return "low";
    return "low";
  };

  const getSeverityStyles = (sev) => {
    if (sev === "high")
      return "bg-red-100 text-red-700 border border-red-200";
    if (sev === "medium")
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    return "bg-blue-100 text-blue-700 border border-blue-200";
  };

  const estimateCO2Impact = () => {
    return (Math.random() * 0.6 + 0.2).toFixed(2); // 0.2–0.8 kg
  };

  const estimateDelayImpact = () => {
    return Math.floor(Math.random() * 60) + 10; // 10–70 mins
  };

  const estimateDownstreamImpact = () => {
    return Math.random() < 0.3 ? 2 : 0;
  };

  const getSuggestion = (type) => {
    if (type.toLowerCase().includes("delay"))
      return "Consider alternate low-traffic route.";
    if (type.toLowerCase().includes("predicted"))
      return "Shift departure by 20–30 mins to avoid congestion.";
    return "Monitor traffic and confirm ETA.";
  };

  // ---------- Root Cause Logic ----------

  React.useEffect(() => {

    // 🔄 Shuffle helper
    function shuffle(array) {
      return array
        .map((item) => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);
    }

    async function loadAlerts() {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error loading alerts:", error);
      } else {
        setAlerts(shuffle(data));  // 👈 MIXED ORDER
      }
    }

    loadAlerts();
  }, []);




  const getRootCause = (alert) => {
    const msg = alert.message.toLowerCase();
    const type = alert.type.toLowerCase();

    if (msg.includes("congestion") || msg.includes("traffic"))
      return "Traffic Congestion";
    if (msg.includes("weather") || msg.includes("rain") || msg.includes("storm"))
      return "Weather Disruption";
    if (msg.includes("hub") || msg.includes("processing"))
      return "Hub Processing Delay";
    if (msg.includes("reroute") || type.includes("reroute"))
      return "Route Inefficiency";
    if (msg.includes("driver") || msg.includes("schedule"))
      return "Driver Schedule Issue";

    // fallback
    return "Unknown – Requires Review";
  };

  const getRootCauseExplanation = (cause) => {
    switch (cause) {
      case "Traffic Congestion":
        return "Heavy congestion detected on major highway segments.";
      case "Weather Disruption":
        return "Recent weather conditions impacted travel time.";
      case "Hub Processing Delay":
        return "Sorting/handling delays at distribution hub.";
      case "Route Inefficiency":
        return "Current route has bottlenecks or slow segments.";
      case "Driver Schedule Issue":
        return "Driver shift timing mismatch or early/late departure.";
      default:
        return "Needs investigation.";
    }
  };

  // ---------- Group alerts ----------
  const today = [];
  const week = [];
  const older = [];

  alerts.forEach((a) => {
    const d = new Date(a.timestamp);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);

    if (diff <= 1) today.push(a);
    else if (diff <= 7) week.push(a);
    else older.push(a);
  });

  const sortBySeverity = (list) =>
    [...list].sort((a, b) => {
      const sevRank = { high: 3, medium: 2, low: 1 };
      return (
        sevRank[getSeverity(b.type)] - sevRank[getSeverity(a.type)]
      );
    });

  return (
    <div className="p-6 space-y-8">
      {/* ---------- Overview Cards ---------- */}
      <h2 className="text-3xl font-heading font-bold text-cal-text">
        Alerts Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">Total Alerts</p>
          <p className="text-3xl font-bold text-cal-primary">
            {alerts.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">High Severity</p>
          <p className="text-3xl font-bold text-red-500">
            {alerts.filter((a) => getSeverity(a.type) === "high").length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">Predicted Delays</p>
          <p className="text-3xl font-bold text-yellow-600">
            {alerts.filter((a) =>
              a.type.toLowerCase().includes("predicted")
            ).length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-cal-muted text-sm">Estimated CO₂ Impact Saved</p>
          <p className="text-xl font-bold text-cal-primary">
            ~{(alerts.length * 0.32).toFixed(2)} kg
          </p>
        </div>
      </div>

      {/* ---------- Section Lists ---------- */}
      {[
        { title: "Today", data: sortBySeverity(today) },
        { title: "This Week", data: sortBySeverity(week) },
        { title: "Older Alerts", data: sortBySeverity(older) },
      ].map(
        (section) =>
          section.data.length > 0 && (
            <div key={section.title} className="space-y-4">
              <h3 className="text-xl font-semibold text-cal-text">
                {section.title}
              </h3>

              <div className="bg-white rounded-2xl shadow divide-y">
                {section.data.map((a) => {
                  const severity = getSeverity(a.type);
                  const cause = getRootCause(a);

                  return (
                    <div
                      key={a.id}
                      className="p-4 hover:bg-cal-primary-soft transition"
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-heading font-semibold text-cal-text">
                            Shipment {a.shipmentId}
                          </p>
                          <p className="text-sm text-cal-muted">{a.message}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityStyles(
                            severity
                          )}`}
                        >
                          {a.type}
                        </span>
                      </div>

                      {/* Smart Insights Section */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <p className="text-cal-muted">
                          ⏱ Delay Impact:{" "}
                          <span className="font-medium">
                            {estimateDelayImpact()} mins
                          </span>
                        </p>
                        <p className="text-cal-muted">
                          🌍 CO₂ Impact:{" "}
                          <span className="font-medium">
                            {estimateCO2Impact()} kg
                          </span>
                        </p>
                        <p className="text-cal-muted">
                          🔁 Downstream Impact:{" "}
                          <span className="font-medium">
                            {estimateDownstreamImpact()} shipments
                          </span>
                        </p>
                      </div>

                      {/* Root Cause Analysis */}
                      <div className="mt-3 p-3">
                        <p className="text-sm font-medium text-cal-primary-deep">
                           Root Cause: {cause}
                        </p>
                        <p className="text-xs text-cal-muted mt-1">
                          {getRootCauseExplanation(cause)}
                        </p>
                      </div>

                      {/* Suggestion */}
                      <p className="mt-3 text-sm text-cal-primary-deep font-medium">
                        💡 {getSuggestion(a.type)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}

export default AlertsPage;

