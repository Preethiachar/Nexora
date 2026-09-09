import React, { useState } from "react";
import { X, Sparkles, Image, BarChart2, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";
import { UserSummary } from "../types";

interface CreatePostModalProps {
  currentUser: UserSummary | null;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
}) => {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("standard");
  const [mediaUrl, setMediaUrl] = useState("");
  const [tags, setTags] = useState("#CivicTech,#StudentInnovation");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["Yes", "No", "Needs Discussion"]);
  const [aiTopic, setAiTopic] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingAI(true);
    try {
      const resp = await api.generatePost(aiTopic, postType, "inspirational");
      setContent(resp.generated_post);
      setShowAIAssistant(false);
    } catch (err) {
      console.error("AI post generation error:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await api.createPost({
        content,
        post_type: postType,
        media_url: mediaUrl,
        tags,
        poll_question: postType === "poll" ? pollQuestion : "",
        poll_options: postType === "poll" ? pollOptions : [],
      });
      onPostCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={currentUser?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=modal"}
              alt={currentUser?.full_name}
              style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }}
            />
            <div>
              <h3 style={{ fontSize: "1rem" }}>{currentUser?.full_name}</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Posting to Nexora Student & Civic Community
              </span>
            </div>
          </div>

          <button className="btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Claude AI Assistant Shortcut banner */}
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color="#059669" />
                <span style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 600 }}>
                  Claude AI Post Assistant
                </span>
              </div>
              <button
                type="button"
                className="btn-outline-civic"
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                onClick={() => setShowAIAssistant(!showAIAssistant)}
              >
                {showAIAssistant ? "Close Assistant" : "Draft with AI"}
              </button>
            </div>

            {/* AI Generator Input */}
            {showAIAssistant && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px dashed #059669",
                  borderRadius: "var(--radius-md)",
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <label className="form-label">What would you like to post about?</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Completed a campus tree-planting drive, Looking for React volunteers..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-civic"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI ? "Drafting..." : "Generate"}
                  </button>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="What do you want to talk about? Share an initiative, student project, or reflection..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* Post Type Selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                className={`btn-ghost ${postType === "standard" ? "btn-outline" : ""}`}
                style={{ fontSize: "0.78rem" }}
                onClick={() => setPostType("standard")}
              >
                Regular Update
              </button>
              <button
                type="button"
                className={`btn-ghost ${postType === "civic_initiative" ? "btn-outline-civic" : ""}`}
                style={{ fontSize: "0.78rem" }}
                onClick={() => setPostType("civic_initiative")}
              >
                <CheckCircle2 size={14} color="#059669" />
                <span>Civic Initiative</span>
              </button>
              <button
                type="button"
                className={`btn-ghost ${postType === "poll" ? "btn-outline" : ""}`}
                style={{ fontSize: "0.78rem" }}
                onClick={() => setPostType("poll")}
              >
                <BarChart2 size={14} />
                <span>Create Poll</span>
              </button>
            </div>

            {/* Poll Configuration */}
            {postType === "poll" && (
              <div className="poll-container">
                <div className="form-group">
                  <label className="form-label">Poll Question</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ask the student community a question..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    required
                  />
                </div>
                <label className="form-label">Poll Options</label>
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    className="form-input"
                    style={{ marginBottom: 6 }}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...pollOptions];
                      newOpts[i] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Image / Media URL */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Image size={14} />
                <span>Add Image URL (Optional)</span>
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Hashtags</label>
              <input
                type="text"
                className="form-input"
                placeholder="#CivicTech,#Volunteering"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Post to Feed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
