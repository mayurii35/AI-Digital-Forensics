import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Shield,
  Upload,
  Search,
  BrainCircuit,
  Activity,
  GitBranch,
  MessagesSquare,
  ChevronRight,
  ShieldAlert,
  Network
} from "lucide-react";

const globalLinks = [
  [LayoutDashboard, "Dashboard", "/dashboard"],
  [FolderOpen, "All Cases", "/cases"],
  [FileText, "Reports", "/reports"],
  [Shield, "Audit Logs", "/audit-logs"],
];

export default function Sidebar() {
  const location = useLocation();

  // Extract caseId from path if user is browsing within a case
  // Paths like /cases/:caseId or /cases/:caseId/evidence, etc.
  const caseMatch = location.pathname.match(/^\/cases\/([a-zA-Z0-9_-]+)/);
  const currentCaseId = caseMatch && caseMatch[1] !== "create" ? caseMatch[1] : null;

  const caseLinks = currentCaseId
    ? [
        [FolderOpen, "Case Overview", `/cases/${currentCaseId}`],
        [Upload, "Evidence Vault", `/cases/${currentCaseId}/evidence`],
        [Search, "Text Tracker", `/cases/${currentCaseId}/text-tracker`, true],
        [BrainCircuit, "AI Analysis", `/cases/${currentCaseId}/analysis`],
        [Network, "Network Forensics", `/cases/${currentCaseId}/network-forensics`],
        [Activity, "Timeline", `/cases/${currentCaseId}/timeline`],
        [GitBranch, "Evidence Graph", `/cases/${currentCaseId}/graph`],
        [MessagesSquare, "AI Copilot", `/cases/${currentCaseId}/copilot`],
      ]
    : [];

  return (
    <nav className="sidebar">
      {/* GLOBAL NAVIGATION SECTION */}
      <div className="sidebar-section">
        <span className="sidebar-section-title">NAVIGATION</span>
        <div className="sidebar-links-group">
          {globalLinks.map(([Icon, label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " sidebar-link-active" : "")
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* ACTIVE CASE DOSSIER SECTION */}
      {currentCaseId && (
        <div className="sidebar-section sidebar-case-context">
          <div className="sidebar-section-title-row">
            <span className="sidebar-section-title">ACTIVE CASE</span>
            <span className="case-id-badge">
              {currentCaseId.slice(0, 6)}…
            </span>
          </div>

          <div className="sidebar-links-group">
            {caseLinks.map(([Icon, label, to, isFlagship]) => (
              <NavLink
                key={to}
                to={to}
                end={to === `/cases/${currentCaseId}`}
                className={({ isActive }) =>
                  "sidebar-link" +
                  (isActive ? " sidebar-link-active" : "") +
                  (isFlagship ? " sidebar-flagship-link" : "")
                }
              >
                <Icon size={17} />
                <span>{label}</span>
                {isFlagship && <span className="flagship-dot" title="Core Feature" />}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* SIDEBAR FOOTER STATUS */}
      <div className="sidebar-footer">
        <div className="sidebar-status-box">
          <div className="status-indicator-dot" />
          <div>
            <span className="status-label">Engine Online</span>
            <small className="status-sub">Groq & SHA-256 Active</small>
          </div>
        </div>
      </div>
    </nav>
  );
}
