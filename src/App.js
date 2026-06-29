import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import RoutesPage from "./pages/RoutesPage";
import AlertsPage from "./pages/AlertsPage";
import PartnersPage from "./pages/PartnersPage";

export default function App() {
  const [alerts, setAlerts] = React.useState([]);

  React.useEffect(() => {
    const mockAlerts = [
      {
        id: 1,
        shipmentId: "SHIP-1023",
        type: "Predicted Delay",
        message: "High chance of delay on route Mumbai → Delhi",
        timestamp: "2025-09-06 14:22",
      },
      {
        id: 2,
        shipmentId: "SHIP-1017",
        type: "Delay",
        message: "Shipment delayed near Bengaluru hub",
        timestamp: "2025-09-05 19:40",
      },
      {
        id: 3,
        shipmentId: "SHIP-1009",
        type: "Reroute",
        message: "Shipment rerouted via Pune due to congestion",
        timestamp: "2025-09-04 09:15",
      },
    ];
    setAlerts(mockAlerts);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route
                  path="/dashboard"
                  element={<DashboardPage alerts={alerts} />}
                />
                <Route path="/shipments" element={<ShipmentsPage />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/partners" element={<PartnersPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
