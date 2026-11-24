import React, { useState, useEffect } from "react";
import { 
  Sparkles, CheckCircle2, Award, Plus, MapPin, 
  Building2, GraduationCap, ThumbsUp, X, Camera, Upload, Check, 
  Image as ImageIcon, FileText, FileCheck, Wand2, Trash2
} from "lucide-react";
import { UserProfile, UserSummary, ExtractedResumeData } from "../types";
import { api } from "../services/api";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"
];

interface ProfilePageProps {
  currentUser: UserSummary | null;
  onProfileUpdated: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Avatar upload modal state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // Modals state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTargetRole, setAiTargetRole] = useState("Civic Tech Software Engineer");
  const [aiSuggestions, setAiSuggestions] = useState<{ headline: string; about: string } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Resume auto-extraction modal state
  const [showResumeExtractModal, setShowResumeExtractModal] = useState(false);
  const [resumeTextToExtract, setResumeTextToExtract] = useState("");
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedResumeData | null>(null);
  const [isApplyingExtracted, setIsApplyingExtracted] = useState(false);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState("");

  // Add modals
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [newExp, setNewExp] = useState({ company: "", title: "", employment_type: "Internship", start_date: "2025", end_date: "Present", description: "" });

  const [showAddEduModal, setShowAddEduModal] = useState(false);
  const [newEdu, setNewEdu] = useState({ school: "", degree: "B.Tech", field_of_study: "Computer Science", start_year: "2022", end_year: "2026" });

  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getMyProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const handleRunAIOptimizer = async () => {
    if (!profile) return;
    setIsGeneratingAI(true);
    try {
      const suggestions = await api.improveProfile(profile.headline, profile.about, aiTargetRole);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error("AI Profile optimization error:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleApplyAISuggestions = async () => {
    if (!aiSuggestions) return;
    try {
      await api.updateMyProfile({
        headline: aiSuggestions.headline,
        about: aiSuggestions.about,
      });
      setShowAIModal(false);
      setAiSuggestions(null);
      loadProfile();
      onProfileUpdated();
    } catch (err) {
      console.error("Failed to apply profile update:", err);
    }
  };

  const handleExtractResume = async () => {
    if (!resumeTextToExtract.trim()) return;
    setIsExtractingResume(true);
    setExtractSuccessMsg("");
    try {
      const data = await api.extractResume(resumeTextToExtract.trim());
      setExtractedData(data);
    } catch (err) {
      console.error("Resume extraction failed:", err);
    } finally {
      setIsExtractingResume(false);
    }
  };

  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setResumeTextToExtract(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleApplyExtractedResume = async () => {
    if (!extractedData) return;
    setIsApplyingExtracted(true);
    try {
      await api.applyExtractedResume(extractedData);
      setExtractSuccessMsg("✅ Education, skills, and experience successfully saved to your profile!");
      setTimeout(() => {
        setShowResumeExtractModal(false);
        setExtractedData(null);
        setResumeTextToExtract("");
        setExtractSuccessMsg("");
      }, 1400);
      loadProfile();
      onProfileUpdated();
    } catch (err) {
      console.error("Failed to apply extracted resume data:", err);
    } finally {
      setIsApplyingExtracted(false);
    }
  };

  const handleRemoveExtractedSkill = (skillToRemove: string) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      skills: extractedData.skills.filter((s) => s !== skillToRemove),
    });
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setSelectedAvatarUrl(reader.result as string);
          setCustomAvatarUrl("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    const finalUrl = selectedAvatarUrl || customAvatarUrl;
    if (!finalUrl) return;
    setIsSavingAvatar(true);
    try {
      await api.updateAvatar(finalUrl);
      setShowAvatarModal(false);
      setSelectedAvatarUrl("");
      setCustomAvatarUrl("");
      loadProfile();
      onProfileUpdated();
    } catch (err) {
      console.error("Failed to update avatar:", err);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addExperience(newExp);
      setShowAddExpModal(false);
      loadProfile();
    } catch (err) {
      console.error("Error adding experience:", err);
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addEducation(newEdu);
      setShowAddEduModal(false);
      loadProfile();
    } catch (err) {
      console.error("Error adding education:", err);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await api.addSkill({ name: newSkillName.trim() });
      setShowAddSkillModal(false);
      setNewSkillName("");
      loadProfile();
    } catch (err) {
      console.error("Error adding skill:", err);
    }
  };

  const handleEndorse = async (skillId: number) => {
    try {
      await api.endorseSkill(skillId);
      loadProfile();
    } catch (err) {
      console.error("Error endorsing skill:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 32, textAlign: "center" }}>
        Loading verified civic & professional profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 32, textAlign: "center" }}>
        Profile not found.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 40px" }}>
      {/* Top Banner & Profile Overview Card */}
      <div className="nexora-card" style={{ marginBottom: 16, overflow: "hidden" }}>
        <div
          style={{
            height: 160,
            backgroundImage: `url(${profile.banner_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div style={{ padding: "0 24px 24px", position: "relative" }}>
          {/* Avatar with Camera Upload Option */}
          <div style={{ marginTop: -60, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <img
                src={profile.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=profile"}
                alt={profile.full_name}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: "4px solid #ffffff",
                  boxShadow: "var(--shadow-md)",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
                onClick={() => setShowAvatarModal(true)}
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "2.5px solid #ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, background-color 0.15s",
                }}
                onClick={() => setShowAvatarModal(true)}
                title="Upload Profile Picture"
              >
                <Camera size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="btn-primary"
                onClick={() => setShowResumeExtractModal(true)}
                style={{ fontSize: "0.84rem", display: "flex", alignItems: "center", gap: 6 }}
              >
                <FileText size={16} />
                <span>Auto-Extract from Resume</span>
              </button>
              <button
                className="btn-civic"
                onClick={() => setShowAIModal(true)}
                style={{ fontSize: "0.84rem" }}
              >
                <Sparkles size={16} />
                <span>Optimize with Claude AI</span>
              </button>
            </div>
          </div>

          {/* Details */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800 }}>
                {profile.full_name}
              </h1>
              <span className="badge-civic-hours" title="Verifiable Civic Profile">
                <CheckCircle2 size={13} color="#059669" />
                <span>{profile.civic_hours} Verified Civic Hours</span>
              </span>
            </div>

            <p style={{ fontSize: "1rem", color: "#334155", marginTop: 4, fontWeight: 500 }}>
              {profile.headline}
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "10px 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <GraduationCap size={15} />
                <span>{profile.university}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={15} />
                <span>{profile.location}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Building2 size={15} />
                <span>{profile.industry}</span>
              </span>
            </div>

            {/* Causes */}
            {profile.causes && profile.causes.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", alignSelf: "center" }}>
                  Active Causes:
                </span>
                {profile.causes.map((cause, idx) => (
                  <span key={idx} className="badge-tag badge-tag-civic">
                    {cause}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Extraction Quick Banner */}
      <div
        className="nexora-card"
        style={{
          marginBottom: 16,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)",
          border: "1px solid #bbf7d0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: "#dcfce7",
              color: "#166534",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileCheck size={24} />
          </div>
          <div>
            <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "#166534" }}>
              ⚡ Fast-Track Profile: Auto-Extract from Resume
            </h4>
            <p style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2 }}>
              Upload your resume or paste text to automatically parse and populate your Education, Skills, and Experience with AI.
            </p>
          </div>
        </div>
        <button
          className="btn-civic"
          onClick={() => setShowResumeExtractModal(true)}
          style={{ padding: "8px 16px", fontSize: "0.82rem", whiteSpace: "nowrap" }}
        >
          <Sparkles size={15} />
          <span>Upload & Extract</span>
        </button>
      </div>

      {/* About Section */}
      <div className="nexora-card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 10 }}>
          About & Civic Mission
        </h3>
        <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "#334155", whiteSpace: "pre-line" }}>
          {profile.about || "Add an about section to introduce your civic interests and technical proficiencies."}
        </p>
      </div>

      {/* Verifiable Civic Badges Section */}
      <div className="nexora-card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={20} color="var(--civic)" />
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700 }}>
              Verifiable Civic Impact Credentials
            </h3>
          </div>
          <span className="badge-tag badge-tag-civic">Blockchain & Org Verified</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {profile.civic_badges.map((b) => (
            <div
              key={b.id}
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "var(--radius-md)",
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#059669" />
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700, color: "#166534" }}>
                  {b.badge_name}
                </h4>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#334155", marginTop: 4 }}>
                {b.description}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>
                <span>Issued by: {b.issued_by}</span>
                <span>{b.issued_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Section */}
      <div className="nexora-card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700 }}>
            Experience & Civic Leadership
          </h3>
          <button className="btn-outline" style={{ padding: "4px 12px", fontSize: "0.78rem" }} onClick={() => setShowAddExpModal(true)}>
            <Plus size={14} />
            <span>Add Experience</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {profile.experiences.map((exp) => (
            <div key={exp.id} style={{ display: "flex", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.98rem", fontWeight: 700 }}>
                  {exp.title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {exp.company} • {exp.employment_type}
                </p>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {exp.start_date} - {exp.end_date}
                </span>
                <p style={{ fontSize: "0.85rem", color: "#334155", marginTop: 6, lineHeight: 1.4 }}>
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education Section */}
      <div className="nexora-card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700 }}>
            Education
          </h3>
          <button className="btn-outline" style={{ padding: "4px 12px", fontSize: "0.78rem" }} onClick={() => setShowAddEduModal(true)}>
            <Plus size={14} />
            <span>Add Education</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {profile.educations.map((edu) => (
            <div key={edu.id} style={{ display: "flex", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: "var(--civic-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--civic)",
                }}
              >
                <GraduationCap size={20} />
              </div>
              <div>
                <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.98rem", fontWeight: 700 }}>
                  {edu.school}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {edu.degree}, {edu.field_of_study}
                </p>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {edu.start_year} - {edu.end_year}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Endorsements */}
      <div className="nexora-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700 }}>
            Skills & Peer Endorsements
          </h3>
          <button className="btn-outline" style={{ padding: "4px 12px", fontSize: "0.78rem" }} onClick={() => setShowAddSkillModal(true)}>
            <Plus size={14} />
            <span>Add Skill</span>
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {profile.skills.map((s) => (
            <div
              key={s.id}
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "var(--radius-full)",
                padding: "6px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.84rem",
              }}
            >
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  color: "var(--primary)",
                  backgroundColor: "var(--primary-light)",
                  borderRadius: 12,
                  padding: "2px 6px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
                onClick={() => handleEndorse(s.id)}
                title="Click to endorse this skill"
              >
                <ThumbsUp size={11} />
                <span>{s.endorsements_count}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Claude AI Profile Optimizer Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} color="var(--civic)" />
                <h3>Claude AI Profile Optimizer</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowAIModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                Let Claude AI elevate your headline and about section to highlight your civic tech leadership and project experience.
              </p>

              <div className="form-group">
                <label className="form-label">Target Role / Sector Focus</label>
                <input
                  type="text"
                  className="form-input"
                  value={aiTargetRole}
                  onChange={(e) => setAiTargetRole(e.target.value)}
                  placeholder="e.g. Civic Tech Engineer, Environmental Data Analyst"
                />
              </div>

              <button
                className="btn-civic"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleRunAIOptimizer}
                disabled={isGeneratingAI}
              >
                <Sparkles size={14} />
                <span>{isGeneratingAI ? "Generating Optimizations..." : "Generate Improved Profile"}</span>
              </button>

              {aiSuggestions && (
                <div style={{ marginTop: 18, borderTop: "1px solid var(--divider)", paddingTop: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Suggested Headline</label>
                    <div style={{ backgroundColor: "#f0fdf4", padding: 10, borderRadius: 6, border: "1px solid #bbf7d0", fontSize: "0.86rem", fontWeight: 600 }}>
                      {aiSuggestions.headline}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Suggested About Section</label>
                    <div style={{ backgroundColor: "#f0fdf4", padding: 12, borderRadius: 6, border: "1px solid #bbf7d0", fontSize: "0.84rem", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                      {aiSuggestions.about}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowAIModal(false)}>
                Cancel
              </button>
              {aiSuggestions && (
                <button className="btn-primary" onClick={handleApplyAISuggestions}>
                  Apply to Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Experience Modal */}
      {showAddExpModal && (
        <div className="modal-overlay" onClick={() => setShowAddExpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Experience</h3>
              <button className="btn-ghost" onClick={() => setShowAddExpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddExperience}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newExp.title}
                    onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company / Organization</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowAddExpModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Experience</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Education Modal */}
      {showAddEduModal && (
        <div className="modal-overlay" onClick={() => setShowAddEduModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Education</h3>
              <button className="btn-ghost" onClick={() => setShowAddEduModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddEducation}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">College / University</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEdu.school}
                    onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Degree</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEdu.degree}
                    onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Field of Study</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEdu.field_of_study}
                    onChange={(e) => setNewEdu({ ...newEdu, field_of_study: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowAddEduModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Education</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <div className="modal-overlay" onClick={() => setShowAddSkillModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Skill</h3>
              <button className="btn-ghost" onClick={() => setShowAddSkillModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSkill}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Skill Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Scikit-Learn, Climate Data, FastAPI"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowAddSkillModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Profile Picture Modal */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Camera size={20} color="var(--primary)" />
                <h3 style={{ fontSize: "1.1rem" }}>Update Profile Picture</h3>
              </div>
              <button className="btn-ghost" onClick={() => setShowAvatarModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Current / Preview Image Display */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                <img
                  src={selectedAvatarUrl || customAvatarUrl || profile.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=p"}
                  alt="Avatar Preview"
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--primary)",
                    boxShadow: "var(--shadow-md)",
                    marginBottom: 10,
                  }}
                />
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Profile Photo Preview
                </span>
              </div>

              {/* Option 1: File Upload */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Upload size={14} />
                  <span>Upload Image File from Device (JPG, PNG, WEBP)</span>
                </label>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "18px",
                    border: "2px dashed #cbd5e1",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#f8fafc",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                >
                  <Upload size={24} color="var(--primary)" style={{ marginBottom: 6 }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }}>
                    Choose a photo or drag & drop
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Supports high-resolution images up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Option 2: Image URL */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ImageIcon size={14} />
                  <span>Or Enter Image Web URL</span>
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={customAvatarUrl}
                  onChange={(e) => {
                    setCustomAvatarUrl(e.target.value);
                    setSelectedAvatarUrl("");
                  }}
                />
              </div>

              {/* Option 3: Quick Preset Avatars */}
              <div className="form-group">
                <label className="form-label">Or Pick from Curated Profiles</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {PRESET_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Preset ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: 52,
                        borderRadius: "50%",
                        objectFit: "cover",
                        cursor: "pointer",
                        border:
                          selectedAvatarUrl === url || (!selectedAvatarUrl && profile.avatar_url === url)
                            ? "3px solid var(--civic)"
                            : "2px solid #e2e8f0",
                        transition: "transform 0.15s, border-color 0.15s",
                      }}
                      onClick={() => {
                        setSelectedAvatarUrl(url);
                        setCustomAvatarUrl("");
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAvatarModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveAvatar}
                disabled={isSavingAvatar || (!selectedAvatarUrl && !customAvatarUrl)}
              >
                <Check size={16} />
                <span>{isSavingAvatar ? "Saving Photo..." : "Save Profile Photo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Auto-Extraction Modal */}
      {showResumeExtractModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 740, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#eff6ff", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700 }}>
                    Auto-Extract Profile from Resume
                  </h3>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                    Instantly extract Education, Skills, and Experience to populate your verified profile.
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: 4 }}
                onClick={() => {
                  setShowResumeExtractModal(false);
                  setExtractedData(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: "auto", flex: 1, padding: 20 }}>
              {extractSuccessMsg && (
                <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: 8, marginBottom: 16, fontSize: "0.85rem", fontWeight: 600 }}>
                  {extractSuccessMsg}
                </div>
              )}

              {!extractedData ? (
                <>
                  {/* File Upload Area */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed #cbd5e1",
                        borderRadius: 12,
                        padding: "24px 16px",
                        cursor: "pointer",
                        backgroundColor: "#f8fafc",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                    >
                      <Upload size={28} color="var(--primary)" style={{ marginBottom: 8 }} />
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        Click to upload resume (.txt, .md, text)
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                        Or paste your resume text below
                      </span>
                      <input
                        type="file"
                        accept=".txt,.md,.rtf,.pdf"
                        style={{ display: "none" }}
                        onChange={handleResumeFileUpload}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Resume Content</label>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: "0.74rem", padding: "2px 8px" }}
                      onClick={() =>
                        setResumeTextToExtract(
                          `Preethi Achar\n` +
                          `Student in Computer Science & Engineering | National Institute of Technology\n` +
                          `Bengaluru, India | Email: preethi@nit.ac.in\n\n` +
                          `Education:\n` +
                          `- National Institute of Technology, B.Tech in Computer Science & Engineering (2022 - 2026)\n\n` +
                          `Skills:\n` +
                          `Python, React, TypeScript, FastAPI, SQL, Scikit-Learn, Git, Docker, Community Organizing, Civic Tech, Youth Leadership\n\n` +
                          `Experience:\n` +
                          `- Full-Stack Intern @ CivicPulse Lab (2024 - Present):\n` +
                          `  Developed real-time civic participation telemetry using FastAPI and React. Mobilized 50+ students across community cleanup mapping campaigns.\n` +
                          `- Student Lead @ Youth Tech Innovation (2023 - 2024):\n` +
                          `  Conducted peer workshops on accessible web development and coordinated hackathon initiatives.`
                        )
                      }
                    >
                      Load Sample Resume
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <textarea
                      className="form-textarea"
                      rows={8}
                      placeholder="Paste your resume or CV text here..."
                      value={resumeTextToExtract}
                      onChange={(e) => setResumeTextToExtract(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "10px 0" }}
                    onClick={handleExtractResume}
                    disabled={isExtractingResume || !resumeTextToExtract.trim()}
                  >
                    <Wand2 size={16} />
                    <span>{isExtractingResume ? "Parsing Education, Skills & Experience with AI..." : "Extract Resume Details"}</span>
                  </button>
                </>
              ) : (
                /* Extracted Review Mode */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                      ✨ AI Extracted Successfully — Review Before Applying
                    </span>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: "0.74rem" }}
                      onClick={() => setExtractedData(null)}
                    >
                      Re-paste / Re-extract
                    </button>
                  </div>

                  {/* Headline & Summary */}
                  <div style={{ backgroundColor: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <label className="form-label">Extracted Headline</label>
                    <input
                      type="text"
                      className="form-input"
                      value={extractedData.headline}
                      onChange={(e) => setExtractedData({ ...extractedData, headline: e.target.value })}
                    />
                    <label className="form-label" style={{ marginTop: 10 }}>Extracted About & Bio</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={extractedData.about}
                      onChange={(e) => setExtractedData({ ...extractedData, about: e.target.value })}
                    />
                  </div>

                  {/* Extracted Skills */}
                  <div style={{ backgroundColor: "#f0fdf4", padding: 14, borderRadius: 8, border: "1px solid #bbf7d0" }}>
                    <label className="form-label" style={{ color: "#166534", fontWeight: 700 }}>
                      Extracted Skills ({extractedData.skills.length})
                    </label>
                    <p style={{ fontSize: "0.74rem", color: "#475569", marginBottom: 8 }}>
                      Click the × icon to remove any skill you don't want on your profile.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {extractedData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="badge-tag badge-tag-civic"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtractedSkill(skill)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#166534" }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Extracted Education */}
                  <div style={{ backgroundColor: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--primary)", fontWeight: 700 }}>
                      <GraduationCap size={18} />
                      <span style={{ fontSize: "0.9rem" }}>Extracted Education ({extractedData.educations.length})</span>
                    </div>
                    {extractedData.educations.map((edu, idx) => (
                      <div key={idx} style={{ padding: 10, backgroundColor: "#ffffff", borderRadius: 6, border: "1px solid #e2e8f0", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{edu.school}</div>
                        <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                          {edu.degree} — {edu.field_of_study} ({edu.start_year} - {edu.end_year})
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Extracted Experience */}
                  <div style={{ backgroundColor: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--civic)", fontWeight: 700 }}>
                      <Building2 size={18} />
                      <span style={{ fontSize: "0.9rem" }}>Extracted Experience ({extractedData.experiences.length})</span>
                    </div>
                    {extractedData.experiences.map((exp, idx) => (
                      <div key={idx} style={{ padding: 10, backgroundColor: "#ffffff", borderRadius: 6, border: "1px solid #e2e8f0", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{exp.title} @ {exp.company}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                          {exp.employment_type} • {exp.start_date} - {exp.end_date}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#334155" }}>{exp.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setShowResumeExtractModal(false);
                  setExtractedData(null);
                }}
              >
                Close
              </button>
              {extractedData && (
                <button
                  type="button"
                  className="btn-civic"
                  onClick={handleApplyExtractedResume}
                  disabled={isApplyingExtracted}
                >
                  <Check size={16} />
                  <span>{isApplyingExtracted ? "Saving to Database..." : "Apply All to My Nexora Profile"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

