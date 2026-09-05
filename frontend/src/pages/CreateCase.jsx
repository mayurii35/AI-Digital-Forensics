import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCase } from "../services/api.js";

export default function CreateCase() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Case title is required.");
      return;
    }

    setLoading(true);
    try {
      const newCase = await createCase({ title: title.trim(), description, status });
      const id = newCase._id || newCase.id;
      navigate(id ? `/cases/${id}` : "/cases");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create case.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Case</h2>
      <div className="card" style={{ maxWidth: "480px" }}>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Case Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Case #101 - Fake video call fraud"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief case summary..."
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} disabled={loading}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Case"}
          </button>
        </form>
      </div>
    </div>
  );
}
