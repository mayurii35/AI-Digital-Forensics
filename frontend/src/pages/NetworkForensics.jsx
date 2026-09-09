import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Network,
  ArrowLeft,
  Globe,
  AlertTriangle,
  Shield,
  Upload,
  Zap,
  Search,
  Wifi,
  Server,
  Activity,
  CheckCircle2,
  Sparkles,
  Copy,
  ChevronDown,
} from "lucide-react";
import client from "../services/api.js";

const LOG_TYPES = [
  { id: "generic", label: "Generic Log", icon: <Activity size={20} /> },
  { id: "firewall", label: "Firewall Log", icon: <Shield size={20} /> },
  { id: "pcap", label: "PCAP Export", icon: <Wifi size={20} /> },
  { id: "http", label: "HTTP/Web Log", icon: <Globe size={20} /> },
  { id: "dns", label: "DNS Log", icon: <Server size={20} /> },
];

const SAMPLE_LOG = `2024-01-15 14:23:01 SYN 192.168.1.45 -> 203.0.113.47:4444 DROPPED
2024-01-15 14:23:02 DNS query: evil-domain.xyz resolved to 198.51.100.23
2024-01-15 14:23:05 HTTP 403 GET /admin/login from 10.0.0.52
2024-01-15 14:23:08 SSH connection attempt 185.220.101.45:22 failed (5 tries)
2024-01-15 14:23:12 nmap scan detected from 45.142.212.100
2024-01-15 14:23:15 ICMP ping sweep 172.16.0.0/24 from 192.168.1.200
2024-01-15 14:23:20 HTTP 500 POST /api/exec from 10.0.0.100
2024-01-15 14:23:25 Port 3389 RDP brute force 61.177.173.18 -> 10.0.0.5
2024-01-15 14:23:30 DNS query: pastebin.com from 192.168.1.45
2024-01-15 14:24:00 URL: https://bit.ly/3xPloit accessed from 192.168.1.45`;

async function analyzeNetworkLog(logText, logType) {
  const res = await client.post("/network-forensics/analyze", {
    log_text: logText,
    log_type: logType,
  });
  return res.data;
}

function SeverityBadge({ sev }) {
  const cls =
    sev === "HIGH" || sev === "CRITICAL"
      ? "badge-danger"
      : sev === "MEDIUM"
      ? "badge-warning"
      : "badge-neutral";
  return <span className={`badge ${cls}`} style={{ fontSize: "0.7rem" }}>{sev}</span>;
}

