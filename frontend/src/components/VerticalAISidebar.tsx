import React, { useState } from "react";
import { 
  Sparkles, X, ChevronRight, MessageSquare, 
  PenTool, Target, Lightbulb, Send, Bot, User, Copy, Check 
} from "lucide-react";
import { api } from "../services/api";

interface VerticalAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export const VerticalAISidebar: React.FC<VerticalAISidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "draft" | "ats" | "ideas">("chat");

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "👋 Hi! I am your vertical Nexora AI Copilot. Ask me about finding civic collaborators, interview prep, or optimizing your resume!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Draft State
  const [draftTopic, setDraftTopic] = useState("");
  const [draftResult, setDraftResult] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // ATS State
  const [atsSnippet, setAtsSnippet] = useState("");
  const [atsTargetRole, setAtsTargetRole] = useState("Civic Tech Software Fellow");
  const [atsQuickScore, setAtsQuickScore] = useState<any | null>(null);
  const [isScoringATS, setIsScoringATS] = useState(false);

  // Idea Spark State
  const [ideaDomain, setIdeaDomain] = useState("Climate Action & Air Quality");
  const [sparkedIdeas, setSparkedIdeas] = useState<string[]>([]);
  const [isSparking, setIsSparking] = useState(false);

  // Handlers
  const handleSendChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const newMsgs: ChatMessage[] = [...chatMessages, { sender: "user", text: textToSend }];
    setChatMessages(newMsgs);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const resp = await api.careerChat(textToSend);
      setChatMessages([...newMsgs, { sender: "ai", text: resp.response }]);
    } catch (err) {
      setChatMessages([
        ...newMsgs,
        {
          sender: "ai",
          text: "I am ready to help you navigate tech opportunities and civic projects! Try asking about resume optimization or idea pitching.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!draftTopic.trim() || isDrafting) return;
    setIsDrafting(true);
    setCopiedDraft(false);
    try {
      const resp = await api.generatePost(draftTopic, "civic_initiative", "inspirational");
      setDraftResult(resp.generated_post);
    } catch (err) {
      console.error("Draft error:", err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(draftResult);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleQuickATSCheck = async () => {
    if (!atsSnippet.trim() || isScoringATS) return;
    setIsScoringATS(true);
    try {
      const res = await api.screenResume({
        resume_text: atsSnippet,
        job_title: atsTargetRole,
        job_description: `Role in ${atsTargetRole}. Requires Python, React, and community civic organizing skills.`,
      });
      setAtsQuickScore(res);
    } catch (err) {
      console.error("Quick ATS error:", err);
    } finally {
      setIsScoringATS(false);
    }
  };

  const handleSparkIdeas = () => {
    setIsSparking(true);
    setTimeout(() => {
      if (ideaDomain.includes("Climate")) {
        setSparkedIdeas([
          "EcoTransit: Crowdsourced student bicycle hazard & safe route visualizer",
          "CampusCanopy: Hyperlocal tree growth & carbon sequestration tracker",
          "SolarDorm: Peer energy reduction challenges across university halls",
        ]);
      } else {
        setSparkedIdeas([
          "CivicVerify: Student volunteer hours ledger for academic credit",
          "SeniorConnect: Tech literacy workshops paired with college students",
          "FoodBridge: Excess cafeteria meal redistribution dispatcher",
        ]);
      }
      setIsSparking(false);
    }, 600);
  };

  return (
    <>
      {/* Docked Vertical Trigger Tab when Closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          style={{
            position: "fixed",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 999,
            backgroundColor: "var(--civic)",
            color: "#ffffff",
            padding: "14px 10px",
            borderRadius: "12px 0 0 12px",
            boxShadow: "-3px 4px 16px rgba(5, 150, 105, 0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            border: "none",
            writingMode: "vertical-rl",
            letterSpacing: "0.04em",
            fontWeight: 700,
            fontSize: "0.82rem",
            transition: "all 0.2s ease",
          }}
          title="Open Vertical Nexora AI Copilot"
        >
          <div style={{ transform: "rotate(90deg)" }}>
            <Sparkles size={16} />
          </div>
          <span>NEXORA AI COPILOT</span>
        </button>
      )}

      {/* Slide-in Vertical Sidebar Panel */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          backgroundColor: "#ffffff",
          boxShadow: isOpen ? "-6px 0 24px rgba(0, 0, 0, 0.15)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid var(--card-border)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            background: "linear-gradient(135deg, #0a66c2 0%, #059669 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.98rem", fontWeight: 700, color: "#fff" }}>
                Nexora AI Copilot
              </h3>
              <span style={{ fontSize: "0.68rem", opacity: 0.9 }}>
                Vertical Sidecar • Claude & NLP
              </span>
            </div>
          </div>

          <button
            className="btn-ghost"
            style={{ color: "#ffffff", padding: 6 }}
            onClick={onToggle}
            title="Collapse AI Panel"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Vertical Tool Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderBottom: "1px solid var(--divider)",
            backgroundColor: "#f8fafc",
          }}
        >
          <button
            type="button"
            style={{
              padding: "10px 4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: activeTab === "chat" ? "var(--primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "chat" ? "2.5px solid var(--primary)" : "none",
            }}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={15} />
            <span>Mentor</span>
          </button>

          <button
            type="button"
            style={{
              padding: "10px 4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: activeTab === "draft" ? "var(--civic)" : "var(--text-secondary)",
              borderBottom: activeTab === "draft" ? "2.5px solid var(--civic)" : "none",
            }}
            onClick={() => setActiveTab("draft")}
          >
            <PenTool size={15} />
            <span>Post AI</span>
          </button>

          <button
            type="button"
            style={{
              padding: "10px 4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: activeTab === "ats" ? "#6366f1" : "var(--text-secondary)",
              borderBottom: activeTab === "ats" ? "2.5px solid #6366f1" : "none",
            }}
            onClick={() => setActiveTab("ats")}
          >
            <Target size={15} />
            <span>ATS</span>
          </button>

          <button
            type="button"
            style={{
              padding: "10px 4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: activeTab === "ideas" ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: activeTab === "ideas" ? "2.5px solid var(--accent)" : "none",
            }}
            onClick={() => setActiveTab("ideas")}
          >
            <Lightbulb size={15} />
            <span>Spark</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* TAB 1: Chat Mentor */}
          {activeTab === "chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {/* Message List */}
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      maxWidth: "90%",
                    }}
                  >
                    {msg.sender === "ai" && (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          backgroundColor: "var(--civic-light)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--civic)",
                          flexShrink: 0,
                        }}
                      >
                        <Bot size={14} />
                      </div>
                    )}
                    <div
                      style={{
                        backgroundColor: msg.sender === "user" ? "var(--primary)" : "#f1f5f9",
                        color: msg.sender === "user" ? "#ffffff" : "#1e293b",
                        padding: "8px 12px",
                        borderRadius: 12,
                        fontSize: "0.82rem",
                        lineHeight: 1.45,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", paddingLeft: 34 }}>
                    Claude is reflecting...
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div style={{ padding: "6px 12px", display: "flex", gap: 4, flexWrap: "wrap", borderTop: "1px solid var(--divider)" }}>
                <button
                  type="button"
                  className="badge-tag"
                  style={{ fontSize: "0.68rem", cursor: "pointer" }}
                  onClick={() => handleSendChat(undefined, "How do I highlight civic volunteering on my tech resume?")}
                >
                  📄 Resume tips
                </button>
                <button
                  type="button"
                  className="badge-tag"
                  style={{ fontSize: "0.68rem", cursor: "pointer" }}
                  onClick={() => handleSendChat(undefined, "Give me an opening hook for my post on campus sustainability")}
                >
                  🚀 Post hook
                </button>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendChat}
                style={{ padding: "10px 12px", borderTop: "1px solid var(--divider)", display: "flex", gap: 6 }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: "8px 10px", fontSize: "0.82rem" }}
                  placeholder="Ask your AI Copilot..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: "0 12px" }}>
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Post Drafter */}
          {activeTab === "draft" && (
            <div style={{ padding: 16 }}>
              <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700, marginBottom: 8 }}>
                AI Social Post Drafter
              </h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                Enter a topic or initiative to generate a polished, professional LinkedIn-style update.
              </p>

              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Launched waste mapping app with 20 student volunteers"
                  value={draftTopic}
                  onChange={(e) => setDraftTopic(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-civic"
                style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}
                onClick={handleGenerateDraft}
                disabled={isDrafting}
              >
                <Sparkles size={14} />
                <span>{isDrafting ? "Drafting with Claude..." : "Generate Post"}</span>
              </button>

              {draftResult && (
                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--civic)" }}>
                      Generated Draft
                    </span>
                    <button
                      className="btn-ghost"
                      style={{ padding: "3px 8px", fontSize: "0.72rem" }}
                      onClick={handleCopyDraft}
                    >
                      {copiedDraft ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                      <span>{copiedDraft ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p style={{ fontSize: "0.8rem", lineHeight: 1.45, whiteSpace: "pre-wrap", color: "#334155" }}>
                    {draftResult}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Quick ATS Score */}
          {activeTab === "ats" && (
            <div style={{ padding: 16 }}>
              <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700, marginBottom: 8 }}>
                Quick ATS Match Screener
              </h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                Paste a resume snippet to check keyword alignment against a target role.
              </p>

              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={atsTargetRole}
                  onChange={(e) => setAtsTargetRole(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resume Snippet / Skills</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Python, React, FastAPI, Volunteer Project Lead..."
                  value={atsSnippet}
                  onChange={(e) => setAtsSnippet(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}
                onClick={handleQuickATSCheck}
                disabled={isScoringATS}
              >
                <Target size={14} />
                <span>{isScoringATS ? "Analyzing..." : "Check ATS Match"}</span>
              </button>

              {atsQuickScore && (
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "#166534" }}>
                      ATS Score: {atsQuickScore.ats_score}%
                    </span>
                    <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.68rem" }}>
                      Scikit-Learn NLP
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Matched Keywords:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {atsQuickScore.matched_skills.map((s: string, i: number) => (
                        <span key={i} className="badge-tag badge-tag-civic" style={{ fontSize: "0.68rem", padding: "1px 5px" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Student Idea Spark */}
          {activeTab === "ideas" && (
            <div style={{ padding: 16 }}>
              <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700, marginBottom: 8 }}>
                Student Idea Spark
              </h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                Need inspiration for your next civic pitch in the Student Idea Marketplace?
              </p>

              <div className="form-group">
                <label className="form-label">Domain Area</label>
                <select
                  className="form-select"
                  value={ideaDomain}
                  onChange={(e) => setIdeaDomain(e.target.value)}
                >
                  <option value="Climate Action & Air Quality">Climate Action & Air Quality</option>
                  <option value="Digital Safety & Civic Tech">Digital Safety & Civic Tech</option>
                  <option value="Food Security & Surplus">Food Security & Surplus</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-civic"
                style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}
                onClick={handleSparkIdeas}
                disabled={isSparking}
              >
                <Lightbulb size={14} />
                <span>{isSparking ? "Sparking concepts..." : "Generate Project Ideas"}</span>
              </button>

              {sparkedIdeas.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sparkedIdeas.map((idea, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 6,
                        fontSize: "0.78rem",
                        lineHeight: 1.4,
                        color: "#92400e",
                      }}
                    >
                      💡 {idea}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
