import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import { fetchCases } from "../services/api.js";

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchCases();
        if (mounted) setCases(data || []);
      } catch (err) {
        if (mounted) setError("Could not load cases.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading label="Loading cases..." />;

  const filtered = cases.filter((c) =>
    (c.title || c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Cases</h2>
        <button className="btn btn-primary" onClick={() => navigate("/cases/create")}>
          + New Case
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "16px" }}>{error}</div>}

      <div className="form-group" style={{ maxWidth: "320px" }}>
        <input
          type="text"
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No cases found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Case Name</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c._id || c.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/cases/${c._id || c.id}`)}
                >
                  <td>{c.title || c.name}</td>
                  <td>
                    <span
                      className={
                        "badge " +
                        (String(c.status).toLowerCase() === "open" ? "badge-warning" : "badge-success")
                      }
                    >
                      {c.status || "Unknown"}
                    </span>
                  </td>
                  <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
