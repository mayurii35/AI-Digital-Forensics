import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import {
  GitBranch,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertTriangle,
  Tag,
  Shield,
  Layers,
  ArrowRight
} from "lucide-react";
import Loading from "../components/Loading.jsx";
import { fetchEvidenceGraph } from "../services/api.js";

export default function EvidenceGraph() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 620 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchEvidenceGraph(caseId);
        if (mounted) {
          setGraphData(data || { nodes: [], edges: [] });
        }
      } catch (err) {
        if (mounted) setError("Could not load evidence relationship graph.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  // Handle responsive resizing
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth || 800,
          height: 620,
        });
      }
    }
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [loading]);

  // Filtered graph dataset
  const processedData = useMemo(() => {
    let { nodes = [], edges = [] } = graphData;

    // Map edges to react-force-graph format: links with source and target
    const links = edges.map((e) => ({
      source: e.source,
      target: e.target,
      relation: e.relation || "connected",
    }));

    if (filterType !== "ALL") {
      const allowedNodeIds = new Set(
        nodes.filter((n) => n.type === filterType || n.type === "case").map((n) => n.id)
      );
      nodes = nodes.filter((n) => allowedNodeIds.has(n.id));
      const filteredLinks = links.filter(
        (l) => allowedNodeIds.has(l.source?.id || l.source) && allowedNodeIds.has(l.target?.id || l.target)
      );
      return { nodes, links: filteredLinks };
    }

    return { nodes, links };
  }, [graphData, filterType]);

  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400);
  };

  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 0.7, 400);
  };

  const handleResetZoom = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 50);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(2.5, 600);
    }
  };

  if (loading) return <Loading label="Synthesizing digital evidence knowledge graph…" />;

  const { nodes = [], edges = [] } = graphData;

  return (
    <section className="page-shell">
      {/* PAGE HEADING */}
      <div className="page-heading">
        <div>
          <button
            className="ui-back-button"
            onClick={() => navigate(`/cases/${caseId}`)}
            style={{ marginBottom: 12 }}
          >
            ← Back to Case Overview
          </button>
          <p className="eyebrow">RELATIONSHIP MAP</p>
          <h1>Interactive Forensic Evidence Graph</h1>
          <p>
            Visual force-directed knowledge graph mapping seized artifacts, threat indicators, and extracted cross-case entities.
          </p>
        </div>

        <div className="graph-stats-pills">
          <span className="pill-stat">
            <strong>{nodes.length}</strong> Nodes
          </span>
          <span className="pill-stat">
            <strong>{edges.length}</strong> Connections
          </span>
        </div>
      </div>

      {error && <div className="error-card">{error}</div>}

      {/* GRAPH TOOLBAR */}
      <div className="card graph-controls-bar">
        <div className="graph-controls-left">
          <div className="graph-search-input">
            <Search size={14} className="text-secondary" />
            <input
              type="text"
              placeholder="Filter node labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="graph-filter-select-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="graph-select"
            >
              <option value="ALL">All Node Types</option>
              <option value="evidence">Evidence Files Only</option>
              <option value="entity">Extracted Entities Only</option>
              <option value="indicator">Threat Indicators Only</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="graph-legend">
          <span className="legend-item">
            <span className="legend-dot dot-blue"></span> Case Root
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-cyan"></span> Evidence
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-green"></span> Entity
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-red"></span> Threat Indicator
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="graph-zoom-controls">
          <button className="btn-icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button className="btn-icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <button className="btn-icon" onClick={handleResetZoom} title="Fit to Screen">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* GRAPH CANVAS & DRAWER WRAPPER */}
      <div className="graph-workspace-layout">
        <div className="graph-canvas-container card" ref={containerRef}>
          {processedData.nodes.length > 0 ? (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={processedData}
              backgroundColor="#f8fafc"
              nodeLabel={(n) => `${n.type ? n.type.toUpperCase() : 'NODE'}: ${n.label}`}
              nodeColor={(n) => {
                if (searchTerm && n.label.toLowerCase().includes(searchTerm.toLowerCase())) {
                  return "#f43f5e";
                }
                return n.color || "#2563eb";
              }}
              nodeVal={(n) => n.size || 12}
              linkColor={() => "rgba(37, 99, 235, 0.25)"}
              linkWidth={1.5}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.005}
              onNodeClick={handleNodeClick}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.label || "";
                const fontSize = 11 / globalScale;
                const nodeSize = (node.size || 12);

                // Draw Glowing Outer Ring if selected or highlighted
                if (
                  selectedNode?.id === node.id ||
                  (searchTerm && label.toLowerCase().includes(searchTerm.toLowerCase()))
                ) {
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, nodeSize + 4, 0, 2 * Math.PI, false);
                  ctx.fillStyle = "rgba(37, 99, 235, 0.2)";
                  ctx.fill();
                }

                // Draw Base Node Circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color || "#2563eb";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();

                // Draw Label Text in dark slate
                ctx.font = `600 ${fontSize}px Inter, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#0f172a";
                ctx.fillText(label.length > 20 ? `${label.slice(0, 18)}…` : label, node.x, node.y + nodeSize + 9);
              }}
            />

          ) : (
            <div className="empty-state">
              <GitBranch size={48} className="text-secondary" />
              <p>No nodes found for this relationship graph.</p>
            </div>
          )}
        </div>

        {/* NODE INSPECTION DRAWER */}
        {selectedNode && (
          <div className="graph-node-drawer card">
            <div className="drawer-header">
              <div className="drawer-title-row">
                <span
                  className="drawer-type-chip"
                  style={{ backgroundColor: selectedNode.color || "#3b82f6" }}
                >
                  {selectedNode.type?.toUpperCase()}
                </span>
                <h3>{selectedNode.label}</h3>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-info-row">
                <span className="text-secondary">Identifier:</span>
                <code>{selectedNode.id}</code>
              </div>

              {selectedNode.severity && (
                <div className="drawer-info-row">
                  <span className="text-secondary">Severity:</span>
                  <span className={`badge badge-tracker-${selectedNode.severity.toLowerCase()}`}>
                    {selectedNode.severity}
                  </span>
                </div>
              )}

              {selectedNode.subType && (
                <div className="drawer-info-row">
                  <span className="text-secondary">Category:</span>
                  <span>{selectedNode.subType}</span>
                </div>
              )}

              {/* Quick Actions if node is evidence */}
              {selectedNode.type === "evidence" && (
                <div className="drawer-actions">
                  <button
                    className="btn btn-tracker-action btn-full"
                    onClick={() =>
                      navigate(
                        `/cases/${caseId}/text-tracker?evidenceId=${selectedNode.id}`
                      )
                    }
                  >
                    <FileText size={15} /> Open in Text Tracker <ArrowRight size={14} />
                  </button>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() =>
                      navigate(
                        `/cases/${caseId}/analysis?evidenceId=${selectedNode.id}`
                      )
                    }
                  >
                    Run AI Analysis
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
