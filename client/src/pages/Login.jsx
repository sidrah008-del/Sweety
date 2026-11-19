
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    const { email, password } = formData;

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
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
        "Unable to log in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* LEFT: BRANDING AND IMAGE */}
        <section className="login-visual">

          <div className="login-brand">
            <div className="login-brand-icon">S</div>
            <span>Sweety</span>
          </div>

          <div className="login-visual-content">
            <p className="login-eyebrow">
              YOUR HEALTH, YOUR TRACKER
            </p>

            <h1>
              Your health,
              <br />
              one reading
              <br />
              at a time.
            </h1>

            <p className="login-visual-description">
              Take a simpler approach to understanding
              and tracking your blood glucose.
            </p>

           <div className="login-image-wrapper">
  <img
    className="login-hero-image"
    src="/images/glucose-monitor.png"
    alt="Blood glucose monitoring"
  />
</div>

            <p className="login-image-caption">
              ♡ Making your health journey simpler
            </p>
          </div>

          <div className="login-visual-footer">
            A little care goes a long way.
          </div>

        </section>

        {/* RIGHT: LOGIN FORM */}
        <section className="login-form-section">

          <div className="login-form-content">

            <div className="login-mobile-brand">
              <div className="login-brand-icon">S</div>
              <span>Sweety</span>
            </div>

            <div className="login-heading">
              

              <h2>Welcome back!</h2>

              <p>
                Sign in to continue your health journey.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              <div className="login-form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="password">
                  Password
                </label>

                <div className="login-password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

            </form>

            <p className="login-switch">
              Don't have an account?{" "}
              <Link to="/register">Create account</Link>
            </p>

            <div className="login-footer">
              <span>♡</span> Your health journey starts here
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}

export default Login;
