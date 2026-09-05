import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import { fetchEvidenceForCase, runAnalysis, fetchAnalysisResult } from "../services/api.js";

const TABS = ["NLP", "ML", "DL"];

export default function Analysis() {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("evidenceId");

  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(preselectedId || "");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("NLP");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchEvidenceForCase(caseId);
        if (mounted) setEvidenceList(data || []);
      } catch (err) {
        if (mounted) setError("Could not load evidence list.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [caseId]);

  const handleRunAnalysis = async () => {
    if (!selectedEvidenceId) {
      setError("Select a piece of evidence first.");
      return;
    }
    setRunning(true);
    setError("");
    try {
      const data = await runAnalysis(selectedEvidenceId);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleFetchExisting = async (evidenceId) => {
    setError("");
    try {
      const data = await fetchAnalysisResult(evidenceId);
      setResult(data);
    } catch (err) {
      setResult(null);
    }
  };

  useEffect(() => {
    if (selectedEvidenceId) handleFetchExisting(selectedEvidenceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvidenceId]);

  if (loading) return <Loading label="Loading evidence..." />;

  return (
    <div>
      <h2>AI Analysis</h2>

      <div className="card" style={{ marginBottom: "24px" }}>
        {error && <div className="login-error">{error}</div>}

        <div className="form-group" style={{ maxWidth: "360px" }}>
          <label>Select Evidence</label>
          <select
            value={selectedEvidenceId}
            onChange={(e) => setSelectedEvidenceId(e.target.value)}
          >
            <option value="">-- Choose evidence --</option>
            {evidenceList.map((ev) => (
              <option key={ev._id || ev.id} value={ev._id || ev.id}>
                {ev.filename || ev.file_name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={running}>
          {running ? "Running Analysis..." : "Run Analysis"}
        </button>
      </div>

      {result && (
        <div className="card">
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className="btn"
                style={{
                  background: activeTab === tab ? "var(--accent)" : "var(--bg-panel-alt)",
                  color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab} Results
              </button>
            ))}
          </div>

          {activeTab === "NLP" && (
            <div>
              <h4>Entities Extracted</h4>
              <pre style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
                {JSON.stringify(result.nlp || result.entities || {}, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === "ML" && (
            <div>
              <h4>Anomaly / Risk Flags</h4>
              <pre style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
                {JSON.stringify(result.anomaly || result.ml || {}, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === "DL" && (
            <div>
              <h4>Deepfake Detection</h4>
              <p>
                Fake Probability:{" "}
                <span className="badge badge-danger">
                  {result.deepfake?.fake_probability != null
                    ? `${(result.deepfake.fake_probability * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </p>
              <pre style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
                {JSON.stringify(result.deepfake || result.dl || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
