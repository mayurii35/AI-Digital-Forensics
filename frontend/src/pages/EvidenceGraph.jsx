import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
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
  ArrowRight,
  BarChart2,
  Share2
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
  const [viewMode, setViewMode] = useState("graph"); // 'graph' or 'analytics'

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

  // Analytics Data Processing
  const { nodes = [], edges = [] } = graphData;

  const pieData = useMemo(() => {
    const counts = {};
    nodes.forEach(n => {
      const t = n.type || "unknown";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [nodes]);

  const COLORS = ["#2563eb", "#10b981", "#f43f5e", "#8b5cf6", "#f59e0b"];

  const barData = useMemo(() => {
    // Top connected nodes
    const connections = {};
    edges.forEach(e => {
      const src = e.source?.id || e.source;
      const tgt = e.target?.id || e.target;
      connections[src] = (connections[src] || 0) + 1;
      connections[tgt] = (connections[tgt] || 0) + 1;
    });
    
    return nodes
      .map(n => ({
        name: n.label.length > 15 ? n.label.substring(0, 15) + "..." : n.label,
        type: n.type,
        connections: connections[n.id] || 0
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);
  }, [nodes, edges]);


  if (loading) return <Loading label="Synthesizing digital evidence knowledge graph…" />;

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
          <div className="view-mode-toggle" style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
            <button
              className={`ui-button ui-button-sm ${viewMode === 'graph' ? 'ui-button-primary' : 'ui-button-ghost'}`}
              onClick={() => setViewMode('graph')}
            >
              <Share2 size={14} /> Relationship Map
            </button>
            <button
              className={`ui-button ui-button-sm ${viewMode === 'analytics' ? 'ui-button-primary' : 'ui-button-ghost'}`}
              onClick={() => setViewMode('analytics')}
            >
              <BarChart2 size={14} /> Analytics Dashboard
            </button>
          </div>
          <span className="pill-stat">
            <strong>{nodes.length}</strong> Nodes
          </span>
          <span className="pill-stat">
            <strong>{edges.length}</strong> Connections
          </span>
        </div>
      </div>

      {error && <div className="error-card">{error}</div>}

      {viewMode === "analytics" ? (
        <div className="analytics-dashboard">
          <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
            {/* Pie Chart Card */}
            <div className="card">
              <div className="card-heading">
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: '#0f172a' }}>Entity Type Distribution</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Breakdown of nodes by extracted type</p>
              </div>
              <div style={{ height: 350, width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="card">
              <div className="card-heading">
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: '#0f172a' }}>Top Connected Entities</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Nodes with the most relationships</p>
              </div>
              <div style={{ height: 350, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="connections" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* GRAPH TOOLBAR */}
          <div className="card graph-controls-bar">
            <div className="graph-controls-left">
              <div className="cases-modern-search-wrap" style={{ minWidth: "300px" }}>
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter node labels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cases-modern-search-input"
                  style={{ padding: "8px 12px", fontSize: "0.95rem" }}
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
        </>
      )}
    </section>
  );
}
