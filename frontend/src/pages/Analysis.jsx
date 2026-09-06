import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BrainCircuit, Sparkles } from "lucide-react";
import Loading from "../components/Loading.jsx";
import { fetchEvidenceForCase, fetchAnalysisResult, runAnalysis } from "../services/api.js";

const tabs = ["NLP / AI", "ML", "DL"];
const tone = (r) =>
  String(r).toLowerCase() === "high"
    ? "badge-danger"
    : String(r).toLowerCase() === "medium"
    ? "badge-warning"
    : "badge-neutral";

export default function Analysis() {
  const { caseId } = useParams();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(params.get("evidenceId") || "");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("NLP / AI");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvidenceForCase(caseId)
      .then(setItems)
      .catch(() => setError("Could not load evidence."))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => {
    if (selected) fetchAnalysisResult(selected).then(setResult).catch(() => setResult(null));
  }, [selected]);

  const run = async () => {
    if (!selected) return setError("Select evidence first.");
    setBusy(true);
    setError("");
    try {
      setResult(await runAnalysis(selected));
    } catch (e) {
      setError(e.response?.data?.detail || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading label="Loading analysis workspace…" />;

  const nlp = result?.nlp || {};
  const ml = result?.ml || {};
  const deepfake = result?.deepfake || {};

  return (
    <section className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AI ANALYSIS</p>
          <h1>Evidence Intelligence</h1>
          <p>Run Groq-assisted analysis and review risk indicators.</p>
        </div>
      </div>

      {error && <div className="error-card">{error}</div>}

      <div className="card analysis-controls">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select evidence…</option>
          {items.map((ev) => (
            <option key={ev.evidence_id} value={ev.evidence_id}>
              {ev.evidence_name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={run} disabled={busy}>
          <BrainCircuit size={17} />
          {busy ? "Running analysis…" : "Run Analysis"}
        </button>
      </div>

      {result && (
        <div className="card">
          <div className="tabs">
            {tabs.map((t) => (
              <button key={t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === "NLP / AI" && (
            <div className="results">
              <div className="result-top">
                <div>
                  <h2>Analysis Findings</h2>
                  <p className="muted">{result.indicator_count || 0} suspicious indicators found</p>
                </div>
                <span className={`badge ${tone(result.risk_level)}`}>{result.risk_level || "unknown"} risk</span>
              </div>

              <pre className="report-panel">{nlp.summary || "No narrative analysis returned."}</pre>

              <h3>Entities extracted</h3>
              <div className="chip-list">
                {(nlp.entities_extracted || []).length ? (
                  (nlp.entities_extracted || []).map((x, i) => (
                    <span className="indicator-chip" key={i}>
                      {typeof x === "string" ? x : JSON.stringify(x)}
                    </span>
                  ))
                ) : (
                  <span className="muted">No entities extracted.</span>
                )}
              </div>

              <h3>Suspicious indicators</h3>
              <div className="chip-list">
                {(result.suspicious_indicators || []).length ? (
                  (result.suspicious_indicators || []).map((x, i) => (
                    <span className="indicator-chip" key={i}>
                      {typeof x === "string" ? x : JSON.stringify(x)}
                    </span>
                  ))
                ) : (
                  <span className="muted">No indicators returned.</span>
                )}
              </div>
            </div>
          )}

          {tab === "ML" && (
            <div className="coming-soon">
              <Sparkles size={28} />
              <h2>Not Yet Implemented</h2>
              <p>{ml.note || "Machine Learning anomaly detection module under development."}</p>
            </div>
          )}

          {tab === "DL" && (
            <div className="coming-soon">
              <Sparkles size={28} />
              <h2>Not Yet Implemented</h2>
              <p>{deepfake.note || "Deep Learning deepfake detection module under development."}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}