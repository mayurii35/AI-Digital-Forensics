import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import Loading from "../components/Loading.jsx";
import { fetchCases, fetchAuditLogs } from "../services/api.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cases, setCases] = useState([]);
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [casesData, auditData] = await Promise.allSettled([
          fetchCases(),
          fetchAuditLogs(),
        ]);

        if (!mounted) return;

        if (casesData.status === "fulfilled") {
          setCases(casesData.value || []);
        }
        if (auditData.status === "fulfilled") {
          setAuditCount((auditData.value || []).length);
        }

        if (casesData.status === "rejected" && auditData.status === "rejected") {
          setError("Could not load dashboard data. Please try again.");
        }
      } catch (err) {
        if (mounted) setError("Something went wrong while loading the dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loading label="Loading dashboard..." />;

  const totalCases = cases.length;
  const openCases = cases.filter((c) => c.status === "open" || c.status === "Open").length;
  const closedCases = cases.filter((c) => c.status === "closed" || c.status === "Closed").length;

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <button className="btn btn-primary" onClick={() => navigate("/cases/create")}>
          + New Case
        </button>
      </div>

      {error && (
        <div className="login-error" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-3" style={{ marginBottom: "28px" }}>
        <StatCard label="Total Cases" value={totalCases} tone="neutral" />
        <StatCard label="Open Cases" value={openCases} tone="warning" />
        <StatCard label="Closed Cases" value={closedCases} tone="success" />
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent Cases</h3>
          {recentCases.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>
              No cases yet. Create your first case to get started.
            </p>
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
                {recentCases.map((c) => (
                  <tr
                    key={c._id || c.id}
                    onClick={() => navigate(`/cases/${c._id || c.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{c.title || c.name}</td>
                    <td>
                      <span
                        className={
                          "badge " +
                          (String(c.status).toLowerCase() === "open"
                            ? "badge-warning"
                            : "badge-success")
                        }
                      >
                        {c.status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Audit Activity</h3>
          <StatCard label="Total Logged Actions" value={auditCount} tone="neutral" />
          <button
            className="btn btn-primary"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("/audit-logs")}
          >
            View Full Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
