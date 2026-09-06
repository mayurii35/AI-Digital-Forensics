import React from "react";

export default function StatCard({ label, value, tone = "neutral", icon }) {
  return (
    <div className={`stat-card stat-tone-${tone}`}>
      <div className="stat-card-top">{icon && <span className="stat-icon">{icon}</span>}<span className="stat-value">{value}</span></div>
      <span className="stat-label">{label}</span>
    </div>
  );
}
