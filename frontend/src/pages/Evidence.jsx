import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import { fetchEvidenceForCase, uploadEvidence } from "../services/api.js";

export default function Evidence() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const loadEvidence = async () => {
    try {
      const data = await fetchEvidenceForCase(caseId);
      setEvidenceList(data || []);
    } catch (err) {
      setError("Could not load evidence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      await uploadEvidence(caseId, file);
      setFile(null);
      await loadEvidence();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loading label="Loading evidence..." />;

  return (
    <div>
      <h2>Evidence</h2>

      <div className="card" style={{ marginBottom: "24px", maxWidth: "480px" }}>
        <h3 style={{ marginTop: 0 }}>Upload New Evidence</h3>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Uploaded Evidence</h3>
        {evidenceList.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No evidence uploaded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>SHA-256</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {evidenceList.map((ev) => (
                <tr key={ev._id || ev.id}>
                  <td>{ev.filename || ev.file_name}</td>
                  <td>{ev.file_type || "-"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {(ev.sha256 || "").slice(0, 16)}...
                  </td>
                  <td>{ev.uploaded_at ? new Date(ev.uploaded_at).toLocaleString() : "-"}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/cases/${caseId}/analysis?evidenceId=${ev._id || ev.id}`)}
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
