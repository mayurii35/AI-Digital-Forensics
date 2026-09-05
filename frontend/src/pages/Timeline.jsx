import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import { fetchTimeline } from "../services/api.js";

export default function Timeline() {
  const { caseId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchTimeline(caseId);
        if (mounted) setEvents(data || []);
      } catch (err) {
        if (mounted) setError("Could not load timeline.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [caseId]);

  if (loading) return <Loading label="Loading timeline..." />;
  if (error) return <div className="login-error">{error}</div>;

  return (
    <div>
      <h2>Timeline</h2>
      <div className="card">
        {events.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No timeline events yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {events
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
              .map((ev, idx) => (
                <div
                  key={ev._id || ev.id || idx}
                  style={{
                    display: "flex",
                    gap: "16px",
                    padding: "14px 0",
                    borderBottom: idx < events.length - 1 ? "1px solid var(--border-color)" : "none",
                    animation: "fadeInUp 0.3s ease",
                  }}
                >
                  <div style={{ minWidth: "160px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "-"}
                  </div>
                  <div>
                    <strong>{ev.event_type || ev.action || "Event"}</strong>
                    <p style={{ margin: "4px 0 0", color: "var(--text-secondary)" }}>
                      {ev.description || ev.details || ""}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
