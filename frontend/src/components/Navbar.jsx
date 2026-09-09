import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  return (
    <header className="navbar">
      <div
        className="navbar-brand"
        onClick={() => navigate("/dashboard")}
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer" }}
      >
        <span className="navbar-brand-icon">
          <ShieldCheck size={22} className="text-blue" />
        </span>
        <span className="navbar-brand-text">
          Forensiq<span className="text-blue">AI</span>
        </span>
        <span className="navbar-brand-badge">SaaS Intelligence</span>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <User size={15} className="text-secondary" />
          <span className="navbar-user-email">
            {currentUser?.displayName || currentUser?.email || "Investigator"}
          </span>
        </div>
        <button
          className="navbar-logout"
          onClick={logout}
          title="Sign out of workspace"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
