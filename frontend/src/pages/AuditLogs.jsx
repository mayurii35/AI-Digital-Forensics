import React, { useEffect, useState } from "react";
import Loading from "../components/Loading.jsx";
import { fetchAuditLogs } from "../services/api.js";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchAuditLogs();
        if (mounted) setLogs(data || []);
      } catch (err) {
        if (mounted) setError("Could not load audit logs.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading label="Loading audit logs..." />;

  return (
    <div>
      <h2>Audit Logs</h2>
      {error && <div className="login-error">{error}</div>}

      <div className="card">
        {logs.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No audit activity recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Target</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((log, idx) => (
                  <tr key={log._id || log.id || idx}>
                    <td>{log.username || log.user || "-"}</td>
                    <td>
                      <span className="badge badge-neutral">{log.action || "-"}</span>
                    </td>
                    <td>{log.target || log.resource || "-"}</td>
                    <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
