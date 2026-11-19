
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import API from "../services/api";
import Sidebar from "../components/Sidebar";
import "../styles/reports.css";

// Get today's date in local YYYY-MM-DD format
const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Parse a date without UTC timezone shifting
const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState(null);
  const [trend, setTrend] = useState([]);

  const [selectedDate, setSelectedDate] = useState(getToday());

  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  const [error, setError] = useState("");
  const [trendError, setTrendError] = useState("");

  // FETCH REPORTS AND TREND WHEN DATE CHANGES
  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    fetchReports(selectedDate);
    fetchTrend(selectedDate);
  }, [navigate, selectedDate]);

  // FETCH GLUCOSE REPORTS
  const fetchReports = async (date = selectedDate) => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/reports", {
        params: { date },
      });

      if (response.data.success) {
        setReports(response.data.reports);
      } else {
        setReports(null);
        setError("Unable to load reports.");
      }
    } catch (err) {
      setReports(null);

      setError(
        err.response?.data?.message ||
          "Unable to generate reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH GLUCOSE TREND
  const fetchTrend = async (date = selectedDate) => {
    try {
      setTrendLoading(true);
      setTrendError("");

      const response = await API.get("/reports/trend", {
        params: { date },
      });

      if (response.data.success) {
        setTrend(response.data.trend || []);
      } else {
        setTrend([]);
        setTrendError("Unable to load glucose trends.");
      }
    } catch (err) {
      setTrend([]);
      setTrendError(
        err.response?.data?.message ||
          "Unable to load glucose trends. Please try again."
      );
    } finally {
      setTrendLoading(false);
    }
  };

  // FORMAT VALUES
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }

    return value;
  };

  // MONTH NAME BASED ON SELECTED DATE
  const getMonthName = (dateString, offset = 0) => {
    const date = parseLocalDate(dateString);

    date.setDate(1);
    date.setMonth(date.getMonth() + offset);

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  // FORMAT SELECTED DATE
  const displayDate = parseLocalDate(selectedDate).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  // REPORT CARD
  const renderReportCard = (title, subtitle, data) => (
    <section className="report-card" key={title}>
      <div className="report-card-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <span className="report-period-label">SUMMARY</span>
      </div>

      <div className="report-stats-grid">
        <div className="report-stat">
          <span className="report-stat-label">Total readings</span>
          <strong>{formatValue(data?.total_readings)}</strong>
          <small>Recorded entries</small>
        </div>

        <div className="report-stat">
          <span className="report-stat-label">Average glucose</span>
          <strong>{formatValue(data?.average)}</strong>
          <small>mg/dL</small>
        </div>

        <div className="report-stat">
          <span className="report-stat-label">Highest reading</span>
          <strong>{formatValue(data?.highest)}</strong>
          <small>mg/dL</small>
        </div>

        <div className="report-stat">
          <span className="report-stat-label">Lowest reading</span>
          <strong>{formatValue(data?.lowest)}</strong>
          <small>mg/dL</small>
        </div>
      </div>

      {Number(data?.total_readings) === 0 && (
        <p className="report-no-data">
          No readings recorded during this period.
        </p>
      )}
    </section>
  );

  return (
    <div className="reports-page">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="reports-main">

        {/* PAGE HEADER */}
        <header className="reports-header">
          <div>
            <p className="reports-eyebrow">
              YOUR HEALTH JOURNAL
            </p>

            <h1>Glucose reports</h1>

            <p className="reports-header-description">
              Review your glucose readings and track your measurements over time.
            </p>
          </div>

          <div className="reports-date">
            <span className="reports-date-icon">▦</span>
            {displayDate}
          </div>
        </header>

        {/* DATE FILTER */}
        <section className="reports-date-filter">
          <div>
            <label htmlFor="report-date">
              Select report date
            </label>

            <p>
              Choose a date to view your daily and monthly summaries.
            </p>
          </div>

          <input
            id="report-date"
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </section>

        {/* LOADING / ERROR / REPORTS */}
        {loading ? (
          <div className="reports-message">
            <span className="reports-loading-icon">◌</span>
            <p>Loading your reports...</p>
          </div>
        ) : error ? (
          <div className="reports-error">
            <div>
              <strong>We couldn't load your reports</strong>
              <p>{error}</p>
            </div>

            <button
              onClick={() => fetchReports(selectedDate)}
            >
              Try again
            </button>
          </div>
        ) : reports ? (
          <div className="reports-content">

            {/* SECTION INTRODUCTION */}
            <div className="reports-section-intro">
              <div>
                <p className="reports-section-eyebrow">
                  YOUR SUMMARY
                </p>

                <h2>Reading overview</h2>
              </div>

              <span className="reports-updated-label">
                Based on your recorded readings
              </span>
            </div>

            {/* DAILY REPORT */}
            {renderReportCard(
              "Daily report",
              `Readings for ${displayDate}`,
              reports.daily
            )}

            {/* GLUCOSE TREND CHART */}
            <section className="report-card trend-card">
              <div className="report-card-heading">
                <div>
                  <h2>Glucose trends</h2>

                  <p>
                    Your glucose trend over the 30 days ending on{" "}
                    {parseLocalDate(selectedDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>

                <span className="trend-legend">
                  <span className="trend-legend-dot"></span>
                  Average glucose
                </span>
              </div>

              {trendLoading ? (
                <div className="trend-empty-state">
                  <p>Loading glucose trends...</p>
                </div>
              ) : trendError ? (
                <div className="trend-empty-state">
                  <strong>{trendError}</strong>

                  <button
                    className="trend-add-link"
                    onClick={() => fetchTrend(selectedDate)}
                  >
                    Try again
                  </button>
                </div>
              ) : trend.length === 0 ? (
                <div className="trend-empty-state">
                  <span className="trend-empty-icon">⌁</span>

                  <strong>
                    No trend data available yet. Add glucose readings to see your trend chart.
                  </strong>

                  <Link
                    to="/readings"
                    className="trend-add-link"
                  >
                    Add a reading
                  </Link>
                </div>
              ) : (
                <div className="trend-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trend}
                      margin={{
                        top: 15,
                        right: 20,
                        left: 5,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 4"
                        stroke="#F0E5E9"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="reading_date"
                        tickFormatter={(value) =>
                          parseLocalDate(value).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                            }
                          )
                        }
                        tick={{
                          fill: "#93858B",
                          fontSize: 12,
                        }}
                        axisLine={{ stroke: "#EDE3E7" }}
                        tickLine={false}
                      />

                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{
                          fill: "#93858B",
                          fontSize: 12,
                        }}
                        width={55}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#FFFFFF",
                          border: "1px solid #F0DCE5",
                          borderRadius: "10px",
                          boxShadow:
                            "0 5px 18px rgba(151, 7, 71, 0.08)",
                          fontSize: "12px",
                        }}
                        labelStyle={{
                          color: "#493F43",
                          fontWeight: 600,
                          marginBottom: "5px",
                        }}
                        formatter={(value) => [
                          `${value} mg/dL`,
                          "Average glucose",
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#970747"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          fill: "#F7D66D",
                          strokeWidth: 2,
                          stroke: "#970747",
                        }}
                        activeDot={{
                          r: 7,
                          fill: "#F7D66D",
                          stroke: "#970747",
                          strokeWidth: 2,
                        }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* MONTH-TO-DATE REPORT */}
            {renderReportCard(
              "Monthly report",
              `Month to date · ${getMonthName(selectedDate)}`,
              reports.monthly
            )}

            {/* PREVIOUS MONTH */}
            {renderReportCard(
              "Previous month",
              getMonthName(selectedDate, -1),
              reports.previousMonth
            )}

            {/* INFORMATION NOTE */}
            <div className="reports-note">
              <div className="reports-note-icon">i</div>

              <div>
                <strong>About your reports</strong>

                <p>
                  These summaries are calculated from the glucose readings
                  you have recorded. They are intended for tracking purposes
                  and are not medical diagnoses.
                </p>
              </div>
            </div>

          </div>
        ) : null}

        {/* FOOTER */}
        <footer className="reports-footer">
          <span>Made with care</span>
          <span>·</span>
          <span>Sweety Glucose Tracker</span>
        </footer>

      </main>
    </div>
  );
}

export default Reports;
