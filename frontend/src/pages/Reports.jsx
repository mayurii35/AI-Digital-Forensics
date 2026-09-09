import React, { useEffect, useState } from "react";
import {
  Download,
  FileText,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import Loading from "../components/Loading.jsx";
import {
  fetchCases,
  fetchReportPdf,
  generateReport,
} from "../services/api.js";

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCases();
      setCases(data);
      setError("");
    } catch {
      setError("Could not load registered cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async (c) => {
    setBusy(c.case_id);
    setError("");
    try {
      setSelected(c);
      const res = await generateReport(c.case_id);
      setReportData(res);
    } catch (e) {
      setError(
        e.response?.data?.detail || "Could not generate forensic report."
      );
    } finally {
      setBusy("");
    }
  };

  const downloadPdf = async (targetCase = null) => {
    const c = targetCase || selected;
    if (!c) return;
    const cid = c.case_id;
    setBusy(`pdf-${cid}`);
    setError("");
    try {
      const blob = await fetchReportPdf(cid);
      if (blob.type === "application/json") {
        const text = await blob.text();
        const errObj = JSON.parse(text);
        throw new Error(errObj.detail || "PDF generation failed on server");
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Forensic_Report_${cid}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      let errMsg = e.message;
      if (e.response?.data instanceof Blob) {
        try {
          const txt = await e.response.data.text();
          const parsed = JSON.parse(txt);
          errMsg = parsed.detail || errMsg;
        } catch (_) {}
      }
      setError(errMsg || "Could not download the report PDF.");
    } finally {
      setBusy("");
    }
  };


  const copyReportText = () => {
    if (!reportData?.report_text) return;
    navigator.clipboard.writeText(reportData.report_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loading label="Loading forensic report generator…" />;

  return (
    <section className="page-shell">
      {/* HEADER */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">OFFICIAL DELIVERABLES</p>
          <h1>Forensic Investigation Reports</h1>
          <p>
            Synthesize evidence inventories, cryptographic hashes, Text Tracker indicators, and chain-of-custody into court-grade PDF deliverables.
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

      {/* CASES SELECTION TABLE */}
      <div className="card table-card">
        <div className="card-heading" style={{ padding: "20px 24px 14px", borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <h2 style={{ color: "#0f172a", margin: "0 0 4px", fontSize: "1.15rem", fontWeight: 700 }}>Select Case Dossier</h2>
            <p style={{ color: "#475569", margin: 0, fontSize: "0.85rem" }}>Generate forensic findings preview or download court-grade PDF for any case.</p>
          </div>
        </div>

        {cases.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.case_id}>
                    <td>
                      <strong style={{ color: "#0f172a" }}>{c.title}</strong>
                      <div className="case-id-sub">{c.case_id.slice(0, 10)}…</div>
                    </td>
                    <td>
                      <span className="type-chip">
                        {c.crime_category || "General"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          String(c.status).toLowerCase() === "closed"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          className="ui-button ui-button-ghost ui-button-sm"
                          onClick={() => generate(c)}
                          disabled={!!busy}
                        >
                          <FileText size={14} />
                          {busy === c.case_id ? "Generating…" : "View Report"}
                        </button>
                        <button
                          className="ui-button ui-button-primary ui-button-sm"
                          onClick={() => downloadPdf(c)}
                          disabled={busy === `pdf-${c.case_id}`}
                        >
                          <Download size={14} />
                          {busy === `pdf-${c.case_id}` ? "Downloading…" : "Download PDF"}
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
            <h3>No cases available</h3>
            <p>Create an active investigation case before generating reports.</p>
          </div>
        )}
      </div>

      {/* GENERATED REPORT VIEWER */}
      {reportData && (
        <div className="report-preview-card">
          <div className="report-preview-header">
            <div>
              <div className="report-tag">COURT-GRADE FORENSIC REPORT</div>
              <h2>{selected?.title}</h2>
              <p className="text-secondary">
                Case ID: {selected?.case_id} · Generated by AI Forensics Engine
              </p>
            </div>

            <div className="report-actions-row">
              <button
                className="ui-button ui-button-ghost"
                onClick={copyReportText}
              >
                {copied ? <Check size={15} className="text-emerald" /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy Text"}
              </button>

              <button
                className="ui-button ui-button-primary"
                onClick={downloadPdf}
                disabled={busy === "pdf"}
              >
                <Download size={15} />
                {busy === "pdf" ? "Compiling PDF…" : "Download Official PDF"}
              </button>
            </div>
          </div>

          <div className="report-body-wrap">
            <pre className="report-panel-text">
              {reportData.report_text}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
