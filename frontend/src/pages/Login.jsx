import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log("LOGIN SUCCESS:", result.user.email);
      console.log("AUTH CURRENT USER:", auth.currentUser?.email);

      navigate("/dashboard");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-particles" aria-hidden="true">
        <span className="login-particle p1" />
        <span className="login-particle p2" />
        <span className="login-particle p3" />
        <span className="login-particle p4" />
        <span className="login-particle p5" />

        <div className="login-orb" />

        <svg
          className="login-circuit"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="login-circuit-path lp-1"
            d="M 10 30 L 40 30 L 40 50"
          />

          <path
            className="login-circuit-path lp-2"
            d="M 60 70 L 90 70 L 90 50"
          />

          <circle
            className="login-circuit-dot ld-1"
            cx="40"
            cy="50"
            r="2"
          />

          <circle
            className="login-circuit-dot ld-2"
            cx="90"
            cy="50"
            r="2"
          />
        </svg>
      </div>

      <div className="login-box">
        <h1>AI Digital Forensics</h1>

        <p>
          Sign in to access the investigation platform
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              marginTop: "8px",
              marginBottom: "16px",
            }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{ color: "var(--accent)" }}
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}