import React, { useState } from "react";
import { Users, CheckCircle, Send, ShieldCheck, PlusCircle, Award, Sparkles, MessageSquare, X, Check } from "lucide-react";
import { StudentIdea, MentorInfo } from "../types";
import { api } from "../services/api";

interface IdeaCardProps {
  idea: StudentIdea;
  onRefresh: () => void;
  onNavigate?: (tab: string) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onRefresh, onNavigate }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [roleTitle, setRoleTitle] = useState("Frontend Developer");
  const [applicationNote, setApplicationNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mentor Selection State
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorsList, setMentorsList] = useState<MentorInfo[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [isSelectingMentor, setIsSelectingMentor] = useState(false);

  const handleOpenMentorModal = async () => {
    setShowMentorModal(true);
    setLoadingMentors(true);
    try {
      const mentors = await api.getMentors();
      setMentorsList(mentors);
    } catch (err) {
      console.error("Failed to fetch mentors:", err);
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleSelectMentor = async (mentorId: number) => {
    setIsSelectingMentor(true);
    try {
      await api.selectIdeaMentor(idea.id, mentorId);
      setShowMentorModal(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to select mentor:", err);
    } finally {
      setIsSelectingMentor(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.joinIdeaTeam(idea.id, {
        role_title: roleTitle,
        application_note: applicationNote,
      });
      setShowApplyModal(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to apply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (memberId: number, status: string) => {
    try {
      await api.updateMemberStatus(idea.id, memberId, status);
      onRefresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const acceptedMembers = idea.members.filter((m) => m.status === "accepted");
  const pendingMembers = idea.members.filter((m) => m.status === "pending");

  return (
    <div className="nexora-card idea-card">
      <div>
        {/* Cause Tag & Spot Counter */}
        <div className="idea-header">
          <span className="badge-tag badge-tag-civic">{idea.cause_tag}</span>
          <span className="team-slots-pill">
            <Users size={12} style={{ display: "inline", marginRight: 4 }} />
            {idea.spots_remaining > 0 ? `${idea.spots_remaining} Spots Open` : "Team Full"}
          </span>
        </div>

        {/* Title & Author */}
        <h3 className="idea-title">{idea.title}</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <img
            src={idea.author.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=founder"}
            alt={idea.author.full_name}
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{idea.author.full_name}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: 6 }}>
              {idea.author.university}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="idea-summary">{idea.summary}</p>

        {/* Problem / Solution Callout */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderLeft: "3px solid var(--civic)",
            padding: "8px 12px",
            borderRadius: "0 6px 6px 0",
            fontSize: "0.8rem",
            marginBottom: 12,
          }}
        >
          <p>
            <strong style={{ color: "#334155" }}>Solution:</strong> {idea.solution_statement}
          </p>
        </div>

        {/* Needed Skills */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
            Needed Collaborator Skills:
          </span>
          <div className="skills-badge-list">
            {idea.needed_skills.map((skill, idx) => (
              <span key={idx} className="badge-tag badge-tag-tech">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Assembled Team Roster */}
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
            Active Team ({acceptedMembers.length}/{idea.team_size_target}):
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {acceptedMembers.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "#f1f5f9",
                  padding: "3px 8px",
                  borderRadius: 12,
                  fontSize: "0.74rem",
                }}
              >
                <img
                  src={m.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=m"}
                  alt={m.full_name}
                  style={{ width: 18, height: 18, borderRadius: "50%" }}
                />
                <span>
                  <strong>{m.full_name}</strong> ({m.role_title})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Mentor Section */}
        {idea.mentor ? (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              padding: "8px 10px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src={idea.mentor.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=mentor"}
                alt={idea.mentor.full_name}
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: 5 }}>
                  <span>{idea.mentor.full_name}</span>
                  <span className="badge-tag" style={{ backgroundColor: "#dcfce7", color: "#15803d", fontSize: "0.62rem" }}>
                    Mentor
                  </span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "#15803d" }}>
                  {idea.mentor.headline || "Civic & Industry Advisor"}
                </div>
              </div>
            </div>
            {idea.is_author && (
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: "0.7rem", padding: "2px 8px", color: "#166534", fontWeight: 600 }}
                onClick={handleOpenMentorModal}
              >
                Change
              </button>
            )}
          </div>
        ) : idea.is_author ? (
          <div style={{ marginBottom: 14 }}>
            <button
              type="button"
              className="btn-outline"
              style={{
                fontSize: "0.75rem",
                padding: "6px 12px",
                width: "100%",
                justifyContent: "center",
                borderColor: "#cbd5e1",
                backgroundColor: "#fafafa"
              }}
              onClick={handleOpenMentorModal}
            >
              <Award size={15} color="var(--accent)" />
              <span>Select a Project Mentor</span>
            </button>
          </div>
        ) : null}

        {/* If author: review pending applications */}
        {idea.is_author && pendingMembers.length > 0 && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 6,
              padding: 10,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#92400e" }}>
              Pending Team Applications ({pendingMembers.length}):
            </span>
            {pendingMembers.map((pm) => (
              <div
                key={pm.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 6,
                  fontSize: "0.76rem",
                }}
              >
                <span>
                  <strong>{pm.full_name}</strong> applying for <em>{pm.role_title}</em>
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="btn-civic"
                    style={{ padding: "2px 8px", fontSize: "0.68rem" }}
                    onClick={() => handleUpdateStatus(pm.id, "accepted")}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: "2px 8px", fontSize: "0.68rem", color: "#dc2626" }}
                    onClick={() => handleUpdateStatus(pm.id, "rejected")}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {idea.is_author ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.78rem",
                color: "var(--civic)",
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={16} />
              <span>You are the Project Lead</span>
            </div>
          ) : idea.user_application_status ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8rem",
                fontWeight: 700,
                color: idea.user_application_status === "accepted" ? "#059669" : "#d97706",
              }}
            >
              <CheckCircle size={16} />
              <span>
                {idea.user_application_status === "accepted"
                  ? "You are an active teammate!"
                  : "Application submitted (Under review)"}
              </span>
            </div>
          ) : (
            <button
              className="btn-civic"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setShowApplyModal(true)}
              disabled={idea.spots_remaining <= 0}
            >
              <PlusCircle size={16} />
              <span>{idea.spots_remaining > 0 ? "Apply to Join Team" : "Team Full"}</span>
            </button>
          )}

          {/* If author or teammate: Direct Team Group Chat Button */}
          {(idea.is_author || idea.user_application_status === "accepted") && (
            <button
              type="button"
              className="btn-civic"
              style={{
                fontSize: "0.74rem",
                padding: "4px 10px",
                gap: 5,
                whiteSpace: "nowrap"
              }}
              onClick={() => onNavigate?.("messages")}
              title="Open Project Team Group in Messaging"
            >
              <MessageSquare size={13} />
              <span>Team Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Select Mentor Modal */}
      {showMentorModal && (
        <div className="modal-overlay" onClick={() => setShowMentorModal(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Award size={20} color="var(--accent)" />
                <h3>Select Mentor for "{idea.title}"</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowMentorModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: 420, overflowY: "auto" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                Choose an experienced faculty, civic innovation fellow, or industry mentor to guide your project.
                Selected mentors receive a notification and join your project team group.
              </p>

              {loadingMentors ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  Finding available mentors...
                </div>
              ) : mentorsList.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  No mentors found at this moment.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {mentorsList.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 10,
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        backgroundColor: idea.mentor?.id === m.id ? "#f0fdf4" : "#ffffff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={m.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=mentor"}
                          alt={m.full_name}
                          style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }}
                        />
                        <div>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700 }}>
                            {m.full_name}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                            {m.headline || m.university || m.role}
                          </div>
                          {m.causes && (
                            <div style={{ fontSize: "0.68rem", color: "var(--civic)", marginTop: 2 }}>
                              Domains: {m.causes}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={idea.mentor?.id === m.id ? "btn-outline-civic" : "btn-civic"}
                        style={{ padding: "4px 12px", fontSize: "0.74rem" }}
                        disabled={isSelectingMentor || idea.mentor?.id === m.id}
                        onClick={() => handleSelectMentor(m.id)}
                      >
                        {idea.mentor?.id === m.id ? "Current Mentor" : "Select"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setShowMentorModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply to join {idea.title}</h3>
              <button className="btn-ghost" onClick={() => setShowApplyModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Desired Team Role</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. React Developer, Data Analyst, Field Organizer"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Why do you want to collaborate on this civic idea?</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Share your relevant skills, past civic engagement, or motivation..."
                    value={applicationNote}
                    onChange={(e) => setApplicationNote(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-civic" disabled={isSubmitting}>
                  <Send size={14} />
                  <span>{isSubmitting ? "Submitting..." : "Send Application"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
