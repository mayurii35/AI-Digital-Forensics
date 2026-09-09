import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ShieldAlert, CheckCircle2 } from "lucide-react";
import { createCase } from "../services/api.js";

export default function CreateCase() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    crime_category: "Cybercrime",
    status: "open",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("A case title is required.");
    if (!form.description.trim()) return setError("A case incident description is required.");
    setBusy(true);
    try {
      const r = await createCase({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      if (!r.case_id) throw new Error("The server did not return a case ID.");
      navigate("/cases", {
        replace: true,
        state: { notice: `Investigation "${form.title.trim()}" registered successfully.` },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Could not create investigation matter."
      );
    } finally {
      setBusy(false);
    }
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <section className="page-shell animate-fade-in-up">
      <button
        id="create-case-back-btn"
        className="ui-back-button"
        onClick={() => navigate("/cases")}
      >
        <ArrowLeft size={15} /> Back to Cases
      </button>

      <div className="page-heading">
        <div>
          <p className="eyebrow">NEW INCIDENT MATTERS</p>
          <h1>Register New Investigation</h1>
          <p>Establish a defensible digital evidence record and audit perimeter.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={submit} style={{ maxWidth: 640 }}>
        {error && (
          <div className="ui-alert ui-alert-error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="ui-form-group">
          <label htmlFor="case-title-input">Matter Title *</label>
          <input
            id="case-title-input"
            name="title"
            className="ui-input"
            value={form.title}
            onChange={change}
            placeholder="e.g. Account Takeover / Exfiltration Incident"
            required
          />
        </div>

        <div className="ui-form-group">
          <label htmlFor="case-desc-input">Incident Synopsis & Scope *</label>
          <textarea
            id="case-desc-input"
            name="description"
            className="ui-input"
            rows="5"
            value={form.description}
            onChange={change}
            placeholder="Summarize the incident, seized device vectors, suspected actors, and investigative scope…"
            required
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ui-form-group">
            <label htmlFor="crime-cat-select">Classification Category</label>
            <select
              id="crime-cat-select"
              name="crime_category"
              className="ui-input"
              value={form.crime_category}
              onChange={change}
            >
              {[
                "Cybercrime",
                "Financial Fraud",
                "IP Theft",
                "Insider Threat",
                "Data Breach",
                "Deepfake Extortion",
                "Other",
              ].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="ui-form-group">
            <label htmlFor="status-select">Initial Status</label>
            <select
              id="status-select"
              name="status"
              className="ui-input"
              value={form.status}
              onChange={change}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            type="submit"
            id="create-case-submit-btn"
            className="ui-button ui-button-primary"
            disabled={busy}
          >
            <Plus size={16} />
            {busy ? "Registering Matter…" : "Initialize Investigation"}
          </button>
        </div>
      </form>
    </section>
  );
}
