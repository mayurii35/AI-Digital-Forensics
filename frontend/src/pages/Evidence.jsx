import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileUp, UploadCloud, ShieldCheck } from "lucide-react";
import Loading from "../components/Loading.jsx";

import {
  fetchEvidenceForCase,
  uploadEvidence,
  verifyEvidenceHash,
} from "../services/api.js";

export default function Evidence() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("document");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [verifying, setVerifying] = useState(null);
  const [verifyResults, setVerifyResults] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchEvidenceForCase(caseId);
      setItems(data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not load evidence."
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
      setError("Choose an evidence file before uploading.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await uploadEvidence(caseId, file, type);

      setFile(null);

      // Reset file input visually
      e.target.reset();

      await load();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Upload failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async (evidenceId) => {
    setVerifying(evidenceId);
    setError("");

    try {
      const result = await verifyEvidenceHash(evidenceId);

      setVerifyResults((prev) => ({
        ...prev,
        [evidenceId]: result,
      }));
    } catch (err) {
      setVerifyResults((prev) => ({
        ...prev,
        [evidenceId]: {
          integrity_status: "Error",
          error:
            err.response?.data?.detail ||
            "Verification failed.",
        },
      }));
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return <Loading label="Loading evidence…" />;
  }

  return (
    <section className="page-shell">

      {/* PAGE HEADER */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">EVIDENCE VAULT</p>

          <h1>Case Evidence</h1>

          <p>
            Preserve file provenance and dispatch items for AI review.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-card">
          <span>{error}</span>

          <button
            className="btn btn-ghost"
            onClick={load}
          >
            Retry
          </button>
        </div>
      )}

      {/* UPLOAD EVIDENCE */}
      <form
        className="upload-zone card"
        onSubmit={submit}
      >
        <UploadCloud size={30} />

        <div>
          <strong>
            {file
              ? file.name
              : "Drop evidence here or choose a file"}
          </strong>

          <p>
            Files are hashed and added to the immutable audit trail.
          </p>
        </div>

        <input
          type="file"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          disabled={busy}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={busy}
        >
          <option value="document">Document</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="archive">Archive</option>
        </select>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy}
        >
          <FileUp size={16} />

          {busy
            ? "Uploading…"
            : "Upload Evidence"}
        </button>
      </form>

      {/* EVIDENCE INVENTORY */}
      <div className="card table-card">

        <div className="card-heading">
          <div>
            <h2>Evidence Inventory</h2>

            <p>
              {items.length} secured files
            </p>
          </div>
        </div>

        {items.length ? (

          <div className="table-wrap">

            <table>

              <thead>
                <tr>
                  <th>Evidence name</th>
                  <th>Type</th>
                  <th>SHA-256 hash</th>
                  <th>Created</th>
                  <th>Integrity</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {items.map((ev) => {

                  const result =
                    verifyResults[ev.evidence_id];

                  return (
                    <tr key={ev.evidence_id}>

                      {/* NAME */}
                      <td>
                        <strong>
                          {ev.evidence_name}
                        </strong>
                      </td>

                      {/* TYPE */}
                      <td>
                        {ev.evidence_type}
                      </td>

                      {/* HASH */}
                      <td className="hash">
                        {ev.file_hash
                          ? `${ev.file_hash.slice(0, 12)}…`
                          : "—"}
                      </td>

                      {/* DATE */}
                      <td>
                        {ev.created_at
                          ? new Date(
                              ev.created_at
                            ).toLocaleString()
                          : "—"}
                      </td>

                      {/* INTEGRITY */}
                      <td>

                        {result ? (

                          <span
                            className={`badge ${
                              result.integrity_status ===
                              "Verified"
                                ? "badge-success"
                                : result.integrity_status ===
                                  "Integrity compromised"
                                ? "badge-danger"
                                : "badge-neutral"
                            }`}
                          >
                            {result.integrity_status}
                          </span>

                        ) : (

                          <span className="muted">
                            Not checked
                          </span>

                        )}

                      </td>

                      {/* ACTIONS */}
                      <td
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >

                        {/* VERIFY */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-small"
                          onClick={() =>
                            verify(ev.evidence_id)
                          }
                          disabled={
                            verifying ===
                            ev.evidence_id
                          }
                        >
                          <ShieldCheck size={14} />

                          {verifying ===
                          ev.evidence_id
                            ? "Verifying…"
                            : "Verify"}
                        </button>

                        {/* ANALYZE */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-small"
                          onClick={() =>
                            navigate(
                              `/cases/${caseId}/analysis?evidenceId=${ev.evidence_id}`
                            )
                          }
                        >
                          Analyze
                        </button>

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

            <p>
              No evidence uploaded for this case.
            </p>

          </div>

        )}

      </div>

    </section>
  );
}