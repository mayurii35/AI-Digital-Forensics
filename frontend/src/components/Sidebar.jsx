import React from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/cases", label: "Cases" },
  { to: "/reports", label: "Reports" },
  { to: "/audit-logs", label: "Audit Logs" },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => "sidebar-link" + (isActive ? " sidebar-link-active" : "")}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
