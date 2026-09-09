import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Activity,
  Upload,
  BrainCircuit,
  Search,
  ShieldCheck,
  FileSearch,
  Filter,
  ArrowLeft,
  Clock,
  UserCheck
} from "lucide-react";
import Loading from "../components/Loading.jsx";
import { fetchTimeline } from "../services/api.js";

export default function Timeline() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchTimeline(caseId);
        if (mounted) setEvents(data || []);
      } catch (err) {
        if (mounted) setError("Could not load case forensic timeline.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        const action = ev.event_type || ev.action || "";
        const desc = ev.description || ev.details || "";
        const matchesFilter = filterAction === "ALL" || action.toLowerCase().includes(filterAction.toLowerCase());
        const matchesSearch = !searchQuery ||
          action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [events, filterAction, searchQuery]);

  const getActionConfig = (action = "") => {
    const act = action.toUpperCase();
    if (act.includes("UPLOAD") || act.includes("INGEST")) {
      return {
        icon: Upload,
        color: "#3b82f6",
        badgeClass: "badge-blue",
        title: "Evidence Ingestion",
      };
    }
    if (act.includes("TEXT_TRACKER") || act.includes("TRACKER")) {
      return {
        icon: FileSearch,
        color: "#06b6d4",
        badgeClass: "badge-cyan",
        title: "Text Tracker Scan",
      };
    }
    if (act.includes("AI") || act.includes("ANALYSIS")) {
      return {
        icon: BrainCircuit,
        color: "#8b5cf6",
        badgeClass: "badge-purple",
        title: "AI Semantic Triage",
      };
    }
    if (act.includes("HASH") || act.includes("VERIF")) {
      return {
        icon: ShieldCheck,
        color: "#10b981",
        badgeClass: "badge-success",
        title: "Integrity Verification",
      };
    }
    return {
      icon: Activity,
      color: "#94a3b8",
      badgeClass: "badge-neutral",
      title: action || "Audit Event",
    };
  };

  if (loading) return <Loading label="Compiling chronological forensic timeline…" />;

  return (
    <section className="page-shell">
      {/* PAGE HEADER */}
      <div className="page-heading">
        <div>
          <button
            className="btn btn-ghost tracker-back-btn"
            onClick={() => navigate(`/cases/${caseId}`)}
          >
            <ArrowLeft size={16} /> Back to Case Overview
          </button>
          <p className="eyebrow">CHRONOLOGICAL EVENT LOG</p>
          <h1>Forensic Timeline & Activity Track</h1>
          <p>
            Reconstruct seizure, chain-of-custody, inspection, and analysis events in order of occurrence.
          </p>
        </div>
      </div>

      {error && <div className="error-card">{error}</div>}

      {/* FILTER CONTROLS */}
      <div className="card timeline-controls-bar">
        <div className="search-box">
          <Search size={15} className="text-secondary" />
          <input
            type="text"
            placeholder="Search timeline events or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="timeline-filter-buttons">
          <button
            className={`filter-pill ${filterAction === "ALL" ? "active" : ""}`}
            onClick={() => setFilterAction("ALL")}
          >
            All Events ({events.length})
          </button>
          <button
            className={`filter-pill ${filterAction === "UPLOAD" ? "active" : ""}`}
            onClick={() => setFilterAction("UPLOAD")}
          >
            Evidence Seized
          </button>
          <button
            className={`filter-pill ${filterAction === "TEXT_TRACKER" ? "active" : ""}`}
            onClick={() => setFilterAction("TEXT_TRACKER")}
          >
            Text Tracker
          </button>
          <button
            className={`filter-pill ${filterAction === "AI" ? "active" : ""}`}
            onClick={() => setFilterAction("AI")}
          >
            AI Analysis
          </button>
          <button
            className={`filter-pill ${filterAction === "VERIF" ? "active" : ""}`}
            onClick={() => setFilterAction("VERIF")}
          >
            Integrity Checks
          </button>
        </div>
      </div>

      {/* VERTICAL TIMELINE CONTAINER */}
      <div className="timeline-container">
        {filteredEvents.length > 0 ? (
          <div className="timeline-spine">
            {filteredEvents.map((ev, idx) => {
              const cfg = getActionConfig(ev.action || ev.event_type);
              const IconComp = cfg.icon;
              const ts = ev.timestamp || ev.created_at;

              return (
                <div key={ev._id || ev.id || idx} className="timeline-entry">
                  {/* Left: Timestamp */}
                  <div className="timeline-time">
                    <Clock size={13} className="text-secondary" />
                    <span className="time-date">
                      {ts ? new Date(ts).toLocaleDateString() : "—"}
                    </span>
                    <span className="time-exact">
                      {ts ? new Date(ts).toLocaleTimeString() : "—"}
                    </span>
                  </div>

                  {/* Center Node Icon */}
                  <div
                    className="timeline-node"
                    style={{
                      borderColor: cfg.color,
                      boxShadow: `0 0 12px ${cfg.color}40`,
                    }}
                  >
                    <IconComp size={15} style={{ color: cfg.color }} />
                  </div>

                  {/* Right: Card */}
                  <div className="timeline-card card">
                    <div className="timeline-card-header">
                      <span className={`badge ${cfg.badgeClass}`}>
                        {cfg.title}
                      </span>
                      <span className="timeline-actor">
                        <UserCheck size={13} /> {ev.user_id || ev.performed_by || "System Agent"}
                      </span>
                    </div>

                    <p className="timeline-description">
                      {ev.description || ev.details || "Forensic activity recorded."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card empty-state">
            <Activity size={48} className="text-secondary" />
            <h3>No Timeline Events Found</h3>
            <p>No activity records match the current filter selection.</p>
          </div>
        )}
      </div>
    </section>
  );
}
