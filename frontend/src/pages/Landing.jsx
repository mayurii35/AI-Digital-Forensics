import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ShieldCheck,
  BrainCircuit,
  Search,
  FileCheck2,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  FileText,
  ShieldAlert,
  LayoutDashboard
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="landing-container">
      {/* ── TOP NAVIGATION ── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <div className="landing-brand-icon">
              <ShieldCheck size={22} className="text-blue" />
            </div>
            <div className="landing-brand-text">
              <span className="landing-brand-title">Forensiq<span className="text-blue">AI</span></span>
              <span className="landing-brand-subtitle">Digital Forensics Intelligence</span>
            </div>
          </div>

          <nav className="landing-nav-menu">
            <a href="#capabilities" className="landing-nav-item">Capabilities</a>
            <a href="#pipeline" className="landing-nav-item">Pipeline</a>
            <a href="#security" className="landing-nav-item">Security</a>
          </nav>

          <div className="landing-header-actions">
            {currentUser ? (
              <button
                id="landing-dashboard-btn"
                className="ui-button ui-button-primary"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
            ) : (
              <>
                <button
                  id="landing-signin-btn"
                  className="ui-button ui-button-ghost"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
                <button
                  id="landing-getstarted-btn"
                  className="ui-button ui-button-primary"
                  onClick={() => navigate("/signup")}
                >
                  Get Started <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="landing-hero-section">
        <div className="landing-hero-backdrop" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Sparkles size={14} className="landing-badge-spark" />
            <span>AI-Powered Digital Forensics & Investigation Suite</span>
          </div>

          <h1 className="landing-hero-headline">
            Defensible Digital Evidence <br />
            <span className="landing-gradient-text">Engineered for Intelligence.</span>
          </h1>

          <p className="landing-hero-description">
            Accelerate forensic triage with automated deepfake detection, line-level entity tracking,
            cryptographic SHA-256 chain-of-custody, and an interactive AI Case Copilot.
          </p>

          <div className="landing-hero-ctas">
            <button
              id="hero-launch-btn"
              className="ui-button ui-button-primary landing-btn-lg"
              onClick={() => navigate(currentUser ? "/dashboard" : "/login")}
            >
              Access Command Center <ArrowRight size={18} />
            </button>
            <a href="#capabilities" className="ui-button ui-button-ghost landing-btn-lg">
              Explore Capabilities
            </a>
          </div>

          {/* Hero Feature Teaser Bar */}
          <div className="landing-hero-metrics">
            <div className="landing-metric-pill">
              <ShieldCheck size={16} className="text-emerald" />
              <span>SHA-256 Verification</span>
            </div>
            <div className="landing-metric-pill">
              <BrainCircuit size={16} className="text-blue" />
              <span>Deepfake Neural Models</span>
            </div>
            <div className="landing-metric-pill">
              <Search size={16} className="text-cyan" />
              <span>Forensic Text Tracker</span>
            </div>
            <div className="landing-metric-pill">
              <Lock size={16} className="text-purple" />
              <span>Immutable Audit Logs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES GRID ── */}
      <section id="capabilities" className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-eyebrow">CORE CAPABILITIES</span>
          <h2>Forensic-Grade AI Architecture</h2>
          <p>Built specifically for criminal, corporate, and regulatory investigative workflows.</p>
        </div>

        <div className="landing-cards-grid">
          <div className="landing-card">
            <div className="landing-card-icon-wrap bg-blue-subtle text-blue">
              <BrainCircuit size={26} />
            </div>
            <h3>Deepfake & Synthetic Media Detection</h3>
            <p>
              Multimodal deep learning architectures scan seized video and image evidence to detect
              facial manipulation, generative artifacts, and audio synthetic cloning.
            </p>
            <div className="landing-card-tag">Computer Vision</div>
          </div>

          <div className="landing-card">
            <div className="landing-card-icon-wrap bg-cyan-subtle text-cyan">
              <Search size={26} />
            </div>
            <h3>Forensic Text Tracker & Entity NLP</h3>
            <p>
              Inspect forensic transcripts, chat logs, and seized documents with line-by-line entity extraction,
              PII identification, and threat indicator scoring.
            </p>
            <div className="landing-card-tag">NLP Intelligence</div>
          </div>

          <div className="landing-card">
            <div className="landing-card-icon-wrap bg-emerald-subtle text-emerald">
              <FileCheck2 size={26} />
            </div>
            <h3>Cryptographic Chain of Custody</h3>
            <p>
              Automated SHA-256 checksum generation upon ingestion with one-click verification modals
              guaranteeing zero evidentiary tampering throughout the lifecycle.
            </p>
            <div className="landing-card-tag">SHA-256 Integrity</div>
          </div>

          <div className="landing-card">
            <div className="landing-card-icon-wrap bg-purple-subtle text-purple">
              <Sparkles size={26} />
            </div>
            <h3>Context-Aware Case Copilot</h3>
            <p>
              Chat in natural language with an investigative AI assistant that maintains full context
              over all evidence files, timeline milestones, and suspect relationships.
            </p>
            <div className="landing-card-tag">Llama 3 / Groq Powered</div>
          </div>
        </div>
      </section>

      {/* ── INVESTIGATION PIPELINE ── */}
      <section id="pipeline" className="landing-section landing-pipeline-section">
        <div className="landing-section-header">
          <span className="landing-section-eyebrow">WORKFLOW PIPELINE</span>
          <h2>End-to-End Investigation Lifecycle</h2>
          <p>Defensible, auditable, and structured from crime scene ingestion to court report.</p>
        </div>

        <div className="landing-pipeline-grid">
          {[
            { step: "01", title: "Authenticate & Log In", desc: "Role-based JWT credential validation with all investigator operations timestamped." },
            { step: "02", title: "Open Investigation Dossier", desc: "Catalog matter title, crime classification, incident synopsis, and active status." },
            { step: "03", title: "Secure Evidence Ingestion", desc: "Upload media, documents, or memory dumps with instant cryptographic SHA-256 stamping." },
            { step: "04", title: "Automated AI Analysis", desc: "Run deepfake visual screening, metadata extraction, and text entity anomaly scoring." },
            { step: "05", title: "Correlate Graph & Timeline", desc: "Trace chronological evidence events and visualize multi-suspect entity graph relations." },
            { step: "06", title: "Generate Court-Ready Reports", desc: "Export structured executive summaries and defensible forensic findings into PDF." }
          ].map((item) => (
            <div key={item.step} className="landing-pipeline-card">
              <div className="landing-step-num">{item.step}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECURITY SECTION ── */}
      <section id="security" className="landing-section landing-security-section">
        <div className="landing-security-card">
          <div className="landing-security-text">
            <div className="landing-security-badge">
              <Lock size={15} /> <span>DEFENSIBLE STANDARDS</span>
            </div>
            <h2>Built to Satisfy Stringent Evidentiary Standards</h2>
            <p>
              Every API call, file hash check, analysis execution, and report compilation produces an immutable,
              searchable audit trail stored in our chain-of-custody ledger.
            </p>
            <ul className="landing-security-list">
              <li><CheckCircle2 size={16} className="text-emerald" /> Cryptographic SHA-256 verification on demand</li>
              <li><CheckCircle2 size={16} className="text-emerald" /> Role-based access control and session segregation</li>
              <li><CheckCircle2 size={16} className="text-emerald" /> Defensible court-ready documentation and exports</li>
            </ul>
          </div>
          <div className="landing-security-action">
            <button
              className="ui-button ui-button-primary landing-btn-lg"
              onClick={() => navigate("/login")}
            >
              Sign In to Platform <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-left">
            <div className="landing-brand">
              <ShieldCheck size={20} className="text-blue" />
              <span className="landing-brand-title">Forensiq<span className="text-blue">AI</span></span>
            </div>
            <p className="landing-footer-sub">Next-Generation AI Digital Forensics & Chain of Custody.</p>
            <span className="landing-footer-copy">© {new Date().getFullYear()} ForensiqAI. All rights reserved.</span>
          </div>

          <div className="landing-footer-right">
            <button
              className="ui-button ui-button-ghost"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="ui-button ui-button-primary"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
