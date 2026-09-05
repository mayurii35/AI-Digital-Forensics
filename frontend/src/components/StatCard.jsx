import React from "react";

export default function StatCard({ label, value, tone = "neutral" }) {
  return (
    <div className={`stat-card stat-tone-${tone}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
