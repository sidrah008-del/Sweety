
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">

        {/* LEFT: BRANDING AND IMAGE */}

        <section className="register-visual">

          <div className="register-brand">
            <div className="register-brand-icon">S</div>
            <span>Sweety</span>
          </div>

          <div className="register-visual-content">

            <p className="register-eyebrow">
              YOUR HEALTH, YOUR TRACKER
            </p>

            <h1>
              A healthier you,
              <br />
              starts with
              <br />
              one small step.
            </h1>

            <p className="register-visual-description">
              Take a simpler approach to understanding
              and tracking your blood glucose.
            </p>

            {/* MOBILE HEADING */}

            <div className="register-mobile-heading">
              <h2>Create your account</h2>
              <p>
                Start your health journey with Sweety.
              </p>
            </div>

            <div className="register-image-wrapper">
              <img
                className="register-hero-image"
                src="/images/glucose-monitor.png"
                alt="Blood glucose monitoring"
              />
            </div>

            <p className="register-image-caption">
              ♡ Making your health journey simpler
            </p>

          </div>

          <div className="register-visual-footer">
            A little care goes a long way.
          </div>

        </section>

        {/* RIGHT: REGISTRATION FORM */}

        <section className="register-form-section">

          <div className="register-form-content">

            <div className="register-heading">
              <h2>Create your account</h2>

              <p>
                Join Sweety and start keeping track of your
                blood glucose readings.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="register-form"
            >

              {/* NAME */}

              <div className="register-form-group">
                <label htmlFor="name">
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              {/* EMAIL */}

              <div className="register-form-group">
                <label htmlFor="register-email">
                  Email address
                </label>

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              {/* PASSWORD */}

              <div className="register-form-group">
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="register-password-wrapper">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}

              <div className="register-form-group">
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* ERROR */}

              {error && (
                <div className="register-error" role="alert">
                  {error}
                </div>
              )}

              {/* BUTTON */}

              <button
                type="submit"
                className="register-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

            </form>

            <p className="register-switch">
              Already have an account?{" "}
              <Link to="/login">Log in</Link>
            </p>

            <div className="register-footer">
              <span>♡</span> Your health journey starts here
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}

export default Register;
