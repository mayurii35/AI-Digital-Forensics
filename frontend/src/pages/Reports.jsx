import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { generateReport, getReportPdfUrl } from "../services/api.js";

export default function Reports() {
  const { caseId } = useParams();
  const [reportText, setReportText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await generateReport(caseId);
      setReportText(data.report_text || "");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Generate Report</h2>

      <div className="card" style={{ marginBottom: "24px" }}>
        {error && <div className="login-error">{error}</div>}

        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !caseId}>
          {loading ? "Generating..." : "Generate Report"}
        </button>

        {caseId && (
          <a
            href={getReportPdfUrl(caseId)}
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ marginLeft: "12px", background: "var(--bg-panel-alt)", color: "var(--text-primary)" }}
          >
            Download PDF
          </a>
        )}

        {!caseId && (
          <p style={{ color: "var(--text-secondary)", marginTop: "12px" }}>
            Open this page from a specific case (via Case Details) to generate its report.
          </p>
        )}
      </div>

      {reportText && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Report Preview</h3>
          <pre style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
            {reportText}
          </pre>
        </div>
      )}
    </div>
  );
}
