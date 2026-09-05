import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import { fetchCaseById } from "../services/api.js";

export default function CaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchCaseById(caseId);
        if (mounted) setCaseData(data);
      } catch (err) {
        if (mounted) setError("Could not load case details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [caseId]);

  if (loading) return <Loading label="Loading case..." />;
  if (error) return <div className="login-error">{error}</div>;
  if (!caseData) return <p>Case not found.</p>;

  const links = [
    { label: "Upload / View Evidence", to: `/cases/${caseId}/evidence` },
    { label: "AI Analysis", to: `/cases/${caseId}/analysis` },
    { label: "Timeline", to: `/cases/${caseId}/timeline` },
    { label: "Evidence Graph", to: `/cases/${caseId}/graph` },
    { label: "AI Copilot", to: `/cases/${caseId}/copilot` },
  ];

  return (
    <div>
      <h2>{caseData.title || caseData.name}</h2>
      <span
        className={
          "badge " +
          (String(caseData.status).toLowerCase() === "open" ? "badge-warning" : "badge-success")
        }
      >
        {caseData.status || "Unknown"}
      </span>

      <div className="card" style={{ marginTop: "16px", marginBottom: "24px" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          {caseData.description || "No description provided."}
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Created: {caseData.created_at ? new Date(caseData.created_at).toLocaleString() : "-"}
        </p>
      </div>

      <div className="grid grid-cols-3">
        {links.map((link) => (
          <div key={link.to} className="card" style={{ cursor: "pointer" }} onClick={() => navigate(link.to)}>
            <h3 style={{ margin: 0 }}>{link.label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
