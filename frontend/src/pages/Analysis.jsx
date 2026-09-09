import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  Sparkles,
  ShieldAlert,
  Search,
  Tag,
  CheckCircle2,
  FileSearch,
  Sliders,
  ArrowLeft,
  Cpu,
  Eye,
  BarChart2,
  AlertTriangle,
  Layers,
  Zap,
  ImageIcon
} from "lucide-react";
import Loading from "../components/Loading.jsx";
import {
  fetchEvidenceForCase,
  fetchAnalysisResult,
  runAnalysis,
} from "../services/api.js";

const tabs = [
  "Executive Intelligence",
  "Threat Indicators",
  "ML Intelligence",
  "Deep Learning",
  "Forensic Recommendations",
  "Metadata Screening",
];

export default function Analysis() {
  const { caseId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(params.get("evidenceId") || "");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("Executive Intelligence");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvidenceForCase(caseId)
      .then((evList) => {
        setItems(evList);
        if (!selected && evList.length > 0) {
          setSelected(evList[0].evidence_id);
          setParams({ evidenceId: evList[0].evidence_id });
        }
      })
      .catch(() => setError("Could not load evidence for this case."))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => {
    if (selected) {
      fetchAnalysisResult(selected)
        .then(setResult)
        .catch(() => setResult(null));
    }
  }, [selected]);

  const handleSelect = (evId) => {
    setSelected(evId);
    setParams({ evidenceId: evId });
  };

  const run = async () => {
    if (!selected) return setError("Select an evidence item first.");
    setBusy(true);
    setError("");
    try {
      const res = await runAnalysis(selected);
      setResult(res);
    } catch (e) {
      setError(e.response?.data?.detail || "AI analysis failed.");
    } finally {
      setBusy(false);
    }
  };

  const getRiskColor = (level) => {
    switch (String(level).toLowerCase()) {
      case "critical": return "text-danger";
      case "high": return "text-danger";
      case "medium": return "text-warning";
      default: return "text-success";
    }
  };

  const getRiskBadgeClass = (level) => {
    switch (String(level).toLowerCase()) {
      case "critical":
      case "high": return "badge-danger";
      case "medium": return "badge-warning";
      default: return "badge-neutral";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "#ef4444";
    if (confidence >= 60) return "#f59e0b";
    if (confidence >= 40) return "#3b82f6";
    return "#22c55e";
  };

  if (loading) return <Loading label="Loading forensic intelligence workspace…" />;

  const nlp = result?.nlp || {};
  const metadata = result?.metadata || {};
  const mlResult = result?.ml || {};
  const deepfakeResult = result?.deepfake || {};
  const selectedEvidence = items.find((e) => e.evidence_id === selected);
  const indicators =
    result?.structured_indicators ||
    result?.suspicious_indicators ||
    [];
  const recommendations = result?.recommendations || [];
  const riskScore = result?.risk_score || 0;
  const riskLevel = result?.risk_level || "Low";

  // ML data
  const mlCategory = mlResult?.predicted_category || "—";
  const mlConfidence = mlResult?.confidence || 0;
  const mlAnomaly = mlResult?.anomaly_detected || false;
  const mlAnomalyScore = mlResult?.anomaly_score || 0;
  const mlRiskLevel = mlResult?.risk_level || "Low";
  const topFeatures = mlResult?.top_features || [];
  const categoryProbs = mlResult?.category_probabilities || {};

  // DL / ELA data
  const elaStatus = deepfakeResult?.status || "not_run";
  const elaTamperScore = deepfakeResult?.tamper_score || 0;
  const elaIsTampered = deepfakeResult?.is_tampered || false;
  const elaMethod = deepfakeResult?.method || "";
  const elaDetails = deepfakeResult?.details || {};

  return (
    <section className="page-shell">
      {/* HEADER */}
      <div className="page-heading">
        <div>
          <button
            className="ui-back-button"
            onClick={() => navigate(`/cases/${caseId}`)}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={15} /> Back to Case Overview
          </button>
          <p className="eyebrow">AI ANALYSIS & THREAT EVALUATION</p>
          <h1>Forensic Intelligence Suite</h1>
          <p>
            Automated semantic extraction, ML threat classification, DL image forensics, and AI-assisted triage.
          </p>
        </div>
      </div>

      {error && <div className="error-card">{error}</div>}

      {/* CONTROLS */}
      <div className="card analysis-controls-card">
        <div className="analysis-controls-row">
          <div className="select-wrap">
            <select
              value={selected}
              onChange={(e) => handleSelect(e.target.value)}
              className="analysis-select"
            >
              <option value="">Select Evidence Item…</option>
              {items.map((ev) => (
                <option key={ev.evidence_id} value={ev.evidence_id}>
                  {ev.evidence_name || ev.file_name} ({ev.evidence_type || "file"})
                </option>
              ))}
            </select>
          </div>

          <button
            className="ui-button ui-button-primary"
            onClick={run}
            disabled={busy || !selected}
          >
            <BrainCircuit size={16} />
            {busy ? "Executing AI Pipeline…" : "Execute AI Analysis"}
          </button>

          {selected && (
            <button
              className="ui-button ui-button-ghost"
              onClick={() =>
                navigate(`/cases/${caseId}/text-tracker?evidenceId=${selected}`)
              }
            >
              <FileSearch size={15} /> Open in Text Tracker
            </button>
          )}
        </div>
      </div>

      {result ? (
        <div className="card analysis-result-card">
          {/* Top Score Banner */}
          <div className="analysis-banner-row">
            <div className="analysis-score-block">
              <div className={`score-ring ring-${riskLevel.toLowerCase()}`}>
                <span className="score-num">{riskScore}</span>
                <span className="score-den">/ 100</span>
              </div>
              <div>
                <span className="eyebrow">ASSESSED THREAT LEVEL</span>
                <h2 className={`risk-heading ${getRiskColor(riskLevel)}`}>
                  {riskLevel} Risk
                </h2>
                <span className="muted">
                  {result.indicator_count || indicators.length} suspicious artifact(s) flagged
                </span>
              </div>
            </div>

            <div className="analysis-meta-tags">
              <span className={`badge ${getRiskBadgeClass(riskLevel)}`}>
                {riskLevel.toUpperCase()} RISK
              </span>
              {mlCategory !== "—" && mlCategory !== "Unclassified" && (
                <span className="badge badge-neutral">
                  <Cpu size={11} /> ML: {mlCategory}
                </span>
              )}
              {mlAnomaly && (
                <span className="badge badge-warning">
                  <AlertTriangle size={11} /> Anomaly Detected
                </span>
              )}
              {elaIsTampered && (
                <span className="badge badge-danger">
                  <Eye size={11} /> Image Tampered
                </span>
              )}
              <span className="meta-badge">
                Artifact: {selectedEvidence?.evidence_name || selected}
              </span>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs">
            {tabs.map((t) => (
              <button
                key={t}
                className={tab === t ? "tab active" : "tab"}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* TAB 1: EXECUTIVE INTELLIGENCE */}
          {tab === "Executive Intelligence" && (
            <div className="results-tab-content">
              <div className="executive-summary-box">
                <div className="summary-title-row">
                  <Sparkles size={18} className="text-accent" />
                  <h3>Executive Summary</h3>
                </div>
                <p className="summary-body-text">
                  {result.executive_summary ||
                    nlp.summary ||
                    "Analysis completed without high-severity anomalies."}
                </p>
              </div>

              {/* Extracted Entities */}
              <div className="entities-section">
                <div className="section-title-row">
                  <Tag size={16} className="text-accent" />
                  <h4>Extracted Entities & Digital Artifacts</h4>
                </div>

                <div className="chip-list">
                  {(nlp.entities_extracted || []).length ? (
                    nlp.entities_extracted.map((x, i) => (
                      <span className="entity-chip" key={i}>
                        {typeof x === "string"
                          ? x
                          : x?.name || x?.value || JSON.stringify(x)}
                      </span>
                    ))
                  ) : (
                    <span className="muted">No discrete entities extracted.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THREAT INDICATORS */}
          {tab === "Threat Indicators" && (
            <div className="results-tab-content">
              <div className="section-title-row">
                <ShieldAlert size={18} className="text-warning" />
                <h3>Suspicious Indicators & Heuristic Findings</h3>
              </div>

              {indicators.length > 0 ? (
                <div className="table-wrap">
                  <table className="indicator-table-analysis">
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Type</th>
                        <th>Indicator Value</th>
                        <th>Line #</th>
                        <th>Forensic Finding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indicators.map((ind, idx) => {
                        const sev = ind.severity || "MEDIUM";
                        const val = ind.value || ind.indicator || "";
                        const reason = ind.reason || ind.description || "";
                        return (
                          <tr key={idx}>
                            <td>
                              <span
                                className={`badge-indicator badge-tracker-${sev.toLowerCase()}`}
                              >
                                {sev}
                              </span>
                            </td>
                            <td>
                              <strong>{ind.type || "Keyword"}</strong>
                            </td>
                            <td>
                              <code>{val}</code>
                            </td>
                            <td>
                              {ind.line_number ? (
                                <button
                                  className="line-jump-btn"
                                  onClick={() =>
                                    navigate(
                                      `/cases/${caseId}/text-tracker?evidenceId=${selected}`
                                    )
                                  }
                                >
                                  L{ind.line_number}
                                </button>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>{reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-subtle">
                  <CheckCircle2 size={32} className="text-success" />
                  <p>No suspicious indicators detected for this item.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ML INTELLIGENCE */}
          {tab === "ML Intelligence" && (
            <div className="results-tab-content">
              <div className="section-title-row">
                <Cpu size={18} className="text-accent" />
                <h3>Machine Learning Threat Classification</h3>
              </div>

              {mlResult && Object.keys(mlResult).length > 0 ? (
                <div className="ml-intelligence-grid">

                  {/* Classifier Result Card */}
                  <div className="ml-result-card ml-primary-card">
                    <div className="ml-card-icon">
                      <BrainCircuit size={32} className="text-accent" />
                    </div>
                    <div className="ml-card-body">
                      <span className="eyebrow">PREDICTED THREAT CATEGORY</span>
                      <h2 className="ml-category-label">{mlCategory}</h2>
                      <div className="ml-confidence-bar-wrap">
                        <div className="ml-confidence-bar-track">
                          <div
                            className="ml-confidence-bar-fill"
                            style={{
                              width: `${mlConfidence}%`,
                              background: getConfidenceColor(mlConfidence)
                            }}
                          />
                        </div>
                        <span className="ml-confidence-pct">{mlConfidence}% confidence</span>
                      </div>
                      <span className={`badge ${getRiskBadgeClass(mlRiskLevel)}`}>
                        ML Risk: {mlRiskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Anomaly Detection Card */}
                  <div className={`ml-result-card ${mlAnomaly ? "ml-anomaly-card-danger" : "ml-anomaly-card-safe"}`}>
                    <div className="ml-card-icon">
                      <Zap size={28} className={mlAnomaly ? "text-danger" : "text-success"} />
                    </div>
                    <div className="ml-card-body">
                      <span className="eyebrow">ISOLATION FOREST ANOMALY DETECTION</span>
                      <h3 className={mlAnomaly ? "text-danger" : "text-success"}>
                        {mlAnomaly ? "⚠ Anomaly Detected" : "✓ No Anomaly"}
                      </h3>
                      <p className="muted">
                        Anomaly Score: <code>{mlAnomalyScore}</code>
                        <br />
                        {mlAnomaly
                          ? "This evidence deviates significantly from normal patterns — indicative of malicious activity."
                          : "Evidence patterns are consistent with normal baseline behavior."}
                      </p>
                    </div>
                  </div>

                  {/* Category Probabilities */}
                  {Object.keys(categoryProbs).length > 0 && (
                    <div className="ml-result-card ml-prob-card" style={{ gridColumn: "1 / -1" }}>
                      <div className="section-title-row" style={{ marginBottom: 16 }}>
                        <BarChart2 size={16} className="text-accent" />
                        <h4>Category Probability Distribution</h4>
                      </div>
                      <div className="ml-prob-list">
                        {Object.entries(categoryProbs)
                          .sort(([, a], [, b]) => b - a)
                          .map(([cat, prob]) => (
                            <div key={cat} className="ml-prob-row">
                              <span className="ml-prob-label">{cat}</span>
                              <div className="ml-prob-bar-track">
                                <div
                                  className="ml-prob-bar-fill"
                                  style={{
                                    width: `${prob}%`,
                                    background: cat === mlCategory
                                      ? getConfidenceColor(prob)
                                      : "rgba(96,165,250,0.4)"
                                  }}
                                />
                              </div>
                              <span className="ml-prob-pct">{prob}%</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Top Features */}
                  {topFeatures.length > 0 && (
                    <div className="ml-result-card" style={{ gridColumn: "1 / -1" }}>
                      <div className="section-title-row" style={{ marginBottom: 12 }}>
                        <Layers size={16} className="text-accent" />
                        <h4>Top Discriminating Tokens (TF-IDF Features)</h4>
                      </div>
                      <div className="chip-list">
                        {topFeatures.map((f, i) => (
                          <span key={i} className="entity-chip entity-chip-ml">{f}</span>
                        ))}
                      </div>
                      <p className="muted" style={{ marginTop: 8, fontSize: "0.8rem" }}>
                        These tokens had the highest weight in the logistic regression classifier's decision.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state-subtle">
                  <Cpu size={32} className="text-secondary" />
                  <p>Run AI Analysis to generate ML threat classification results.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DEEP LEARNING (ELA) */}
          {tab === "Deep Learning" && (
            <div className="results-tab-content">
              <div className="section-title-row">
                <Eye size={18} className="text-accent" />
                <h3>Deep Learning — Image Forgery Detection (ELA)</h3>
              </div>

              {elaStatus === "non_image_artifact" ? (
                <div className="ela-non-image-banner">
                  <ImageIcon size={36} className="text-secondary" />
                  <div>
                    <h4>Non-Image Evidence Artifact</h4>
                    <p className="muted">
                      Error Level Analysis (ELA) only applies to raster image formats (.jpg, .jpeg, .png, .webp, .bmp, .tiff).
                      The selected evidence is a <strong>{selectedEvidence?.evidence_type || "document/log"}</strong> and does not require pixel-level forgery analysis.
                    </p>
                    <p className="muted" style={{ marginTop: 8 }}>
                      For text-based artifacts, use the <strong>Text Tracker</strong> and <strong>ML Intelligence</strong> tabs instead.
                    </p>
                  </div>
                </div>
              ) : elaStatus === "error" || elaStatus === "failed" ? (
                <div className="error-card">
                  <AlertTriangle size={20} /> ELA analysis encountered an error: {deepfakeResult?.error || "Unknown error"}
                </div>
              ) : elaStatus === "not_run" ? (
                <div className="empty-state-subtle">
                  <Eye size={32} className="text-secondary" />
                  <p>Run AI Analysis on an image evidence item to perform ELA forgery detection.</p>
                </div>
              ) : (
                <div className="ela-result-grid">

                  {/* Tamper Status Banner */}
                  <div className={`ela-status-banner ${elaIsTampered ? "ela-tampered" : "ela-clean"}`}>
                    <div className="ela-status-icon">
                      {elaIsTampered
                        ? <AlertTriangle size={40} className="text-danger" />
                        : <CheckCircle2 size={40} className="text-success" />}
                    </div>
                    <div className="ela-status-body">
                      <h2 className={elaIsTampered ? "text-danger" : "text-success"}>
                        {elaIsTampered ? "IMAGE TAMPERING DETECTED" : "IMAGE APPEARS AUTHENTIC"}
                      </h2>
                      <p className="muted">
                        {elaIsTampered
                          ? "ELA pixel residual analysis detected anomalous compression artifacts indicative of digital manipulation."
                          : "ELA analysis found no significant compression anomalies. Image appears to be in its original state."}
                      </p>
                    </div>
                    <div className="ela-score-circle">
                      <svg viewBox="0 0 80 80" className="ela-score-svg">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <circle
                          cx="40" cy="40" r="34"
                          fill="none"
                          stroke={elaIsTampered ? "#ef4444" : "#22c55e"}
                          strokeWidth="8"
                          strokeDasharray={`${(elaTamperScore / 100) * 213.6} 213.6`}
                          strokeLinecap="round"
                          transform="rotate(-90 40 40)"
                        />
                      </svg>
                      <div className="ela-score-inner">
                        <span className="ela-score-num">{Math.round(elaTamperScore)}</span>
                        <span className="ela-score-label">/ 100</span>
                      </div>
                    </div>
                  </div>

                  {/* ELA Details */}
                  {Object.keys(elaDetails).length > 0 && (
                    <div className="ml-result-card" style={{ gridColumn: "1 / -1" }}>
                      <div className="section-title-row" style={{ marginBottom: 12 }}>
                        <BarChart2 size={16} className="text-accent" />
                        <h4>Pixel Residual Analysis Metrics</h4>
                      </div>
                      <div className="ela-metrics-grid">
                        {Object.entries(elaDetails).map(([key, val]) => (
                          <div key={key} className="ela-metric-box">
                            <span className="ela-metric-label">{key.replace(/_/g, " ").toUpperCase()}</span>
                            <span className="ela-metric-value">{typeof val === "number" ? val.toFixed(4) : String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="ml-result-card" style={{ gridColumn: "1 / -1" }}>
                    <div className="section-title-row" style={{ marginBottom: 8 }}>
                      <Eye size={16} className="text-accent" />
                      <h4>Analysis Method</h4>
                    </div>
                    <p className="muted">{elaMethod || "Error Level Analysis using Pillow re-compression differential"}</p>
                    <p className="muted" style={{ marginTop: 8, fontSize: "0.8rem" }}>
                      ELA works by re-saving the image at a known quality level and computing the per-pixel difference.
                      Manipulated regions typically show higher residual error than surrounding areas due to inconsistent JPEG compression history.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RECOMMENDATIONS */}
          {tab === "Forensic Recommendations" && (
            <div className="results-tab-content">
              <div className="section-title-row">
                <Sliders size={18} className="text-accent" />
                <h3>Actionable Forensic Next Steps</h3>
              </div>

              {recommendations.length > 0 ? (
                <div className="recs-card-grid">
                  {recommendations.map((rec, i) => (
                    <div className="rec-box" key={i}>
                      <div className="rec-number">{i + 1}</div>
                      <p className="rec-text">{rec}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-subtle">
                  <CheckCircle2 size={32} className="text-success" />
                  <p>Standard chain-of-custody protocols apply.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: METADATA SCREENING */}
          {tab === "Metadata Screening" && (
            <div className="results-tab-content">
              <div className="section-title-row">
                <FileSearch size={18} className="text-accent" />
                <h3>File Headers & Forensic Metadata Screening</h3>
              </div>

              {Object.keys(metadata).length > 0 ? (
                <pre className="metadata-pre-block">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              ) : (
                <div className="empty-state-subtle">
                  <p>No extended EXIF or container metadata found for this file type.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card empty-state">
          <BrainCircuit size={48} className="text-secondary" />
          <h3>No Analysis Generated Yet</h3>
          <p>
            Click "Execute AI Analysis" above to perform deep semantic triage, ML threat classification, and ELA image forensics.
          </p>
        </div>
      )}
    </section>
  );
}