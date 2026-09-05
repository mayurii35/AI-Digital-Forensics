import React from "react";

export default function Loading({ label = "Loading..." }) {
  return (
    <div className="loading-block">
      <div className="loading-spinner" />
      <p>{label}</p>
    </div>
  );
}
