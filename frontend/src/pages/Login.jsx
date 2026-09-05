import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api.js";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      // Expected shape: { token, role, username }
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role || "");
      localStorage.setItem("username", data.username || username.trim());
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Invalid username or password.";
      setError(msg);
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
        
        <svg className="login-circuit" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path className="login-circuit-path lp-1" d="M 10 30 L 40 30 L 40 50" />
          <path className="login-circuit-path lp-2" d="M 60 70 L 90 70 L 90 50" />
          <circle className="login-circuit-dot ld-1" cx="40" cy="50" r="2" />
          <circle className="login-circuit-dot ld-2" cx="90" cy="50" r="2" />
        </svg>
      </div>

      <div className="login-box">
        <h1>AI Digital Forensics</h1>
        <p>Sign in to access the investigation platform</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
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
            style={{ width: "100%", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
