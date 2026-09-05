import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import { fetchEvidenceGraph } from "../services/api.js";

export default function EvidenceGraph() {
  const { caseId } = useParams();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchEvidenceGraph(caseId);
        if (mounted) setGraphData(data || { nodes: [], edges: [] });
      } catch (err) {
        if (mounted) setError("Could not load evidence graph.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [caseId]);

  if (loading) return <Loading label="Loading evidence graph..." />;
  if (error) return <div className="login-error">{error}</div>;

  const { nodes = [], edges = [] } = graphData;

  return (
    <div>
      <h2>Evidence Graph</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
        Relationship view — connections between evidence, entities, and people found across this case.
      </p>

      <div className="grid grid-cols-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Nodes ({nodes.length})</h3>
          {nodes.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No nodes found.</p>
          ) : (
            <ul style={{ paddingLeft: "18px" }}>
              {nodes.map((n, idx) => (
                <li key={n.id || idx} style={{ marginBottom: "6px" }}>
                  <span className="badge badge-neutral">{n.type || "entity"}</span> {n.label || n.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Connections ({edges.length})</h3>
          {edges.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No connections found.</p>
          ) : (
            <ul style={{ paddingLeft: "18px" }}>
              {edges.map((e, idx) => (
                <li key={idx} style={{ marginBottom: "6px" }}>
                  {e.source} → {e.target}{" "}
                  <span style={{ color: "var(--text-secondary)" }}>({e.relation || "linked"})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
