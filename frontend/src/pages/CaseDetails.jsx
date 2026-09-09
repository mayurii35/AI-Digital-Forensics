import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  BrainCircuit,
  FileText,
  GitBranch,
  MessagesSquare,
  ShieldCheck,
  Upload,
  Search,
  ArrowLeft,
  Calendar,
  Tag,
  Clock,
  Network,
  Trash2
} from "lucide-react";

import Loading from "../components/Loading.jsx";
import StatCard from "../components/StatCard.jsx";
import { fetchCaseAnalysisDashboard } from "../services/api.js";

const risk = (r) => {
  const level = String(r).toLowerCase();
  if (level === "critical" || level === "high") return "badge-danger";
  if (level === "medium") return "badge-warning";
  return "badge-neutral";
};

export default function CaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setData(await fetchCaseAnalysisDashboard(caseId));
    } catch {
      setError("Could not load case intelligence summary.");
    }
  };

  useEffect(() => {
    load();
  }, [caseId]);

  if (error)
    return (
      <div className="error-card">
        {error}
        <button className="btn btn-ghost" onClick={load}>
          Retry
        </button>
      </div>
    );

  if (!data) return <Loading label="Synthesizing case intelligence file…" />;

  const c = data.case || {};
  const s = data.summary || {};
  const analyses = data.evidence_analysis || [];
  const logs = data.recent_audit_logs || [];

  const navLinks = [
    [Upload, "Evidence Vault", `/cases/${caseId}/evidence`],
    [Search, "Text Tracker", `/cases/${caseId}/text-tracker`],
    [BrainCircuit, "AI Analysis", `/cases/${caseId}/analysis`],
    [Network, "Network Forensics", `/cases/${caseId}/network-forensics`],
    [Activity, "Timeline", `/cases/${caseId}/timeline`],
    [GitBranch, "Evidence Graph", `/cases/${caseId}/graph`],
    [MessagesSquare, "AI Copilot", `/cases/${caseId}/copilot`],
    [FileText, "Forensic Reports", "/reports"],
  ];


  return (
    <section className="page-shell">
      {/* CASE HERO HEADER */}
      <div className="case-hero card">
        <div className="case-hero-inner">
          <button
            className="ui-back-button"
            onClick={() => navigate("/cases")}
            style={{ marginBottom: 6 }}
          >
            <ArrowLeft size={15} /> Back to Cases
          </button>
          <div className="hero-meta-strip">
            <span className="eyebrow">CASE DOSSIER · {c.case_id || caseId}</span>
          </div>

          <h1 className="case-hero-title">{c.title}</h1>
          <p className="case-hero-desc">
            {c.description || "No formal incident description documented."}
          </p>

          <div className="meta-row">
            <span className="category-chip">
              <Tag size={13} /> {c.crime_category || "General Forensic Investigation"}
            </span>
            <span
              className={`badge ${
                String(c.status).toLowerCase() === "closed"
                  ? "badge-success"
                  : "badge-warning"
              }`}
            >
              {c.status || "Open"}
            </span>
            <span className="meta-date">
              <Calendar size={13} /> Created:{" "}
              {c.created_at
                ? new Date(c.created_at).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* STATS TELEMETRY GRID */}
      <div className="stats-grid compact">
        <StatCard label="Total Evidence" value={s.total_evidence || 0} />
        <StatCard label="Analyzed" value={s.analyzed_evidence || 0} />
        <StatCard
          label="High/Crit Risk"
          value={s.high_risk || 0}
          tone="danger"
        />
        <StatCard
          label="Medium Risk"
          value={s.medium_risk || 0}
          tone="warning"
        />
        <StatCard
          label="Low Risk"
          value={s.low_risk || 0}
          tone="neutral"
        />
      </div>

      {/* CASE WORKSPACE NAVIGATION TABS */}
      <div className="case-nav-bar card">
        <span className="case-nav-label">INVESTIGATION TOOLBAR:</span>
        <div className="case-nav-items">
          {navLinks.map(([Icon, label, to]) => (
            <button
              key={label}
              className={`ui-button ${
                label === "Text Tracker"
                  ? "ui-button-primary"
                  : "ui-button-ghost"
              }`}
              onClick={() => navigate(to)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TWO COLUMN SUMMARY: EVIDENCE FINDINGS & RECENT AUDITS */}
      <div className="two-column">
        {/* Evidence Analysis Findings */}
        <div className="card">
          <div className="card-heading">
            <div>
              <h2>Artifact Threat Triage</h2>
              <p>Evaluated risk signals across submitted digital evidence.</p>
            </div>
          </div>
          {analyses.length ? (
            <div className="stack-list">
              {analyses.map((a, i) => (
                <div
                  className="analysis-row"
                  key={a.analysis_id || a.evidence_id || i}
                  onClick={() =>
                    navigate(
                      `/cases/${caseId}/text-tracker?evidenceId=${a.evidence_id}`
                    )
                  }
                  title="Inspect in Text Tracker"
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <strong>{a.evidence_name || a.evidence_id}</strong>
                    <small>
                      {a.suspicious_indicators?.length || a.indicator_count || 0}{" "}
                      suspicious indicators flagged
                    </small>
                  </div>
                  <span className={`badge ${risk(a.risk_level)}`}>
                    {a.risk_level || "Pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No evidence analysis records completed yet.</p>
          )}
        </div>

        {/* Chain of Custody Activity */}
        <div className="card">
          <div className="card-heading">
            <div>
              <h2>Chain-of-Custody Activity</h2>
              <p>Latest cryptographic & forensic transactions.</p>
            </div>
            <ShieldCheck size={20} className="text-accent" />
          </div>
          {logs.length ? (
            <div className="stack-list">
              {logs.slice(0, 6).map((l, i) => (
                <div className="audit-row" key={l.audit_id || l.id || i}>
                  <strong>{l.action}</strong>
                  <span>{l.description}</span>
                  <small>
                    <Clock size={11} />{" "}
                    {l.created_at || l.timestamp
                      ? new Date(l.created_at || l.timestamp).toLocaleString()
                      : "—"}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No chain-of-custody transactions recorded.</p>
          )}
        </div>
      </div>
    </section>
  );
}
