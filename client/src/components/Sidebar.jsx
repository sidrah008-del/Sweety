
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", icon: "◫", label: "Overview" },
    { path: "/readings", icon: "⌁", label: "My Readings" },
    { path: "/reports", icon: "▤", label: "Reports" },
    { path: "/profile", icon: "○", label: "Profile" },
  ];

  // Close menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu with Escape key
  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="sidebar-shell">
      {/* Mobile header */}
      <div className="mobile-sidebar-header">
        <div className="app-sidebar-logo">
          <div className="app-sidebar-logo-icon">S</div>
          <span>Sweety</span>
        </div>

        <button
          type="button"
          className="hamburger-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="sweety-navigation"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile backdrop */}
      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar navigation */}
      <aside
        id="sweety-navigation"
        className={`app-sidebar ${menuOpen ? "menu-open" : ""}`}
      >
        <div className="app-sidebar-logo desktop-sidebar-logo">
          <div className="app-sidebar-logo-icon">S</div>
          <span>Sweety</span>
        </div>

        <nav className="app-sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`app-sidebar-nav-item ${
                  isActive ? "active" : ""
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
{location.pathname === "/profile" && (
  <button
    type="button"
    className="app-sidebar-logout dashboard-logout"
    onClick={handleLogout}
  >
    Log out
  </button>
)}
      </aside>
    </div>
  );
}

export default Sidebar;
