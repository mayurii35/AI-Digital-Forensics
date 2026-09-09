import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ShieldCheck, Lock, Mail, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Login({ defaultRegister = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(
    defaultRegister || searchParams.get("mode") === "register"
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (defaultRegister || searchParams.get("mode") === "register") {
      setIsRegister(true);
    }
  }, [defaultRegister, searchParams]);

  const switchMode = (reg) => {
    setIsRegister(reg);
    setError("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        setSuccessMsg("Account created! Redirecting to dashboard…");
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already registered — switch to Sign In.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError(err.message || "Authentication failed. Please verify credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-auth-page">
      <div className="ui-auth-card">
        {/* Brand Header */}
        <div className="auth-card-brand">
          <div className="auth-card-icon">
            <ShieldCheck size={26} className="text-blue" />
          </div>
          <h2 className="auth-card-title">Forensiq<span className="text-blue">AI</span></h2>
          <p className="auth-card-subtitle">
            {isRegister
              ? "Create your investigator account"
              : "Digital Forensics & Evidence Intelligence"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? "auth-tab-btn-active" : ""}`}
            onClick={() => switchMode(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? "auth-tab-btn-active" : ""}`}
            onClick={() => switchMode(true)}
          >
            Register
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="ui-alert ui-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="ui-alert ui-alert-success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form-body">
          {isRegister && (
            <div className="ui-form-group">
              <label htmlFor="auth-name">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={17} className="auth-input-icon" />
                <input
                  id="auth-name"
                  className="ui-input auth-field-with-icon"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Detective John Miller"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="ui-form-group">
            <label htmlFor="auth-email">Investigator Email</label>
            <div className="auth-input-wrapper">
              <Mail size={17} className="auth-input-icon" />
              <input
                id="auth-email"
                className="ui-input auth-field-with-icon"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@agency.gov"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="ui-form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={17} className="auth-input-icon" />
              <input
                id="auth-password"
                className="ui-input auth-field-with-icon auth-field-with-eye"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="ui-form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="auth-confirm-password"
                  className="ui-input auth-field-with-icon"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            id="auth-submit-btn"
            className="ui-button ui-button-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating…</span>
            ) : (
              <>
                <span>{isRegister ? "Create Investigator Account" : "Sign In to Workspace"}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="auth-card-footer">
          <span>{isRegister ? "Already registered?" : "Need an account?"}</span>
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => switchMode(!isRegister)}
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}