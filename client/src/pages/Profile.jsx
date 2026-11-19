
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser || typeof parsedUser !== "object") {
        throw new Error("Invalid user data");
      }

      setUser(parsedUser);
      setEditedName(parsedUser.name || "");
    } catch {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleEdit = () => {
    setEditedName(user.name || "");
    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedName(user.name || "");
    setError("");
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const trimmedName = editedName.trim();

    if (!trimmedName) {
      setError("Name cannot be empty");
      return;
    }

    if (trimmedName === user.name) {
      setIsEditing(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await API.put("/profile", {
        name: trimmedName,
      });

      if (response.data.success) {
        const updatedUser = {
          ...user,
          ...response.data.user,
        };

        setUser(updatedUser);
        setEditedName(updatedUser.name);

        sessionStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        setIsEditing(false);
        setSuccess("Profile updated successfully!");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const initial =
    user.name?.trim()?.charAt(0).toUpperCase() || "U";

  return (
    <div className="profile-page">
      <Sidebar />

      <main className="profile-main">
        {/* PAGE HEADER */}
        <header className="profile-header">
          <div>
            <p className="profile-eyebrow">YOUR ACCOUNT</p>
            <h1>My Profile</h1>
            <p>
              Manage and view your account information.
            </p>
          </div>
        </header>

        {/* PROFILE OVERVIEW */}
        <section className="profile-card">
          <div className="profile-avatar">{initial}</div>

          <div className="profile-user-heading">
            <span className="profile-card-label">
              ACCOUNT HOLDER
            </span>

            <h2>{user.name || "User"}</h2>
            <p>{user.email || "--"}</p>

            <span className="profile-status">
              <span className="profile-status-dot"></span>
              Active account
            </span>
          </div>

          <div className="profile-card-decoration">S</div>
        </section>

        {/* PERSONAL INFORMATION */}
        <section className="profile-details-section">
          <div className="profile-section-heading">
            <div>
              <p className="profile-section-eyebrow">
                ACCOUNT DETAILS
              </p>

              <h2>Personal information</h2>

              <p>Your registered account details.</p>
            </div>

            <span className="profile-section-icon">♙</span>
          </div>

          <div className="profile-details-card">
            <div className="profile-detail">
              <div className="profile-detail-label">
                <span className="profile-detail-icon">♙</span>
                <span>Full name</span>
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="profile-edit-form">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your full name"
                    maxLength={100}
                    autoFocus
                    aria-label="Full name"
                  />

                  <div className="profile-edit-actions">
                    <button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-name-display">
                  <strong>{user.name || "--"}</strong>

                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="profile-detail">
              <div className="profile-detail-label">
                <span className="profile-detail-icon">@</span>
                <span>Email address</span>
              </div>

              <strong>{user.email || "--"}</strong>
            </div>

            <div className="profile-detail">
              <div className="profile-detail-label">
                <span className="profile-detail-icon">#</span>
                <span>User ID</span>
              </div>

              <strong>#{user.id || "--"}</strong>
            </div>
          </div>

          {error && (
            <p className="profile-message profile-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="profile-message profile-success" role="status">
              {success}
            </p>
          )}
        </section>

        {/* ACCOUNT SECURITY */}
        <section className="profile-security">
          <div className="profile-security-content">
            <div className="profile-security-icon">✓</div>

            <div>
              <h2>Account security</h2>
              <p>
                Your account is protected using secure
                authentication. Keep your login credentials private.
              </p>
            </div>
          </div>

          <span className="profile-security-badge">
            <span></span>
            Secured
          </span>
        </section>

        {/* FOOTER */}
        <footer className="profile-footer">
          <span>Made with care</span>
          <span>·</span>
          <span>Sweety Glucose Tracker</span>
        </footer>
      </main>
    </div>
  );
}

export default Profile;
