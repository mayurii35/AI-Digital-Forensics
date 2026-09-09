import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  Lock,
  Calendar,
  UserCheck
} from "lucide-react";
import Loading from "../components/Loading.jsx";
import { fetchAuditLogs } from "../services/api.js";

const getActionBadgeClass = (action = "") => {
  const a = String(action).toUpperCase();
  if (a.includes("TEXT_TRACKER")) return "badge-cyan";
  if (a.includes("AI")) return "badge-purple";
  if (a.includes("HASH") || a.includes("VERIFY")) return "badge-success";
  if (a.includes("UPLOAD") || a.includes("INGEST")) return "badge-blue";
  if (a.includes("CREATE") || a.includes("CASE")) return "badge-warning";
  return "badge-neutral";
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Could not load immutable audit trail records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return logs
      .filter((x) => {
        const textToSearch = `${x.action || ""} ${x.description || ""} ${x.case_id || ""} ${x.evidence_id || ""} ${x.user_id || x.performed_by || ""}`.toLowerCase();
        const matchesQuery = !q || textToSearch.includes(q.toLowerCase());
        const matchesAction =
          actionFilter === "ALL" ||
          String(x.action || "").toUpperCase().includes(actionFilter);
        return matchesQuery && matchesAction;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
        const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
  }, [logs, q, actionFilter]);

  if (loading) return <Loading label="Retrieving cryptographic audit trail…" />;

  return (
    <section className="page-shell">
      {/* HEADER */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHAIN OF CUSTODY SURVEILLANCE</p>
          <h1>Immutable Audit Logs</h1>
          <p>
            Cryptographic ledger tracking all evidence ingestion, hash validations, Text Tracker runs, and investigator actions.
          </p>
        </div>
      </div>

      {/* INTEGRITY BANNER */}
      <div className="integrity-banner card">
        <Lock size={22} className="text-accent" />
        <div>
          <strong>Immutable Evidence Chain-of-Custody</strong>
          <p className="text-secondary">
            Every recorded action is non-repudiable, timestamped in UTC, and permanently bound to investigator credentials.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-card">
          <span>{error}</span>
          <button className="btn btn-ghost" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="card audit-toolbar">
        <div className="search-input-wrap">
          <Search size={16} className="text-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by action, description, case ID, or investigator…"
            className="audit-search-input"
          />
        </div>

        <div className="audit-filter-pills">
          <button
            className={`filter-pill ${actionFilter === "ALL" ? "active" : ""}`}
            onClick={() => setActionFilter("ALL")}
          >
            All Logs ({logs.length})
          </button>
          <button
            className={`filter-pill ${actionFilter === "TEXT_TRACKER" ? "active" : ""}`}
            onClick={() => setActionFilter("TEXT_TRACKER")}
          >
            Text Tracker
          </button>
          <button
            className={`filter-pill ${actionFilter === "AI" ? "active" : ""}`}
            onClick={() => setActionFilter("AI")}
          >
            AI Analysis
          </button>
          <button
            className={`filter-pill ${actionFilter === "HASH" ? "active" : ""}`}
            onClick={() => setActionFilter("HASH")}
          >
            Hash Verifications
          </button>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="card table-card">
        <div className="table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Action Type</th>
                <th>Investigator / System</th>
                <th>Forensic Description</th>
                <th>Case Reference</th>
                <th>Evidence Reference</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((l, i) => {
                  const ts = l.created_at || l.timestamp;
                  return (
                    <tr key={l.audit_id || l.id || i}>
                      <td>
                        <div className="timestamp-cell">
                          <Calendar size={13} className="text-secondary" />
                          <span>{ts ? new Date(ts).toLocaleString() : "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadgeClass(l.action)}`}>
                          {l.action || "EVENT"}
                        </span>
                      </td>
                      <td>
                        <div className="actor-cell">
                          <UserCheck size={13} className="text-secondary" />
                          <span>{l.performed_by || l.user_id || "Lead Investigator"}</span>
                        </div>
                      </td>
                      <td className="desc-cell">{l.description || "—"}</td>
                      <td className="hash-ref">
                        {l.case_id ? `${l.case_id.slice(0, 8)}…` : "—"}
                      </td>
                      <td className="hash-ref">
                        {l.evidence_id ? `${l.evidence_id.slice(0, 8)}…` : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-secondary">
                    No audit records match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