export default function NetworkForensics() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [logText, setLogText] = useState("");
  const [logType, setLogType] = useState("generic");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [expandedAiSummary, setExpandedAiSummary] = useState(true);

  const handleFileRead = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => setLogText(e.target.result || "");
    reader.readAsText(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleAnalyze = async () => {
    if (!logText.trim()) return setError("Paste or upload a log file first.");
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await analyzeNetworkLog(logText, logType);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Network analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const artifacts = result?.artifacts || {};
  const findings = artifacts?.findings || [];
  const ipList = artifacts?.ip_list || [];
  const suspiciousPorts = artifacts?.suspicious_ports || [];
  const urls = artifacts?.urls || [];
  const dnsQueries = artifacts?.dns_queries || [];
  const scanSigs = artifacts?.scan_signatures || [];

  return (
    <section className="page-shell">
      {/* HEADER */}
      <div className="page-heading">
        <div>
          <button
            className="ui-back-button"
            onClick={() => navigate(`/cases/${caseId}`)}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={15} /> Back to Case Overview
          </button>
          <p className="eyebrow">NETWORK TRAFFIC & LOG ANALYSIS</p>
          <h1>Network Forensics</h1>
          <p>
            GenAI-powered analysis of firewall logs, PCAP exports, HTTP logs, and DNS queries.
            Extract IOCs, detect scans, and identify threat actors automatically.
          </p>
        </div>
      </div>

      {error && <div className="error-card"><AlertTriangle size={16} /> {error}</div>}

      {/* LOG TYPE SELECTOR */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <p className="eyebrow" style={{ marginBottom: 12 }}>SELECT LOG TYPE</p>
        <div className="nf-type-grid">
          {LOG_TYPES.map((t) => (
            <button
              key={t.id}
              className={`nf-type-btn ${logType === t.id ? "nf-type-active" : ""}`}
              onClick={() => setLogType(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title-row" style={{ margin: 0 }}>
            <Upload size={16} className="text-accent" />
            <h4 style={{ margin: 0 }}>Paste Log or Upload File</h4>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="ui-button ui-button-ghost"
              onClick={() => setLogText(SAMPLE_LOG)}
              style={{ fontSize: "0.78rem", padding: "6px 12px" }}
            >
              Load Sample Log
            </button>
            <button
              className="ui-button ui-button-ghost"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: "0.78rem", padding: "6px 12px" }}
            >
              <Upload size={13} /> Upload File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".txt,.log,.csv,.pcap,.json"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Drag & drop zone or textarea */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
        >
          <textarea
            className={`netforensics-textarea ${dragging ? "drag-over" : ""}`}
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder={`Paste your ${logType} log here, or drag & drop a log file above...\n\nExamples:\n  • Firewall deny/allow logs\n  • PCAP text exports (tshark -r capture.pcap -T fields ...)\n  • Apache/Nginx access logs\n  • Windows Security Event logs\n  • DNS query logs`}
            rows={10}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button
            className="ui-button ui-button-primary"
            onClick={handleAnalyze}
            disabled={loading || !logText.trim()}
            style={{ minWidth: 180 }}
          >
            {loading ? (
              <><Activity size={15} className="spin" /> Analyzing…</>
            ) : (
              <><Zap size={15} /> Run Network Analysis</>
            )}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      {result && (
        <>
          {/* STAT CARDS */}
          <div className="netforensics-result-grid">
            <div className="nf-stat-card">
              <div className="nf-stat-icon"><Globe size={20} className="text-accent" /></div>
              <div className="nf-stat-body">
                <div className="nf-stat-label">Unique IPs</div>
                <div className="nf-stat-value">{artifacts.unique_ips || 0}</div>
              </div>
            </div>
            <div className="nf-stat-card">
              <div className="nf-stat-icon"><AlertTriangle size={20} className="text-warning" /></div>
              <div className="nf-stat-body">
                <div className="nf-stat-label">External IPs</div>
                <div className="nf-stat-value" style={{ color: artifacts.external_ip_count > 0 ? "#d97706" : "#0f172a" }}>
                  {artifacts.external_ip_count || 0}
                </div>
              </div>
            </div>
            <div className="nf-stat-card">
              <div className="nf-stat-icon"><Shield size={20} className="text-danger" /></div>
              <div className="nf-stat-body">
                <div className="nf-stat-label">Threat Findings</div>
                <div className="nf-stat-value" style={{ color: findings.length > 0 ? "#dc2626" : "#0f172a" }}>
                  {findings.length}
                </div>
              </div>
            </div>
            <div className="nf-stat-card">
              <div className="nf-stat-icon"><Activity size={20} className="text-accent" /></div>
              <div className="nf-stat-body">
                <div className="nf-stat-label">Lines Analyzed</div>
                <div className="nf-stat-value">{artifacts.total_lines || 0}</div>
              </div>
            </div>
          </div>

          {/* AI SUMMARY */}
          {result.ai_summary && (
            <div className="nf-ai-summary-card">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setExpandedAiSummary(!expandedAiSummary)}
              >
                <div className="section-title-row" style={{ margin: 0 }}>
                  <Sparkles size={16} className="text-accent" />
                  <h4 style={{ margin: 0 }}>GenAI Forensic Assessment</h4>
                </div>
                <ChevronDown
                  size={16}
                  className="text-accent"
                  style={{ transform: expandedAiSummary ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                />
              </div>
              {expandedAiSummary && (
                <div className="nf-ai-summary-text">{result.ai_summary}</div>
              )}
            </div>
          )}

          {/* THREAT FINDINGS */}
          {findings.length > 0 && (
            <div className="nf-findings-card">
              <div className="section-title-row">
                <AlertTriangle size={16} className="text-danger" />
                <h4 style={{ margin: 0 }}>Threat Findings ({findings.length})</h4>
              </div>
              <div className="nf-findings-list">
                {findings.map((f, i) => (
                  <div key={i} className="nf-finding-row">
                    <div className="nf-finding-icon">
                      <SeverityBadge sev={f.severity} />
                    </div>
                    <div className="nf-finding-body">
                      <div className="nf-finding-title">{f.title}</div>
                      <div className="nf-finding-detail">{f.detail}</div>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "#475569", whiteSpace: "nowrap" }}>{f.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IP TABLE */}
          {ipList.length > 0 && (
            <div className="card" style={{ padding: "20px" }}>
              <div className="section-title-row" style={{ marginBottom: 0 }}>
                <Globe size={16} className="text-accent" />
                <h4 style={{ margin: 0 }}>IP Address Intelligence ({ipList.length} unique)</h4>
              </div>
              <table className="nf-ip-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Classification</th>
                    <th>Occurrences</th>
                    <th>Threat Intel</th>
                  </tr>
                </thead>
                <tbody>
                  {ipList.slice(0, 20).map((ip, i) => (
                    <tr key={i}>
                      <td><code>{ip.ip}</code></td>
                      <td>
                        <span className={`badge ${ip.type === "External" ? "badge-warning" : "badge-neutral"}`}
                          style={{ fontSize: "0.7rem" }}>
                          {ip.type}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace" }}>{ip.occurrences}x</td>
                      <td>
                        <a
                          href={`https://www.virustotal.com/gui/ip-address/${ip.ip}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", fontSize: "0.75rem", fontWeight: 600 }}
                        >
                          VirusTotal ↗
                        </a>
                        {" · "}
                        <a
                          href={`https://www.abuseipdb.com/check/${ip.ip}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", fontSize: "0.75rem", fontWeight: 600 }}
                        >
                          AbuseIPDB ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUSPICIOUS PORTS + SCAN SIGS + DNS */}
          <div className="netforensics-result-grid" style={{ marginTop: 16 }}>
            {suspiciousPorts.length > 0 && (
              <div className="nf-findings-card" style={{ gridColumn: "auto" }}>
                <div className="section-title-row">
                  <AlertTriangle size={16} className="text-warning" />
                  <h4 style={{ margin: 0 }}>Suspicious Ports</h4>
                </div>
                <div className="chip-list">
                  {suspiciousPorts.map((p, i) => (
                    <span key={i} className="entity-chip entity-chip-port">Port {p.port}</span>
                  ))}
                </div>
              </div>
            )}

            {(scanSigs.length > 0 || dnsQueries.length > 0) && (
              <div className="nf-findings-card" style={{ gridColumn: "auto" }}>
                {scanSigs.length > 0 && (
                  <>
                    <div className="section-title-row">
                      <Search size={16} className="text-danger" />
                      <h4 style={{ margin: 0 }}>Scan Signatures Detected</h4>
                    </div>
                    <div className="chip-list" style={{ marginBottom: 16 }}>
                      {scanSigs.map((s, i) => (
                        <span key={i} className="entity-chip" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" }}>{s}</span>
                      ))}
                    </div>
                  </>
                )}
                {dnsQueries.length > 0 && (
                  <>
                    <div className="section-title-row">
                      <Globe size={16} className="text-accent" />
                      <h4 style={{ margin: 0 }}>DNS Queries</h4>
                    </div>
                    <div className="chip-list">
                      {dnsQueries.map((d, i) => (
                        <span key={i} className="entity-chip">{d}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* URLs */}
          {urls.length > 0 && (
            <div className="card" style={{ padding: "20px" }}>
              <div className="section-title-row">
                <Globe size={16} className="text-accent" />
                <h4 style={{ margin: 0 }}>Extracted URLs ({urls.length})</h4>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                {urls.map((url, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <code style={{ fontSize: "0.82rem", color: "#0f172a", flex: 1, wordBreak: "break-all" }}>{url}</code>
                    <a href={`https://www.virustotal.com/gui/url/${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Check ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="card empty-state">
          <Network size={48} className="text-secondary" />
          <h3>No Analysis Run Yet</h3>
          <p>
            Paste network log content above (firewall, PCAP export, HTTP access log, DNS log)
            and click "Run Network Analysis" to extract IOCs and get a GenAI forensic report.
          </p>
        </div>
      )}
    </section>
  );
}
