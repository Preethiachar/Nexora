import React, { useState } from "react";
import { X, Sparkles, Send, Bot, User } from "lucide-react";
import { api } from "../services/api";

interface AIAssistantModalProps {
  onClose: () => void;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "👋 Hi! I am Nexora AI, your career and civic engagement copilot. How can I help you strengthen your profile, ideate for the Student Idea Marketplace, or optimize your resume today?",
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuestion;
    if (!q.trim()) return;

    const newMsgs: ChatMessage[] = [...messages, { sender: "user", text: q }];
    setMessages(newMsgs);
    setInputQuestion("");
    setIsLoading(true);

    try {
      const resp = await api.careerChat(q);
      setMessages([...newMsgs, { sender: "ai", text: resp.response }]);
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages([
        ...newMsgs,
        {
          sender: "ai",
          text: "I encountered a network hiccup, but remember: balancing academics with student civic initiatives is best done by anchoring course projects in real community challenges!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How do I balance academics with civic volunteering?",
    "What civic tech projects impress recruiters most?",
    "How do I optimize my resume for ATS screeners?",
    "Suggest a climate data project for the Marketplace",
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 640, height: 620, display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, #0a66c2 0%, #059669 100%)", color: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", color: "#ffffff" }}>Nexora AI Career & Civic Copilot</h3>
              <span style={{ fontSize: "0.74rem", opacity: 0.9 }}>
                Powered by Claude API & Scikit-Learn NLP
              </span>
            </div>
          </div>
          <button className="btn-ghost" style={{ color: "#ffffff" }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Chat History Stream */}
        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: 10,
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}
            >
              {m.sender === "ai" && (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: "var(--civic-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--civic)",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={16} />
                </div>
              )}

              <div
                style={{
                  backgroundColor: m.sender === "user" ? "var(--primary)" : "#f1f5f9",
                  color: m.sender === "user" ? "#ffffff" : "#1e293b",
                  padding: "10px 14px",
                  borderRadius: 14,
                  fontSize: "0.86rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>

              {m.sender === "user" && (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: "var(--primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                    flexShrink: 0,
                  }}
                >
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
              <div
                style={{
                  backgroundColor: "#f1f5f9",
                  padding: "10px 14px",
                  borderRadius: 14,
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                }}
              >
                Nexora AI is reflecting...
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: "0 18px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              className="badge-tag"
              style={{ cursor: "pointer", fontSize: "0.72rem", border: "1px solid #cbd5e1" }}
              onClick={() => handleSend(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ padding: 14, borderTop: "1px solid var(--divider)", display: "flex", gap: 8 }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Ask about resume keywords, civic projects, or interview prep..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: "0 16px" }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
