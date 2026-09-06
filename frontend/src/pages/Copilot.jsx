import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { askCopilot } from "../services/api.js";

export default function Copilot() {
  const { caseId } = useParams();
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I'm your case copilot. Ask me anything about this case's evidence and findings." },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleAsk = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const data = await askCopilot(caseId, trimmed);
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer || "No answer returned." }]);
    } catch (err) {
      setError(err.response?.data?.detail || "Copilot failed to respond.");
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Summarize findings",
    "What is the highest risk evidence?",
    "List all suspicious indicators",
  ];

  return (
    <div>
      <h2>AI Copilot</h2>

      <div className="chip-list" style={{ marginTop: 0, marginBottom: "14px" }}>
        {suggestedQuestions.map((suggestion) => (
          <button key={suggestion} className="indicator-chip" onClick={() => setQuestion(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "12px" }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--accent)" : "var(--bg-panel-alt)",
                color: m.role === "user" ? "#fff" : "var(--text-primary)",
                padding: "10px 14px",
                borderRadius: "12px",
                maxWidth: "75%",
                animation: "fadeInUp 0.25s ease",
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Copilot is thinking...
            </div>
          )}
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleAsk} style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this case..."
            style={{ flex: 1 }}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
