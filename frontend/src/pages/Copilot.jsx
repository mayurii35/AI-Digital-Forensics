import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MessagesSquare,
  Sparkles,
  Send,
  User,
  Bot,
  ArrowLeft,
  HelpCircle,
  Clock,
  Plus,
  History,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { askCopilot, fetchCaseById } from "../services/api.js";
import client from "../services/api.js";

// Helper API calls for session history
async function fetchSessions(caseId) {
  const res = await client.get(`/copilot/${caseId}/sessions`);
  return res.data.sessions || [];
}

async function fetchSessionMessages(caseId, sessionId) {
  const res = await client.get(`/copilot/${caseId}/sessions/${sessionId}`);
  return res.data;
}

async function deleteSession(caseId, sessionId) {
  await client.delete(`/copilot/${caseId}/sessions/${sessionId}`);
}

function formatTime(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch { return ""; }
}

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Greetings, Investigator. I am your AI Forensic Case Copilot. I have contextual awareness of all seized evidence, ML threat classifications, Text Tracker indicators, hash integrity records, and timeline events in this case. How can I assist your investigation?",
  timestamp: new Date().toISOString(),
};

export default function Copilot() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseInfo, setCaseInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // Load case info and session list on mount
  useEffect(() => {
    fetchCaseById(caseId).then(setCaseInfo).catch(() => {});
    loadSessions();
  }, [caseId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const s = await fetchSessions(caseId);
      setSessions(s);
    } catch {}
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([INITIAL_MESSAGE]);
    setError("");
  };

  const loadSession = async (sessionId) => {
    setLoadingHistory(true);
    setError("");
    try {
      const doc = await fetchSessionMessages(caseId, sessionId);
      setActiveSessionId(sessionId);
      const mapped = (doc.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
      setMessages([INITIAL_MESSAGE, ...mapped]);
    } catch {
      setError("Failed to load session history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await deleteSession(caseId, sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      if (activeSessionId === sessionId) startNewChat();
    } catch {}
  };

  const handleAsk = async (e, customQ = null) => {
    if (e) e.preventDefault();
    const query = (customQ || question).trim();
    if (!query) return;

    const userMsg = { role: "user", content: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const data = await askCopilot(caseId, query, activeSessionId);
      const assistantMsg = {
        role: "assistant",
        content: data.answer || "No response generated.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update active session ID (new session created on first message)
      if (!activeSessionId && data.session_id) {
        setActiveSessionId(data.session_id);
      }

      // Refresh session list in sidebar
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.detail || "AI Copilot query failed.");
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Summarize all forensic findings for this case",
    "Which evidence items have the highest risk scores?",
    "Were any IP addresses or credentials flagged?",
    "What immediate triage actions are recommended?",
    "List all ML-classified threats",
  ];

  return (
    <section className="page-shell">
      {/* HEADER */}
      <div className="page-heading">
        <div>
          <button
            className="ui-back-button"
            onClick={() => navigate(`/cases/${caseId}`)}
            style={{ marginBottom: 10 }}
          >
            <ArrowLeft size={15} /> Back to Case Overview
          </button>
          <p className="eyebrow">CONVERSATIONAL INVESTIGATION ASSISTANT</p>
          <h1>AI Forensic Copilot</h1>
          <p>
            Case: <strong>{caseInfo?.title || caseId}</strong> · Persistent contextual GenAI reasoning over all seized evidence.
          </p>
        </div>
      </div>

      {/* SUGGESTED PROMPTS */}
      <div className="copilot-suggestions-bar">
        <span className="suggestions-label">
          <HelpCircle size={14} className="text-accent" /> Quick Inquiries:
        </span>
        <div className="suggestions-pills">
          {suggestedQuestions.map((s, idx) => (
            <button
              key={idx}
              className="suggestion-pill"
              onClick={() => handleAsk(null, s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN COPILOT LAYOUT */}
      <div className="copilot-layout">

        {/* LEFT: SESSION HISTORY PANEL */}
        <div className="copilot-history-panel">
          <div className="copilot-history-header">
            <History size={14} className="text-accent" />
            <h4>Chat Sessions</h4>
          </div>

          <button className="copilot-new-chat-btn" onClick={startNewChat}>
            <Plus size={13} style={{ display: "inline", marginRight: 6 }} />
            New Investigation Chat
          </button>

          <div className="copilot-history-list">
            {sessions.length === 0 ? (
              <div className="copilot-history-empty">
                <MessagesSquare size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No past sessions yet.<br />Start a conversation to save history.</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.session_id}
                  className={`copilot-history-item ${activeSessionId === s.session_id ? "active" : ""}`}
                  onClick={() => loadSession(s.session_id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="copilot-history-q">{s.title || "Forensic Inquiry"}</div>
                      <div className="copilot-history-time">
                        {formatDate(s.last_updated)} · {formatTime(s.last_updated)}
                      </div>
                    </div>
                    <button
                      style={{ background: "none", border: "none", padding: "2px", cursor: "pointer", opacity: 0.4, flexShrink: 0 }}
                      onClick={(e) => handleDeleteSession(e, s.session_id)}
                      title="Delete session"
                    >
                      <Trash2 size={12} className="text-danger" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: MAIN CHAT PANEL */}
        <div className="copilot-main-panel">
          <div className="copilot-chat-card">
            <div className="copilot-messages-area" ref={scrollRef}>
              {loadingHistory ? (
                <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                  <span>Loading session history…</span>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`copilot-message-row ${m.role === "user" ? "message-user" : "message-assistant"}`}
                  >
                    <div className="message-avatar">
                      {m.role === "user" ? (
                        <User size={15} />
                      ) : (
                        <Bot size={16} className="text-accent" />
                      )}
                    </div>

                    <div className="message-bubble">
                      <div className="message-header">
                        <span className="message-author">
                          {m.role === "user" ? "Investigator" : "Forensic Copilot"}
                        </span>
                        <span className="message-time">
                          <Clock size={11} /> {formatTime(m.timestamp)}
                        </span>
                      </div>
                      <div className="message-text" style={{ whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="copilot-message-row message-assistant">
                  <div className="message-avatar">
                    <Bot size={16} className="text-accent" />
                  </div>
                  <div className="message-bubble thinking-bubble">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="thinking-text">Correlating case artifacts & reasoning with GenAI…</span>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="login-error" style={{ margin: "0 16px 8px" }}>{error}</div>}

            {/* INPUT BAR */}
            <form onSubmit={(e) => handleAsk(e)} className="copilot-input-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your forensic inquiry (e.g., 'What commands were executed in the logs?')..."
                className="copilot-text-input"
                disabled={loading}
              />
              <button
                type="submit"
                className="ui-button ui-button-primary copilot-send-btn"
                disabled={loading || !question.trim()}
              >
                <Send size={15} /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
