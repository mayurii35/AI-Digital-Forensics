import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  FolderOpen,
  FileCheck2,
  Plus,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  FileText,
  Activity,
  Layers
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import Loading from "../components/Loading.jsx";
import { fetchCases, fetchAuditLogs } from "../services/api.js";

const statusTone = (status) =>
  String(status).toLowerCase() === "closed"
    ? "badge-success"
    : String(status).toLowerCase() === "open"
    ? "badge-warning"
    : "badge-neutral";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ cases: [], audits: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [cases, audits] = await Promise.all([
        fetchCases(),
        fetchAuditLogs(),
      ]);
      setData({ cases, audits });
    } catch {
      setError("Could not load dashboard telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading label="Initializing Digital Forensics Command Center…" />;

  const { cases = [], audits = [] } = data;
  const recent = [...cases]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 6);

  const openCases = cases.filter(
    (c) => String(c.status).toLowerCase() === "open"
  ).length;

  const closedCases = cases.filter(
    (c) => String(c.status).toLowerCase() === "closed"
  ).length;

  const recentAudits = audits.slice(0, 5);

  return (
    <section className="page-shell">
      {/* HEADER */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMMAND CENTER & TELEMETRY</p>
          <h1>Forensic Operations Dashboard</h1>
          <p>
            Real-time digital forensics posture, active matters, evidence integrity, and audit surveillance.
          </p>
        </div>

        <div className="dashboard-action-buttons">
          <button
            className="ui-button ui-button-primary"
            onClick={() => navigate("/cases/create")}
          >
            <Plus size={16} /> New Investigation
          </button>
        </div>
      </div>

      {error && (
        <div className="error-card">
          <span>{error}</span>
          <button className="ui-button ui-button-ghost ui-button-sm" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="stats-grid">
        <StatCard
          label="Total Active Matters"
          value={cases.length}
          icon={<BriefcaseBusiness size={24} />}
          tone="neutral"
        />
        <StatCard
          label="Open Investigations"
          value={openCases}
          icon={<FolderOpen size={24} />}
          tone="warning"
        />
        <StatCard
          label="Adjudicated / Closed"
          value={closedCases}
          icon={<FileCheck2 size={24} />}
          tone="success"
        />
        <StatCard
          label="Chain-of-Custody Logs"
          value={audits.length}
          icon={<ShieldCheck size={24} />}
          tone="neutral"
        />
      </div>

      {/* TWO COLUMN GRID: RECENT MATTERS & AUDIT PULSE */}
      <div className="dashboard-grid-row">
        {/* LEFT: Recent Cases Table */}
        <div className="card table-card dashboard-left-card">
          <div className="card-heading">
            <div>
              <h2>Active Investigations</h2>
              <p>Recently cataloged matters under examination.</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("/cases")}
            >
              View all matters <ArrowRight size={14} />
            </button>
          </div>

          {recent.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Case Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr
                      key={c.case_id}
                      className="click-row"
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                    >
                      <td>
                        <strong>{c.title}</strong>
                        <div className="text-secondary case-id-sub">
                          {c.case_id.slice(0, 8)}…
                        </div>
                      </td>
                      <td>
                        <span className="type-chip">
                          {c.crime_category || "General"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusTone(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button
                            className="btn-icon-subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/cases/${c.case_id}/evidence`);
                            }}
                            title="Evidence Vault"
                          >
                            <Layers size={14} />
                          </button>
                          <button
                            className="btn-icon-subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/cases/${c.case_id}/text-tracker`);
                            }}
                            title="Text Tracker Workspace"
                          >
                            <Search size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FolderOpen size={36} className="text-secondary" />
              <p>No investigations registered yet. Click "New Investigation" to begin.</p>
            </div>
          )}
        </div>

        {/* RIGHT: Recent Chain of Custody Pulse */}
        <div className="card dashboard-right-card">
          <div className="card-heading">
            <div>
              <h2>Audit Pulse</h2>
              <p>Real-time chain-of-custody transactions.</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("/audit-logs")}
            >
              Audit Vault <ArrowRight size={14} />
            </button>
          </div>

          {recentAudits.length ? (
            <div className="audit-feed-list">
              {recentAudits.map((log, idx) => (
                <div key={log.audit_id || log.id || idx} className="audit-feed-item">
                  <div className="audit-feed-icon">
                    <ShieldCheck size={14} className="text-accent" />
                  </div>
                  <div className="audit-feed-content">
                    <strong>{log.action || "Log Recorded"}</strong>
                    <p>{log.description || "Custody event registered."}</p>
                    <span className="audit-feed-time">
                      {log.timestamp || log.created_at
                        ? new Date(log.timestamp || log.created_at).toLocaleString()
                        : "Recent"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Activity size={36} className="text-secondary" />
              <p>No audit activity recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
