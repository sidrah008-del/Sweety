
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";

// FORMAT DATE
const formatDate = (dateValue) => {
  if (!dateValue) return "--";

  const date = String(dateValue).slice(0, 10);
  const [year, month, day] = date.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [readings, setReadings] = useState([]);

  // DASHBOARD SUMMARY
  const [summary, setSummary] = useState({
    total_readings: 0,
    today_count: 0,
    average_glucose: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AUTHENTICATION
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const savedUser = sessionStorage.getItem("user");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem("user");
      }
    }

    fetchDashboardData();
  }, [navigate]);

  // FETCH DASHBOARD DATA
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch summary and latest five readings simultaneously
      const [summaryResponse, readingsResponse] =
        await Promise.all([
          API.get("/readings/summary"),
          API.get("/readings?page=1&limit=5"),
        ]);

      if (
        summaryResponse.data.success &&
        readingsResponse.data.success
      ) {
        setSummary(
          summaryResponse.data.summary || {
            total_readings: 0,
            today_count: 0,
            average_glucose: null,
          }
        );

        setReadings(readingsResponse.data.readings || []);
      } else {
        setError("Unable to load your readings.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load dashboard information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // SORT READINGS: NEWEST FIRST
  const sortedReadings = [...readings].sort((a, b) => {
    const dateComparison =
      String(b.reading_date).slice(0, 10).localeCompare(
        String(a.reading_date).slice(0, 10)
      );

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return Number(b.id) - Number(a.id);
  });

  // LATEST READING
  const latestReading = sortedReadings[0] || null;

  // TOTAL READINGS
  const totalReadings = Number(summary.total_readings) || 0;

  // TODAY'S READINGS
  const todayCount = Number(summary.today_count) || 0;

  // OVERALL AVERAGE
  const averageGlucose =
    summary.average_glucose !== null &&
    summary.average_glucose !== undefined
      ? Number(summary.average_glucose).toFixed(1)
      : null;

  // LATEST FIVE READINGS
  const recentReadings = sortedReadings.slice(0, 5);

  // CURRENT DATE DISPLAY
  const displayDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // LOADING STATE
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-content">
          <div className="loading-logo">S</div>
          <p>Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* SHARED SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">
              {displayDate}
            </p>

            <h1>
              Good day, {user?.name?.split(" ")[0] || "there"}!
            </h1>

            <p className="dashboard-subtitle">
              Here's an overview of your health tracking.
            </p>
          </div>

          <Link to="/profile" className="dashboard-profile-link">
            <div className="dashboard-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
          </Link>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="dashboard-error" role="alert">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchDashboardData}
            >
              Try again
            </button>
          </div>
        )}

        {/* GLUCOSE OVERVIEW */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                YOUR HEALTH AT A GLANCE
              </span>

              <h2>Glucose overview</h2>

              <p>
                A summary of your recorded glucose readings
              </p>
            </div>
          </div>

          <div className="overview-grid">

            {/* LATEST READING */}
            <div className="overview-card latest-card">
              <div className="stat-top">
                <p className="card-label">Latest reading</p>
                <span className="stat-icon latest-icon">⌁</span>
              </div>

              <div className="stat-value">
                <h3>
                  {latestReading ? latestReading.value : "--"}
                </h3>
                <span className="card-unit">mg/dL</span>
              </div>

              <p className="card-note">
                {latestReading
                  ? `${latestReading.slot} · ${formatDate(
                      latestReading.reading_date
                    )}`
                  : "No readings recorded yet"}
              </p>
            </div>

            {/* TOTAL READINGS */}
            <div className="overview-card">
              <div className="stat-top">
                <p className="card-label">Total readings</p>
                <span className="stat-icon total-icon">▤</span>
              </div>

              <div className="stat-value">
                <h3>{totalReadings}</h3>
              </div>

              <p className="card-note">
                Across all recorded dates
              </p>
            </div>

            {/* TODAY'S READINGS */}
            <div className="overview-card today-card">
              <div className="stat-top">
                <p className="card-label">Today's readings</p>
                <span className="stat-icon today-icon">✳</span>
              </div>

              <div className="stat-value">
                <h3>{todayCount}</h3>
              </div>

              <p className="card-note">
                Readings recorded today
              </p>
            </div>
          </div>

          {/* OVERALL AVERAGE */}
          <div className="average-summary">
            <div className="average-icon">⌁</div>

            <div className="average-content">
              <p className="card-label">
                Overall average glucose
              </p>

              <div className="average-value">
                <h3>
                  {averageGlucose !== null
                    ? averageGlucose
                    : "--"}
                </h3>

                <span className="card-unit">mg/dL</span>
              </div>

              <p className="card-note">
                Calculated across all recorded readings
              </p>
            </div>

            <div className="average-decoration">
              SWEETY
            </div>
          </div>
        </section>

        {/* RECENT READINGS */}
        <section className="dashboard-section recent-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                YOUR ACTIVITY
              </span>

              <h2>Recent readings</h2>

              <p>Your latest glucose measurements</p>
            </div>

            <button
              type="button"
              className="view-all-button"
              onClick={() => navigate("/readings")}
            >
              View all <span>→</span>
            </button>
          </div>

          <div className="readings-table-wrapper">
            {error ? (
              <div className="empty-state">
                <div className="empty-icon">!</div>
                <h3>Readings unavailable</h3>
                <p>We couldn't display your recent readings.</p>
              </div>
            ) : recentReadings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⌁</div>

                <h3>No readings yet</h3>

                <p>
                  Your glucose readings will appear here
                  once you start recording them.
                </p>

                <Link
                  to="/readings"
                  className="empty-action"
                >
                  Add your first reading →
                </Link>
              </div>
            ) : (
              <table className="readings-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reading slot</th>
                    <th>Glucose value</th>
                  </tr>
                </thead>

                <tbody>
                  {recentReadings.map((reading) => (
                    <tr key={reading.id}>
                      <td>
                        {formatDate(reading.reading_date)}
                      </td>

                      <td>{reading.slot}</td>

                      <td>
                        <span className="reading-value">
                          {reading.value}
                        </span>

                        <span className="reading-unit">
                          mg/dL
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="dashboard-footer">
          <span>♡</span> Taking small steps towards better health.
        </footer>

      </main>
    </div>
  );
}

export default Dashboard;
