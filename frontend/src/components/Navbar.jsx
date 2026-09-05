import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api.js";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Investigator";
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  return (
    <header className="navbar">
      <span className="navbar-brand">AI Digital Forensics</span>
      <div className="navbar-right">
        <span className="navbar-user">{username}</span>
        <button className="navbar-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
