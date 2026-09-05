import React from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    num: "01",
    title: "Login Securely",
    desc: "Investigators sign in with role-based JWT authentication — access is restricted and every action is logged.",
  },
  {
    num: "02",
    title: "Create a Case",
    desc: "Start a new investigation case with a title, description, and status to organize all related evidence.",
  },
  {
    num: "03",
    title: "Upload Evidence",
    desc: "Upload images, videos, or documents. Each file is hashed with SHA-256 to guarantee it hasn't been tampered with.",
  },
  {
    num: "04",
    title: "AI Analysis Runs",
    desc: "Deepfake detection (deep learning), entity extraction, and anomaly flagging run automatically on the evidence.",
  },
  {
    num: "05",
    title: "Explore Findings",
    desc: "Review results across NLP, ML, and DL tabs, trace events on a timeline, and view evidence relationships in a graph.",
  },
  {
    num: "06",
    title: "Ask the Copilot",
    desc: "Chat with an AI copilot that has full context of the case to answer investigative questions instantly.",
  },
  {
    num: "07",
    title: "Generate Report",
    desc: "Produce a structured, professional PDF report summarizing findings, ready for submission or review.",
  },
  {
    num: "08",
    title: "Audit Trail",
    desc: "Every action — login, upload, analysis, report generation — is permanently logged for accountability.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* ---------- Nav ---------- */}
      <header className="landing-nav">
        <div className="landing-logo-mark">
          <svg className="nav-logo-svg" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f8cff" />
                <stop offset="100%" stopColor="#35d488" />
              </linearGradient>
            </defs>
            <path
              d="M20 3 L34 9 L34 19 C34 27 28 33 20 37 C12 33 6 27 6 19 L6 9 Z"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth="2"
            />
            <circle cx="18" cy="17" r="6" fill="none" stroke="url(#logoGrad)" strokeWidth="2" />
            <line x1="22.5" y1="21.5" x2="27" y2="26" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="logo-text">
            AI <span className="logo-text-accent">Forensics</span>
          </span>
        </div>
        <nav className="landing-nav-links">
          <a href="#how-it-works" className="nav-link-btn">
            How It Works
          </a>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Login
          </button>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true">
          {/* Floating Hexagonal Particles - Left Side */}
          <div className="floating-icons left-icons">
            <div className="float-icon icon-1" style={{ top: '10%', left: '5%' }}>
              <div className="hex-particle" />
            </div>
            <div className="float-icon icon-2" style={{ top: '35%', left: '8%' }}>
              <div className="hex-particle" />
            </div>
            <div className="float-icon icon-3" style={{ top: '60%', left: '3%' }}>
              <div className="hex-particle" />
            </div>
          </div>

          {/* Floating Hexagonal Particles - Right Side */}
          <div className="floating-icons right-icons">
            <div className="float-icon icon-4" style={{ top: '15%', right: '5%' }}>
              <div className="hex-particle" />
            </div>
            <div className="float-icon icon-5" style={{ top: '45%', right: '8%' }}>
              <div className="hex-particle" />
            </div>
            <div className="float-icon icon-6" style={{ top: '70%', right: '4%' }}>
              <div className="hex-particle" />
            </div>
          </div>

          {/* Connecting Lines/Network */}
          <svg className="connection-lines" viewBox="0 0 1920 1080">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(53, 212, 136, 0)" />
                <stop offset="50%" stopColor="rgba(53, 212, 136, 0.8)" />
                <stop offset="100%" stopColor="rgba(53, 212, 136, 0)" />
              </linearGradient>
            </defs>
            <polyline className="animated-line line-1" points="100,100 400,300 900,400" />
            <polyline className="animated-line line-2" points="1820,150 1500,400 900,500" />
            <polyline className="animated-line line-3" points="150,600 500,450 900,500" />
            <polyline className="animated-line line-4" points="1800,700 1400,550 900,600" />
          </svg>

          {/* Glowing Orbs */}
          <div className="glow-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>

          {/* Circuit Pattern Overlay */}
          <div className="circuit-pattern" />
        </div>

        <div className="landing-hero-content-wrapper">
          {/* Left Side - Text Content */}
          <div className="landing-hero-text">
            <span className="landing-badge">
              <span className="badge-icon">🔐</span> Digital Evidence 
              <span className="badge-separator">•</span> 
              <span className="badge-icon">🤖</span> AI-Assisted 
              <span className="badge-separator">•</span> 
              <span className="badge-icon">🔍</span> Forensics Platform
            </span>
            <h1>
              Investigate <span className="gradient-text-blue">Digital Evidence</span> <br /> 
              with <span className="gradient-text-green">AI-Powered</span> Precision
            </h1>
            <p>
              Upload evidence, detect deepfakes, extract entities, trace timelines, and
              generate investigation reports — all backed by secure, auditable workflows.
            </p>
            <div className="landing-hero-actions">
              <button className="btn btn-primary btn-hero" onClick={() => navigate("/login")}>
                <span className="btn-icon">🚀</span>
                Get Started → Login
              </button>
              <a href="#how-it-works" className="btn btn-ghost btn-hero">
                <span className="btn-icon">📖</span>
                See How It Works
              </a>
            </div>
          </div>

          {/* Right Side - Animated Laptop + Forensic AI Illustration */}
          <div className="landing-hero-image-container">
            <div className="robot-glow-bg" />
            <svg className="laptop-illustration" viewBox="0 0 500 460" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="screenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(79, 140, 255, 0.9)" />
                  <stop offset="100%" stopColor="rgba(53, 212, 136, 0.9)" />
                </linearGradient>
                <linearGradient id="laptopBody" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1c212b" />
                  <stop offset="100%" stopColor="#0f1115" />
                </linearGradient>
                <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(79, 140, 255, 0.25)" />
                  <stop offset="100%" stopColor="rgba(53, 212, 136, 0.15)" />
                </linearGradient>
              </defs>

              {/* Head silhouette in background */}
              <g className="head-silhouette">
                <path
                  d="M 250 40
                     C 310 40 350 85 350 140
                     C 350 165 342 185 330 200
                     L 340 215
                     C 345 220 342 228 335 228
                     L 322 228
                     C 318 245 305 258 288 265
                     L 288 290
                     L 258 290
                     L 258 268
                     C 220 262 195 232 192 190
                     C 175 188 165 175 165 158
                     C 165 145 172 135 182 130
                     C 188 78 215 40 250 40 Z"
                  fill="url(#headGradient)"
                  stroke="rgba(53, 212, 136, 0.4)"
                  strokeWidth="1.5"
                />
                {/* Circuit lines inside head */}
                <path className="head-circuit hc-1" d="M 220 90 L 220 130 L 260 130 L 260 160" />
                <path className="head-circuit hc-2" d="M 290 100 L 290 140 L 270 140" />
                <circle className="head-node hn-1" cx="220" cy="90" r="4" />
                <circle className="head-node hn-2" cx="260" cy="160" r="4" />
                <circle className="head-node hn-3" cx="290" cy="100" r="4" />
              </g>

              {/* Magnifying glass icon (forensic theme) over the head */}
              <g className="magnifier-icon">
                <circle cx="255" cy="105" r="22" fill="none" stroke="rgba(255, 184, 79, 0.9)" strokeWidth="4" />
                <line x1="271" y1="121" x2="288" y2="138" stroke="rgba(255, 184, 79, 0.9)" strokeWidth="5" strokeLinecap="round" />
                <circle className="magnifier-scan-dot" cx="255" cy="105" r="10" fill="rgba(255,184,79,0.15)" />
              </g>

              {/* Circuit lines branching outward */}
              <g className="laptop-circuits">
                <path className="circuit-path cpath-1" d="M 250 260 L 250 340 L 60 340" />
                <path className="circuit-path cpath-2" d="M 250 260 L 250 340 L 440 340" />
                <path className="circuit-path cpath-3" d="M 170 300 L 60 300 L 60 240" />
                <path className="circuit-path cpath-4" d="M 330 300 L 440 300 L 440 240" />
                <path className="circuit-path cpath-5" d="M 200 400 L 200 440 L 90 440" />
                <path className="circuit-path cpath-6" d="M 300 400 L 300 440 L 410 440" />
              </g>

              {/* Circuit nodes */}
              <circle className="circuit-dot dot-1" cx="60" cy="340" r="6" />
              <circle className="circuit-dot dot-2" cx="440" cy="340" r="6" />
              <circle className="circuit-dot dot-3" cx="60" cy="240" r="6" />
              <circle className="circuit-dot dot-4" cx="440" cy="240" r="6" />
              <circle className="circuit-dot dot-5" cx="90" cy="440" r="6" />
              <circle className="circuit-dot dot-6" cx="410" cy="440" r="6" />

              {/* Fingerprint accent icon (forensic theme), left of laptop */}
              <g className="fingerprint-icon">
                <circle cx="70" cy="180" r="26" fill="none" stroke="rgba(53,212,136,0.5)" strokeWidth="2" />
                <path className="fp-ring fp-1" d="M 55 180 a 15 15 0 1 1 30 0" fill="none" stroke="rgba(53,212,136,0.8)" strokeWidth="2" />
                <path className="fp-ring fp-2" d="M 60 182 a 10 10 0 1 1 20 0" fill="none" stroke="rgba(79,140,255,0.8)" strokeWidth="2" />
                <path className="fp-ring fp-3" d="M 65 184 a 5 5 0 1 1 10 0" fill="none" stroke="rgba(53,212,136,0.9)" strokeWidth="2" />
              </g>

              {/* Laptop screen */}
              <rect x="160" y="200" width="180" height="120" rx="8" fill="url(#laptopBody)" stroke="rgba(79,140,255,0.5)" strokeWidth="2" />
              <rect x="172" y="210" width="156" height="100" rx="4" fill="#0a0c10" />
              <rect className="screen-fill" x="172" y="210" width="156" height="100" rx="4" fill="url(#screenGlow)" opacity="0.15" />

              {/* Code / scan-result lines on screen */}
              <rect className="code-line code-1" x="182" y="222" width="80" height="4" rx="2" fill="rgba(53,212,136,0.8)" />
              <rect className="code-line code-2" x="182" y="234" width="120" height="4" rx="2" fill="rgba(79,140,255,0.6)" />
              <rect className="code-line code-3" x="182" y="246" width="60" height="4" rx="2" fill="rgba(255,184,79,0.7)" />
              <rect className="code-line code-4" x="182" y="258" width="100" height="4" rx="2" fill="rgba(79,140,255,0.8)" />
              <rect className="code-line code-5" x="182" y="270" width="70" height="4" rx="2" fill="rgba(53,212,136,0.5)" />

              {/* Scanning beam on screen */}
              <rect className="screen-scan" x="172" y="210" width="156" height="2" fill="rgba(255,255,255,0.9)" />

              {/* Laptop base/keyboard */}
              <path d="M 130 320 L 370 320 L 395 370 L 105 370 Z" fill="url(#laptopBody)" stroke="rgba(79,140,255,0.4)" strokeWidth="2" />
              <rect x="220" y="340" width="60" height="6" rx="3" fill="rgba(79,140,255,0.4)" />
              <ellipse className="trackpad-glow" cx="250" cy="350" rx="25" ry="8" fill="rgba(53,212,136,0.3)" />
            </svg>
          </div>
        </div>
      </section>

      {/* ---------- How It Works ---------- */}
      <section id="how-it-works" className="landing-steps">
        {/* Animated Circuit Lines Background */}
        <div className="steps-circuit-bg" aria-hidden="true">
          <svg className="circuit-svg" viewBox="0 0 1200 800">
            {/* Horizontal Lines */}
            <line className="circuit-line line-1" x1="0" y1="100" x2="1200" y2="100" />
            <line className="circuit-line line-2" x1="0" y1="300" x2="1200" y2="300" />
            <line className="circuit-line line-3" x1="0" y1="500" x2="1200" y2="500" />
            <line className="circuit-line line-4" x1="0" y1="700" x2="1200" y2="700" />
            {/* Vertical Connectors */}
            <line className="circuit-connector conn-1" x1="300" y1="100" x2="300" y2="300" />
            <line className="circuit-connector conn-2" x1="600" y1="300" x2="600" y2="500" />
            <line className="circuit-connector conn-3" x1="900" y1="100" x2="900" y2="500" />
            <line className="circuit-connector conn-4" x1="450" y1="500" x2="450" y2="700" />
            {/* Circuit Nodes */}
            <circle className="circuit-node node-1" cx="300" cy="100" r="5" />
            <circle className="circuit-node node-2" cx="600" cy="300" r="5" />
            <circle className="circuit-node node-3" cx="900" cy="500" r="5" />
            <circle className="circuit-node node-4" cx="450" cy="700" r="5" />
          </svg>
        </div>

        <h2>How It Works</h2>
        <p className="landing-section-sub">
          From login to final report — every step in the investigation pipeline.
        </p>
        <div className="steps-grid">
          {STEPS.map((step, index) => (
            <div key={step.num} className="step-card-new" data-step={step.num}>
              <div className="step-glow-effect" />
              <div className="step-header">
                <div className="step-icon-wrapper">
                  <span className="step-icon">
                    {index === 0 && "🔐"}
                    {index === 1 && "📁"}
                    {index === 2 && "📤"}
                    {index === 3 && "🤖"}
                    {index === 4 && "📊"}
                    {index === 5 && "💬"}
                    {index === 6 && "📄"}
                    {index === 7 && "🔍"}
                  </span>
                </div>
                <span className="step-number">{step.num}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <div className="step-corner corner-tl" />
              <div className="step-corner corner-tr" />
              <div className="step-corner corner-bl" />
              <div className="step-corner corner-br" />
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="landing-features">
        <h2>Core Capabilities</h2>
        <div className="grid grid-cols-3">
          <div className="card feature-card">
            <div className="feature-icon">
              <div className="icon-circle">🎭</div>
              <div className="icon-ripple" />
            </div>
            <h3 style={{ marginTop: 0 }}>Deepfake Detection</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Deep learning model (ResNet50/EfficientNet) flags manipulated images and videos with high accuracy.
            </p>
            <div className="feature-badge">Deep Learning</div>
          </div>
          <div className="card feature-card" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon">
              <div className="icon-circle">🧠</div>
              <div className="icon-ripple" />
            </div>
            <h3 style={{ marginTop: 0 }}>LLM-Powered Intelligence</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Entity extraction, crime classification, explainability, copilot Q&A, and automated report writing.
            </p>
            <div className="feature-badge">AI Assistant</div>
          </div>
          <div className="card feature-card" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon">
              <div className="icon-circle">🔐</div>
              <div className="icon-ripple" />
            </div>
            <h3 style={{ marginTop: 0 }}>Secure & Auditable</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              JWT-based role auth, SHA-256 evidence hashing, and a comprehensive audit trail of every action.
            </p>
            <div className="feature-badge">Forensic-Grade</div>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <span className="landing-logo-dot" />
              <span>AI Digital Forensics</span>
            </div>
            <p>© {new Date().getFullYear()} AI Digital Forensics Platform</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Secure • Intelligent • Auditable
            </p>
          </div>
          <div className="footer-right">
            <button className="btn btn-primary btn-pulse" onClick={() => navigate("/login")}>
              🚀 Login to Continue
            </button>
          </div>
        </div>
        <div className="footer-wave" />
      </footer>
    </div>
  );
}
