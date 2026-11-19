
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Sidebar from "../components/Sidebar";
import "../styles/readings.css";

const PAGE_SIZE = 20;

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "--";

  const [year, month, day] = String(dateValue).slice(0, 10).split("-");

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

const slots = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];

function Readings() {
  const navigate = useNavigate();

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // PAGINATION STATE
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 20,
    totalReadings: 0,
    totalPages: 0,
    todayCount: 0,
  });

  const [formData, setFormData] = useState({
    reading_date: getToday(),
    slot: "",
    value: "",
  });

  // AUTHENTICATION AND INITIAL FETCH
  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    fetchReadings(currentPage);
  }, [navigate, currentPage]);

  // FETCH READINGS WITH SERVER-SIDE PAGINATION
  const fetchReadings = async (page = currentPage) => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/readings", {
        params: {
          page,
          limit: PAGE_SIZE,
        },
      });

      if (response.data.success) {
        setReadings(response.data.readings || []);

        // STORE BACKEND PAGINATION AND TODAY'S READING COUNT
        setPagination({
          ...response.data.pagination,
          todayCount: response.data.todayCount ?? 0,
        });
      } else {
        setError("Unable to load your readings.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch readings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // HANDLE FORM INPUTS
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ADD OR UPDATE READING
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const glucoseValue = Number(formData.value);

    if (!formData.reading_date || !formData.slot || !formData.value) {
      setError("Please complete all fields.");
      return;
    }

    if (
      !Number.isInteger(glucoseValue) ||
      glucoseValue < 40 ||
      glucoseValue > 600
    ) {
      setError(
        "Enter a whole-number glucose value between 40 and 600."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        reading_date: formData.reading_date,
        slot: formData.slot,
        value: glucoseValue,
      };

      const response = editingId
        ? await API.put(`/readings/${editingId}`, payload)
        : await API.post("/readings", payload);

      if (response.data.success) {
        const wasEditing = Boolean(editingId);

        setSuccess(
          wasEditing
            ? "Glucose reading updated successfully!"
            : "Glucose reading added successfully!"
        );

        setEditingId(null);

        setFormData({
          reading_date: getToday(),
          slot: "",
          value: "",
        });

        if (!wasEditing) {
          setCurrentPage(1);
          await fetchReadings(1);
        } else {
          await fetchReadings(currentPage);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save your reading. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // START EDITING
  const handleEdit = (reading) => {
    setEditingId(reading.id);

    setFormData({
      reading_date: String(reading.reading_date).slice(0, 10),
      slot: reading.slot,
      value: String(reading.value),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // CANCEL EDITING
  const handleCancelEdit = () => {
    setEditingId(null);

    setFormData({
      reading_date: getToday(),
      slot: "",
      value: "",
    });

    setError("");
    setSuccess("");
  };

  // DELETE READING
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reading?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setDeletingId(id);

      const response = await API.delete(`/readings/${id}`);

      if (response.data.success) {
        if (editingId === id) {
          handleCancelEdit();
        }

        setSuccess("Reading deleted successfully!");

        // REFRESH CURRENT PAGE FROM BACKEND
        await fetchReadings(currentPage);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this reading."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // SUMMARY - BACKEND TODAY COUNT
  const todayCount = pagination.todayCount ?? 0;

  // PAGINATION CALCULATIONS
  const totalPages = Math.max(1, pagination.totalPages);

  const safeCurrentPage = pagination.currentPage || 1;

  const startRecord =
    pagination.totalReadings === 0
      ? 0
      : (safeCurrentPage - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(
    safeCurrentPage * PAGE_SIZE,
    pagination.totalReadings
  );

  // CORRECT PAGE WHEN RECORDS ARE DELETED
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="readings-page">
      <Sidebar />

      <main className="readings-main">
        {/* PAGE HEADER */}
        <header className="readings-header">
          <div>
            <p className="readings-eyebrow">
              YOUR HEALTH JOURNAL
            </p>

            <h1>My readings</h1>

            <p>
              Record and keep track of your blood glucose measurements.
            </p>
          </div>

          <div className="readings-header-count">
            <span>{pagination.totalReadings}</span>
            <small>Total readings</small>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="readings-summary">
          <div className="readings-summary-card">
            <span className="summary-label">
              Total readings
            </span>

            <strong>{pagination.totalReadings}</strong>

            <span className="summary-description">
              All recorded measurements
            </span>
          </div>

          <div className="readings-summary-card">
            <span className="summary-label">
              Today's readings
            </span>

            <strong>{todayCount}</strong>

            <span className="summary-description">
              Measurements recorded today
            </span>
          </div>
        </section>

        {/* ADD / EDIT FORM */}
        <section className="reading-form-section">
          <div className="reading-section-heading">
            <div>
              <span className="reading-section-eyebrow">
                YOUR ENTRIES
              </span>

              <h2>
                {editingId ? "Edit reading" : "Add a new reading"}
              </h2>

              <p>
                {editingId
                  ? "Update your glucose measurement below."
                  : "Enter your glucose measurement below."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="reading-form">
            <div className="reading-form-group">
              <label htmlFor="reading_date">
                Reading date
              </label>

              <input
                type="date"
                id="reading_date"
                name="reading_date"
                value={formData.reading_date}
                max={getToday()}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reading-form-group">
              <label htmlFor="slot">
                Reading time
              </label>

              <select
                id="slot"
                name="slot"
                value={formData.slot}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select reading time
                </option>

                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="reading-form-group">
              <label htmlFor="value">
                Glucose value (mg/dL)
              </label>

              <input
                type="number"
                id="value"
                name="value"
                placeholder="e.g. 110"
                min="40"
                max="600"
                step="1"
                value={formData.value}
                onChange={handleChange}
                onInvalid={(e) => {
                  if (e.target.validity.rangeOverflow) {
                    e.target.setCustomValidity(
                      "Glucose value must be less than or equal to 600 mg/dL."
                    );
                  } else if (e.target.validity.rangeUnderflow) {
                    e.target.setCustomValidity(
                      "Glucose value must be at least 40 mg/dL."
                    );
                  } else if (e.target.validity.stepMismatch) {
                    e.target.setCustomValidity(
                      "Please enter a whole-number glucose value."
                    );
                  }
                }}
                onInput={(e) => e.target.setCustomValidity("")}
                required
              />
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="reading-message error" role="alert">
                {error}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className="reading-message success" role="status">
                {success}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="reading-submit"
              disabled={saving}
            >
              {saving
                ? editingId
                  ? "Updating reading..."
                  : "Saving reading..."
                : editingId
                  ? "Update reading"
                  : "Save reading"}
            </button>

            {editingId && (
              <button
                type="button"
                className="reading-cancel"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </form>
        </section>

        {/* READING HISTORY */}
        <section className="reading-history-section">
          <div className="reading-section-heading">
            <div>
              <span className="reading-section-eyebrow">
                YOUR ACTIVITY
              </span>

              <h2>Reading history</h2>

              <p>Your recorded glucose measurements.</p>
            </div>

            <span className="history-count">
              {pagination.totalReadings} records
            </span>
          </div>

          <div className="reading-history-wrapper">
            {loading ? (
              <div className="reading-empty-state">
                Loading your readings...
              </div>
            ) : readings.length === 0 ? (
              <div className="reading-empty-state">
                <div className="reading-empty-icon">⌁</div>

                <h3>No readings yet</h3>

                <p>
                  Add your first glucose reading using the form above.
                </p>
              </div>
            ) : (
              <>
                <div className="reading-table-scroll">
                  <table className="reading-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reading time</th>
                        <th>Glucose value</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {readings.map((reading) => (
                        <tr key={reading.id}>
                          <td>
                            {formatDate(reading.reading_date)}
                          </td>

                          <td>{reading.slot}</td>

                          <td>
                            <strong>{reading.value}</strong> mg/dL
                          </td>

                          <td>
                            <button
                              type="button"
                              className="reading-edit"
                              onClick={() => handleEdit(reading)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="reading-delete"
                              onClick={() => handleDelete(reading.id)}
                              disabled={deletingId === reading.id}
                            >
                              {deletingId === reading.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                <div className="reading-pagination">
                  <span className="pagination-info">
                    Showing{" "}
                    <strong>{startRecord}-{endRecord}</strong>{" "}
                    of{" "}
                    <strong>{pagination.totalReadings}</strong>{" "}
                    readings
                  </span>

                  <div className="pagination-controls">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1)
                        )
                      }
                      disabled={safeCurrentPage === 1}
                      className="pagination-button"
                    >
                      ← Previous
                    </button>

                    <span className="pagination-current">
                      Page {safeCurrentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
                      }
                      disabled={safeCurrentPage === totalPages}
                      className="pagination-button"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Readings;
