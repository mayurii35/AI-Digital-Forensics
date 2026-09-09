import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldAlert,
  Terminal,
  RefreshCw,
  ArrowLeft,
  Filter,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Sparkles
} from "lucide-react";
import Loading from "../components/Loading.jsx";
import {
  fetchEvidenceForCase,
  fetchTextTrackerResult,
  runTextTracker,
  fetchCaseById
} from "../services/api.js";

export default function TextTracker() {
  const { caseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentEvidenceId = searchParams.get("evidenceId") || "";

  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(currentEvidenceId);
  const [trackerData, setTrackerData] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  // Search & Navigation in Text
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [copiedValue, setCopiedValue] = useState("");

  // Refs for line scrolling
  const lineRefs = useRef({});
  const textContainerRef = useRef(null);

  // Load initial case and evidence list
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        const [cData, evList] = await Promise.all([
          fetchCaseById(caseId).catch(() => null),
          fetchEvidenceForCase(caseId).catch(() => [])
        ]);

        setCaseData(cData);
        setEvidenceList(evList);

        // Filter text-compatible evidence first, or fallback to first item
        const textTypes = [".txt", ".log", ".pdf", ".csv", ".docx", ".doc", ".json", ".xml", "text", "document"];
        const matched = evList.find(e => e.evidence_id === currentEvidenceId)
          || evList.find(e => textTypes.some(ext => (e.file_name || "").toLowerCase().includes(ext) || (e.file_type || "").toLowerCase().includes(ext)))
          || evList[0];

        if (matched) {
          setSelectedEvidenceId(matched.evidence_id);
          setSearchParams({ evidenceId: matched.evidence_id });
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to load case evidence items: " + (err.message || "Unknown error"));
        setLoading(false);
      }
    }
    init();
  }, [caseId]);

  // Load tracker result when selected evidence changes
  useEffect(() => {
    if (!selectedEvidenceId) return;

    let isMounted = true;
    async function loadTracker() {
      try {
        setScanning(true);
        setError("");
        const res = await fetchTextTrackerResult(selectedEvidenceId);
        if (isMounted) {
          setTrackerData(res);
          setScanning(false);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Could not analyze evidence text: " + (err.response?.data?.detail || err.message));
          setScanning(false);
          setLoading(false);
        }
      }
    }
    loadTracker();

    return () => {
      isMounted = false;
    };
  }, [selectedEvidenceId]);

  const handleSelectEvidence = (evId) => {
    setSelectedEvidenceId(evId);
    setSearchParams({ evidenceId: evId });
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };

  const handleReScan = async () => {
    if (!selectedEvidenceId) return;
    try {
      setScanning(true);
      setError("");
      const res = await runTextTracker(selectedEvidenceId);
      setTrackerData(res);
      setScanning(false);
    } catch (err) {
      setError("Re-scan failed: " + (err.response?.data?.detail || err.message));
      setScanning(false);
    }
  };

  const copyToClipboard = (val) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(""), 2000);
  };

  // Jump to specific line in text viewer
  const scrollToLine = (lineNum) => {
    if (!lineNum || lineNum <= 0) return;
    const targetEl = lineRefs.current[lineNum];
    if (targetEl && textContainerRef.current) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("line-highlight-flash");
      setTimeout(() => {
        targetEl.classList.remove("line-highlight-flash");
      }, 2000);
    }
  };

  // Lines with indicators mapping
  const indicatorsByLine = useMemo(() => {
    const map = {};
    if (!trackerData?.indicators) return map;
    trackerData.indicators.forEach((ind) => {
      const l = ind.line_number;
      if (l) {
        if (!map[l]) map[l] = [];
        map[l].push(ind);
      }
    });
    return map;
  }, [trackerData]);

  // Filtered indicators list
  const filteredIndicators = useMemo(() => {
    if (!trackerData?.indicators) return [];
    return trackerData.indicators.filter((ind) => {
      const matchSev = selectedSeverity === "ALL" || ind.severity === selectedSeverity;
      const matchType = selectedType === "ALL" || ind.type === selectedType;
      const matchSearch =
        !searchQuery ||
        ind.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSev && matchType && matchSearch;
    });
  }, [trackerData, selectedSeverity, selectedType, searchQuery]);

  // Search match positions in text
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || !trackerData?.lines) return [];
    const q = searchQuery.toLowerCase();
    const matches = [];
    trackerData.lines.forEach((l) => {
      if (l.text.toLowerCase().includes(q)) {
        matches.push(l.line);
      }
    });
    return matches;
  }, [searchQuery, trackerData]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    scrollToLine(searchMatches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    scrollToLine(searchMatches[prevIdx]);
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case "CRITICAL":
        return "badge-tracker-critical";
      case "HIGH":
        return "badge-tracker-high";
      case "MEDIUM":
        return "badge-tracker-medium";
      default:
        return "badge-tracker-low";
    }
  };

  if (loading) {
    return <Loading label="Initializing Forensic Text Tracker Workspace..." />;
  }

  const selectedEvidence = evidenceList.find((e) => e.evidence_id === selectedEvidenceId);

  return (
    <section className="tracker-page">
      {/* Top Header */}
      <div className="tracker-header">
        <div className="tracker-header-left">
          <button
            className="ui-back-button"
            onClick={() => navigate(`/cases/${caseId}`)}
            title="Return to Case Overview"
          >
            <ArrowLeft size={15} /> Back to Case Overview
          </button>
          <div>
            <div className="tracker-breadcrumb">
              <span>CASES</span> / <span>{caseData?.title || caseId}</span> / <span className="active">TEXT TRACKER</span>
            </div>
            <h1 className="tracker-title">
              Forensic Text Tracker & Artifact Inspector
            </h1>
          </div>
        </div>

        {/* Evidence Switcher & Scan Action */}
        <div className="tracker-header-right">
          <div className="evidence-dropdown-wrap">
            <Layers size={16} className="text-secondary" />
            <select
              className="evidence-select"
              value={selectedEvidenceId}
              onChange={(e) => handleSelectEvidence(e.target.value)}
            >
              {evidenceList.map((ev) => (
                <option key={ev.evidence_id} value={ev.evidence_id}>
                  {ev.file_name || ev.evidence_name} ({ev.file_type || "file"})
                </option>
              ))}
            </select>
          </div>

          <button
            className="ui-button ui-button-primary tracker-scan-btn"
            onClick={handleReScan}
            disabled={scanning || !selectedEvidenceId}
          >
            <RefreshCw size={14} className={scanning ? "spin-icon" : ""} />
            {scanning ? "Deep Scanning..." : "Re-Scan Artifact"}
          </button>
        </div>
      </div>

      {error && (
        <div className="tracker-alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={handleReScan}>Retry</button>
        </div>
      )}

      {/* Main Two-Column Forensic Workspace */}
      <div className="tracker-workspace">
        {/* LEFT COLUMN: Line-Numbered Document / Code Viewer */}
        <div className="tracker-editor-column">
          <div className="editor-toolbar">
            <div className="editor-file-info">
              <FileText size={16} className="text-accent" />
              <span className="editor-file-name">
                {selectedEvidence?.file_name || "Document Text"}
              </span>
              <span className="editor-file-stats">
                {trackerData?.total_lines || 0} lines · {trackerData?.total_chars || 0} characters
              </span>
            </div>

            {/* In-Text Search Bar */}
            <div className="editor-search-bar">
              <Search size={14} className="search-icon text-secondary" />
              <input
                type="text"
                placeholder="Search raw text (regex, IPs, keywords)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNextMatch();
                }}
              />
              {searchMatches.length > 0 && (
                <div className="search-counter">
                  {currentMatchIndex + 1} of {searchMatches.length}
                </div>
              )}
              <div className="search-nav-buttons">
                <button
                  className="search-nav-btn"
                  onClick={handlePrevMatch}
                  disabled={searchMatches.length === 0}
                  title="Previous match"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  className="search-nav-btn"
                  onClick={handleNextMatch}
                  disabled={searchMatches.length === 0}
                  title="Next match"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Text Lines Scrollable Container */}
          <div className="tracker-text-container" ref={textContainerRef}>
            {scanning ? (
              <div className="tracker-scanning-overlay">
                <div className="loading-spinner"></div>
                <p>Extracting text streams and parsing forensic indicators...</p>
              </div>
            ) : trackerData?.lines && trackerData.lines.length > 0 ? (
              <div className="tracker-lines-wrapper">
                {trackerData.lines.map((lineObj) => {
                  const lineNum = lineObj.line;
                  const lineIndicators = indicatorsByLine[lineNum] || [];
                  const hasCritical = lineIndicators.some(i => i.severity === "CRITICAL");
                  const hasHigh = lineIndicators.some(i => i.severity === "HIGH");
                  const hasMedium = lineIndicators.some(i => i.severity === "MEDIUM");

                  let lineFlagClass = "";
                  if (hasCritical) lineFlagClass = "line-flag-critical";
                  else if (hasHigh) lineFlagClass = "line-flag-high";
                  else if (hasMedium) lineFlagClass = "line-flag-medium";
                  else if (lineIndicators.length > 0) lineFlagClass = "line-flag-low";

                  const isSearchMatch = searchMatches.includes(lineNum);

                  return (
                    <div
                      key={lineNum}
                      ref={(el) => (lineRefs.current[lineNum] = el)}
                      className={`text-line-row ${lineFlagClass} ${isSearchMatch ? "search-matched-row" : ""}`}
                    >
                      {/* Gutter / Line Number */}
                      <div className="line-gutter">
                        <span className="line-num">{lineNum}</span>
                        {lineIndicators.length > 0 && (
                          <span
                            className={`line-indicator-dot dot-${lineIndicators[0].severity.toLowerCase()}`}
                            title={`${lineIndicators.length} indicator(s): ${lineIndicators.map(i => i.value).join(", ")}`}
                          />
                        )}
                      </div>

                      {/* Line Text Content */}
                      <div className="line-content">
                        <code>{lineObj.text || "\u00A0"}</code>

                        {/* Inline tags if indicators present on this line */}
                        {lineIndicators.length > 0 && (
                          <div className="inline-indicator-tags">
                            {lineIndicators.map((ind, iIdx) => (
                              <span
                                key={iIdx}
                                className={`inline-tag tag-${ind.severity.toLowerCase()}`}
                                title={ind.reason}
                              >
                                {ind.type}: {ind.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="tracker-empty-state">
                <FileText size={48} className="text-secondary" />
                <h3>No Extracted Text Available</h3>
                <p>
                  This evidence artifact may be non-textual or empty.
                  Text Tracker supports TXT, LOG, CSV, PDF, DOCX, JSON, and XML formats.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Intelligence & Indicator Findings Breakdown */}
        <div className="tracker-intel-column">
          {/* Risk Score Summary Banner */}
          <div className="tracker-risk-banner">
            <div className="risk-score-display">
              <div
                className={`risk-gauge-circle gauge-${(trackerData?.risk_level || "LOW").toLowerCase()}`}
              >
                <span className="risk-score-value">{trackerData?.risk_score || 0}</span>
                <span className="risk-score-sub">/ 100</span>
              </div>
              <div className="risk-score-info">
                <span className="risk-tag">THREAT RISK ASSESSMENT</span>
                <h3 className={`risk-level-heading text-${(trackerData?.risk_level || "LOW").toLowerCase()}`}>
                  {trackerData?.risk_level || "Low"} Risk
                </h3>
                <p className="risk-meta-text">
                  {trackerData?.indicators?.length || 0} suspicious artifacts identified across {trackerData?.total_lines || 0} lines.
                </p>
              </div>
            </div>

            {/* Severity Tally Pills */}
            <div className="severity-pill-row">
              <div
                className={`sev-pill ${selectedSeverity === "CRITICAL" ? "active" : ""}`}
                onClick={() => setSelectedSeverity(selectedSeverity === "CRITICAL" ? "ALL" : "CRITICAL")}
              >
                <span className="pill-dot dot-critical"></span>
                <span className="pill-name">Critical</span>
                <span className="pill-count">{trackerData?.severity_counts?.CRITICAL || 0}</span>
              </div>
              <div
                className={`sev-pill ${selectedSeverity === "HIGH" ? "active" : ""}`}
                onClick={() => setSelectedSeverity(selectedSeverity === "HIGH" ? "ALL" : "HIGH")}
              >
                <span className="pill-dot dot-high"></span>
                <span className="pill-name">High</span>
                <span className="pill-count">{trackerData?.severity_counts?.HIGH || 0}</span>
              </div>
              <div
                className={`sev-pill ${selectedSeverity === "MEDIUM" ? "active" : ""}`}
                onClick={() => setSelectedSeverity(selectedSeverity === "MEDIUM" ? "ALL" : "MEDIUM")}
              >
                <span className="pill-dot dot-medium"></span>
                <span className="pill-name">Medium</span>
                <span className="pill-count">{trackerData?.severity_counts?.MEDIUM || 0}</span>
              </div>
              <div
                className={`sev-pill ${selectedSeverity === "LOW" ? "active" : ""}`}
                onClick={() => setSelectedSeverity(selectedSeverity === "LOW" ? "ALL" : "LOW")}
              >
                <span className="pill-dot dot-low"></span>
                <span className="pill-name">Low</span>
                <span className="pill-count">{trackerData?.severity_counts?.LOW || 0}</span>
              </div>
            </div>
          </div>

          {/* AI Forensic Summary Box */}
          <div className="tracker-summary-card">
            <div className="card-heading-compact">
              <Sparkles size={16} className="text-accent" />
              <h4>AI Forensic Summary</h4>
            </div>
            <p className="tracker-summary-text">
              {trackerData?.ai_summary || "Forensic analysis completed. No critical textual threats flagged."}
            </p>
          </div>

          {/* Filter Bar by Type */}
          <div className="indicator-filter-bar">
            <div className="filter-group">
              <Filter size={13} className="text-secondary" />
              <span className="filter-label">Type:</span>
              <select
                className="filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                {trackerData?.type_counts &&
                  Object.keys(trackerData.type_counts).map((t) => (
                    <option key={t} value={t}>
                      {t} ({trackerData.type_counts[t]})
                    </option>
                  ))}
              </select>
            </div>

            {(selectedSeverity !== "ALL" || selectedType !== "ALL") && (
              <button
                className="clear-filter-btn"
                onClick={() => {
                  setSelectedSeverity("ALL");
                  setSelectedType("ALL");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Indicator Findings Table */}
          <div className="indicator-table-wrap">
            <div className="table-header-row">
              <span className="col-sev">SEVERITY</span>
              <span className="col-type">TYPE</span>
              <span className="col-val">EXTRACTED VALUE</span>
              <span className="col-line">LINE</span>
              <span className="col-reason">JUSTIFICATION</span>
            </div>

            <div className="table-body-scroll">
              {filteredIndicators.length > 0 ? (
                filteredIndicators.map((ind, idx) => (
                  <div
                    key={idx}
                    className="indicator-row"
                    onClick={() => scrollToLine(ind.line_number)}
                    title="Click to jump to line in text"
                  >
                    <span className="col-sev">
                      <span className={`badge-indicator ${getSeverityBadgeClass(ind.severity)}`}>
                        {ind.severity}
                      </span>
                    </span>
                    <span className="col-type">{ind.type}</span>
                    <span className="col-val">
                      <code className="val-snippet">{ind.value}</code>
                      <button
                        className="copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(ind.value);
                        }}
                        title="Copy to clipboard"
                      >
                        {copiedValue === ind.value ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
                    </span>
                    <span className="col-line">
                      {ind.line_number ? (
                        <button
                          className="line-jump-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToLine(ind.line_number);
                          }}
                        >
                          L{ind.line_number}
                        </button>
                      ) : (
                        <span className="text-secondary">—</span>
                      )}
                    </span>
                    <span className="col-reason" title={ind.reason}>
                      {ind.reason}
                    </span>
                  </div>
                ))
              ) : (
                <div className="table-empty-msg">
                  <ShieldCheck size={28} className="text-secondary" />
                  <p>No indicators match the selected filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* Forensic Actionable Recommendations */}
          {trackerData?.recommendations && trackerData.recommendations.length > 0 && (
            <div className="tracker-recs-card">
              <div className="card-heading-compact">
                <ShieldAlert size={16} className="text-warning" />
                <h4>Actionable Next Steps</h4>
              </div>
              <ul className="recs-list">
                {trackerData.recommendations.map((rec, rIdx) => (
                  <li key={rIdx} className="rec-item">
                    <span className="rec-bullet">›</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
