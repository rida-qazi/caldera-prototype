import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import caLogo from "../assets/ca.png";

function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const routeToTitle = {
    "/dashboard": "Dashboard",
    "/shipments": "Shipments",
    "/routes": "Routes",
    "/alerts": "Alerts",
    "/partners": "3PL Partners",
  };

  const pageTitle = routeToTitle[location.pathname] || "";

  return (
    <div className="flex h-screen bg-cal-bg text-cal-text font-body">

      {/* SIDEBAR */}
      <aside className="w-64 bg-cal-surface border-r border-cal-border shadow-sm hidden sm:block fixed h-full">
        <div className="h-full flex flex-col justify-between p-4">
          {/* Logo + Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img
                src={caLogo}
                alt="Caldera Logo"
                className="h-10 w-10 object-contain rounded-xl"
              />
              <div>
                <div className="text-xs uppercase tracking-wide text-cal-muted">
                  Caldera
                </div>
                <div className="text-lg font-heading font-semibold text-cal-heading">
                  Eco Logistics
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="space-y-1 text-sm">
              {["dashboard", "shipments", "routes", "alerts", "partners"].map((link) => (
                <NavLink
                  key={link}
                  to={`/${link}`}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-cal-primary-soft text-cal-primary-deep font-semibold"
                        : "text-cal-muted hover:bg-cal-border/40 hover:text-cal-primary-deep"
                    }`
                  }
                >
                  {link.charAt(0).toUpperCase() + link.slice(1)}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="text-[11px] text-cal-muted">
            🌿 Caldera · Greener Deliveries
            <br />
            © 2025
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col pl-64 min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between bg-cal-surface px-8 py-4 border-b border-cal-border shadow-sm fixed left-64 right-0 top-0 z-10">
          <div>
            <div className="text-xs text-cal-muted">Smart logistics dashboard</div>
            <h2 className="text-xl font-heading font-semibold">{pageTitle || "Dashboard"}</h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-full px-3 py-2 bg-cal-primary-soft text-cal-primary-deep text-sm hover:bg-cal-primary/20 transition">
              🔔
            </button>
            <div className="relative">
              <img
                src="/user.jpg"
                alt="User Avatar"
                className="h-9 w-9 rounded-full object-cover border border-cal-border cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-cal-surface border border-cal-border rounded-xl shadow-lg z-50 text-sm">
                  <button className="block w-full text-left px-4 py-2 hover:bg-cal-border/30">
                    Profile
                  </button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-cal-border/30">
                    Settings
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-red-600 hover:bg-cal-border/30">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="mt-20 px-8 pb-8">
          
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
