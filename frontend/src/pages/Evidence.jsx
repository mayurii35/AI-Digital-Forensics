import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileUp, UploadCloud, ShieldCheck, BrainCircuit, Search, CheckCircle, XCircle, Copy, Check, FileText, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";

import Loading from "../components/Loading.jsx";

import {
  fetchEvidenceForCase,
  uploadEvidence,
  verifyEvidenceHash,
  deleteEvidence,
} from "../services/api.js";


export default function Evidence() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("document");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [verifying, setVerifying] = useState(null);
  const [verifyResults, setVerifyResults] = useState({});
  const [activeModalEvidence, setActiveModalEvidence] = useState(null);
  const [copiedHash, setCopiedHash] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);


  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchEvidenceForCase(caseId);
      setItems(data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not load evidence inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [caseId]);

  const submit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select an evidence file before uploading.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await uploadEvidence(caseId, file, type, description);
      setFile(null);
      setDescription("");
      e.target.reset();
      await load();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Evidence upload failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async (evidence) => {
    const evId = evidence.evidence_id;
    setVerifying(evId);
    setError("");

    try {
      const result = await verifyEvidenceHash(evId);
      setVerifyResults((prev) => ({
        ...prev,
        [evId]: result,
      }));
      setActiveModalEvidence({ ...evidence, ...result });
    } catch (err) {
      const failResult = {
        integrity_status: "Tampered",
        error: err.response?.data?.detail || "Verification failed.",
      };
      setVerifyResults((prev) => ({
        ...prev,
        [evId]: failResult,
      }));
      setActiveModalEvidence({ ...evidence, ...failResult });
    } finally {
      setVerifying(null);
    }
  };

  const copyText = (val) => {
    navigator.clipboard.writeText(val);
    setCopiedHash(val);
    setTimeout(() => setCopiedHash(""), 2000);
  };

  const handleDeleteEvidence = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvidence(deleteTarget.evidence_id);
      setItems((prev) => prev.filter((e) => e.evidence_id !== deleteTarget.evidence_id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete evidence.");
    } finally {
      setDeleting(false);
    }
  };


  if (loading) {
    return <Loading label="Loading evidence vault…" />;
  }

  return (
    <section className="page-shell">

      {/* DELETE EVIDENCE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon modal-icon-danger"><AlertTriangle size={28} /></div>
            <h3 className="modal-title">Delete Evidence?</h3>
            <p className="modal-body">
              Permanently delete <strong>"{deleteTarget.evidence_name || deleteTarget.file_name}"</strong>?
              This will also remove its analysis results and Text Tracker data.
            </p>
            <div className="modal-actions">
              <button className="ui-button ui-button-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="ui-button ui-button-danger" onClick={handleDeleteEvidence} disabled={deleting}>
                <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-heading">
        <div>
          <button
            className="ui-back-button"
            onClick={() => navigate(`/cases/${caseId}`)}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={15} /> Back to Case Overview
          </button>
          <p className="eyebrow">EVIDENCE VAULT</p>
          <h1>Secured Evidence Inventory</h1>
          <p>
            Cryptographically preserve forensic provenance and dispatch items for Text Tracking and AI analysis.
          </p>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="error-card">
          <span>{error}</span>
          <button className="btn btn-ghost" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* UPLOAD EVIDENCE CARD */}
      <form className="upload-zone card" onSubmit={submit}>
        <div className="upload-header">
          <UploadCloud size={28} className="text-accent" />
          <div>
            <strong>
              {file ? file.name : "Add New Forensic Artifact"}
            </strong>
            <p className="upload-subtext">
              Uploaded files are SHA-256 hashed immediately and committed to the immutable audit log.
            </p>
          </div>
        </div>

        <div className="upload-inputs-row">
          <input
            type="file"
            className="file-picker-input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={busy}
          />

          <select
            className="evidence-type-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={busy}
          >
            <option value="document">Document (TXT/PDF/DOCX)</option>
            <option value="log">Server / Event Log</option>
            <option value="image">Image (PNG/JPG/EXIF)</option>
            <option value="video">Video / Multimedia</option>
            <option value="audio">Audio Recording</option>
            <option value="archive">Archive / ZIP</option>
          </select>
        </div>

        <input
          type="text"
          className="evidence-desc-input"
          placeholder="Evidence description or seizure context (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
        />

        <div className="upload-action-row">
          <button
            type="submit"
            id="evidence-upload-btn"
            className="ui-button ui-button-primary"
            disabled={busy || !file}
          >
            <FileUp size={16} />
            {busy ? "Hashing & Ingesting…" : "Upload & Secure Evidence"}
          </button>
        </div>
      </form>

      {/* EVIDENCE INVENTORY TABLE */}
      <div className="card table-card">
        <div className="card-heading">
          <div>
            <h2>Secured Items</h2>
            <p>{items.length} forensic artifacts cataloged in this case</p>
          </div>
        </div>

        {items.length ? (
          <div className="table-wrap">
            <table className="evidence-table">
              <thead>
                <tr>
                  <th>Evidence Name</th>
                  <th>Category</th>
                  <th>SHA-256 Checksum</th>
                  <th>Timestamp</th>
                  <th>Integrity State</th>
                  <th>Forensic Tools</th>
                </tr>
              </thead>

              <tbody>
                {items.map((ev) => {
                  const result = verifyResults[ev.evidence_id];
                  const isVerified =
                    result?.integrity_status === "Verified" ||
                    result?.hash_match === true;

                  return (
                    <tr key={ev.evidence_id}>
                      {/* NAME */}
                      <td>
                        <strong>{ev.evidence_name || ev.file_name}</strong>
                        {ev.description && (
                          <div className="evidence-desc-sub">{ev.description}</div>
                        )}
                      </td>

                      {/* TYPE */}
                      <td>
                        <span className="type-chip">{ev.evidence_type || "file"}</span>
                      </td>

                      {/* HASH */}
                      <td className="hash">
                        <span className="hash-text">
                          {ev.file_hash ? `${ev.file_hash.slice(0, 12)}...` : "—"}
                        </span>
                        {ev.file_hash && (
                          <button
                            className="btn-icon-subtle"
                            onClick={() => copyText(ev.file_hash)}
                            title="Copy full SHA-256 hash"
                          >
                            {copiedHash === ev.file_hash ? (
                              <Check size={12} className="text-success" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </td>

                      {/* DATE */}
                      <td>
                        {ev.created_at
                          ? new Date(ev.created_at).toLocaleString()
                          : "—"}
                      </td>

                      {/* INTEGRITY */}
                      <td>
                        {result ? (
                          <span
                            className={`badge ${
                              isVerified ? "badge-success" : "badge-danger"
                            }`}
                          >
                            {isVerified ? "Verified (Match)" : "Tampered"}
                          </span>
                        ) : (
                          <span className="muted">Unchecked</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="evidence-actions-row">
                          {/* TEXT TRACKER */}
                          <button
                            type="button"
                            className="ui-button ui-button-primary ui-button-sm"
                            onClick={() =>
                              navigate(
                                `/cases/${caseId}/text-tracker?evidenceId=${ev.evidence_id}`
                              )
                            }
                            title="Launch Text Tracker & Indicator Inspector"
                          >
                            <Search size={13} /> Text Tracker
                          </button>

                          {/* AI ANALYSIS */}
                          <button
                            type="button"
                            className="ui-button ui-button-ghost ui-button-sm"
                            onClick={() =>
                              navigate(
                                `/cases/${caseId}/analysis?evidenceId=${ev.evidence_id}`
                              )
                            }
                          >
                            <BrainCircuit size={13} /> AI Analysis
                          </button>

                          {/* VERIFY HASH */}
                          <button
                            type="button"
                            className="ui-button ui-button-ghost ui-button-sm"
                            onClick={() => verify(ev)}
                            disabled={verifying === ev.evidence_id}
                          >
                            <ShieldCheck size={13} />
                            {verifying === ev.evidence_id ? "Checking…" : "Verify"}
                          </button>

                          {/* DELETE EVIDENCE */}
                          <button
                            type="button"
                            className="ui-button ui-button-danger ui-button-sm"
                            title="Permanently delete this evidence"
                            onClick={() => setDeleteTarget(ev)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileUp size={34} />
            <p>No evidence uploaded for this case yet.</p>
          </div>
        )}
      </div>

      {/* HASH VERIFICATION MODAL / DIALOG */}
      {activeModalEvidence && (
        <div className="modal-backdrop" onClick={() => setActiveModalEvidence(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <ShieldCheck
                  size={22}
                  className={
                    activeModalEvidence.hash_match !== false
                      ? "text-success"
                      : "text-danger"
                  }
                />
                <h3>Cryptographic Hash Integrity Result</h3>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setActiveModalEvidence(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-status-banner">
                {activeModalEvidence.hash_match !== false ? (
                  <div className="status-box status-success">
                    <CheckCircle size={20} />
                    <div>
                      <strong>SHA-256 Integrity Verified</strong>
                      <p>The stored hash exactly matches the physical file checksum on disk.</p>
                    </div>
                  </div>
                ) : (
                  <div className="status-box status-danger">
                    <XCircle size={20} />
                    <div>
                      <strong>Integrity Compromised / Hash Mismatch</strong>
                      <p>The file may have been modified or tampered with since initial cataloging.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="hash-compare-block">
                <div className="hash-item">
                  <span className="hash-label">Stored Baseline Hash (SHA-256):</span>
                  <code className="hash-code">
                    {activeModalEvidence.stored_hash || activeModalEvidence.file_hash}
                  </code>
                </div>

                <div className="hash-item">
                  <span className="hash-label">Current Calculated Hash:</span>
                  <code className="hash-code">
                    {activeModalEvidence.current_hash || "Calculation Error"}
                  </code>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setActiveModalEvidence(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}