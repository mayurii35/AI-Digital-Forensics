import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, Search, ArrowRight, Shield, Trash2, AlertTriangle, X } from "lucide-react";
import Loading from "../components/Loading.jsx";
import { fetchCases, deleteCase } from "../services/api.js";

const tone = (s) =>
  String(s).toLowerCase() === "closed"
    ? "badge-success"
    : String(s).toLowerCase() === "open"
    ? "badge-warning"
    : "badge-neutral";

function ConfirmDeleteModal({ caseTitle, onConfirm, onCancel, busy }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon modal-icon-danger">
          <AlertTriangle size={28} />
        </div>
        <h3 className="modal-title">Delete Investigation?</h3>
        <p className="modal-body">
          You are about to permanently delete <strong>"{caseTitle}"</strong> and{" "}
          <strong>all associated evidence, analyses, Text Tracker results, and AI sessions</strong>.
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="ui-button ui-button-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="ui-button ui-button-danger" onClick={onConfirm} disabled={busy}>
            <Trash2 size={14} />
            {busy ? "Deleting…" : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCases(await fetchCases());
      setError("");
    } catch {
      setError("Could not load registered investigation cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCase(deleteTarget.case_id);
      setCases((prev) => prev.filter((c) => c.case_id !== deleteTarget.case_id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete case. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading label="Loading investigation cases…" />;

  const filtered = cases.filter((c) =>
    `${c.title || ""} ${c.crime_category || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="page-shell animate-fade-in-up">
      {deleteTarget && (
        <ConfirmDeleteModal
          caseTitle={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          busy={deleting}
        />
      )}

      <div className="page-heading">
        <div>
          <p className="eyebrow">CASE MANAGEMENT & DOSSIERS</p>
          <h1>Active Investigations</h1>
          <p>Organize, review, and correlate digital forensic matters.</p>
        </div>
        <button
          id="cases-new-btn"
          className="ui-button ui-button-primary"
          onClick={() => navigate("/cases/create")}
        >
          <Plus size={16} /> New Investigation
        </button>
      </div>

      {error && (
        <div className="error-card">
          <span>{error}</span>
          <button className="btn btn-ghost" onClick={load}>Retry</button>
        </div>
      )}

      <div className="toolbar">
        <div className="search-input">
          <Search size={16} />
          <input
            id="cases-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case title, crime category…"
          />
        </div>
        <span className="muted">{filtered.length} matter{filtered.length === 1 ? "" : "s"} listed</span>
      </div>

      <div className="card table-card">
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Investigation Title</th>
                  <th>Classification</th>
                  <th>Status</th>
                  <th>Date Opened</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.case_id}
                    className="click-row"
                    onClick={() => navigate(`/cases/${c.case_id}`)}
                  >
                    <td>
                      <strong>{c.title}</strong>
                      <div className="text-secondary case-id-sub">
                        ID: {c.case_id ? c.case_id.slice(0, 10) + "…" : "N/A"}
                      </div>
                    </td>
                    <td>
                      <span className="type-chip">{c.crime_category || "General"}</span>
                    </td>
                    <td>
                      <span className={`badge ${tone(c.status)}`}>{c.status || "Open"}</span>
                    </td>
                    <td>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          className="ui-button ui-button-ghost ui-button-sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.case_id}`); }}
                        >
                          Open Dossier <ArrowRight size={13} />
                        </button>
                        <button
                          className="ui-button ui-button-danger ui-button-sm"
                          title="Delete this case"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                        >
                          <Trash2 size={13} />
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
            <FolderOpen size={40} className="text-secondary" />
            <h3>No matching matters found</h3>
            <p>Adjust your search criteria or register a new investigation case.</p>
          </div>
        )}
      </div>
    </section>
  );
}
