import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, AlertCircle, Send, FileText } from "lucide-react";
import { Job, ATSMatchResult } from "../types";
import { api } from "../services/api";

interface ApplyJobModalProps {
  job: Job;
  defaultResumeText?: string;
  onClose: () => void;
  onApplied: () => void;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  job,
  defaultResumeText = "",
  onClose,
  onApplied,
}) => {
  const [resumeText, setResumeText] = useState(
    defaultResumeText ||
      `Experienced student software builder proficient in Python, React, and FastAPI. 
Led open-source civic initiatives creating waste mapping tools with Computer Vision.
Engaged in 140+ hours of verifiable community volunteering and campus climate chapters. 
Strong understanding of SQL, REST APIs, Git, and collaborating with cross-functional teams.`
  );

  const [isScreening, setIsScreening] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSMatchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Run transparent Scikit-Learn ATS analysis before submitting
  const handleRunScreening = async () => {
    if (!resumeText.trim()) return;
    setIsScreening(true);
    try {
      const result = await api.screenResume({
        resume_text: resumeText,
        job_id: job.id,
        job_title: job.title,
        job_description: `${job.description}\n${job.requirements || ""}`,
        job_skills: job.skills_required.join(", "),
      });
      setAtsResult(result);
    } catch (err) {
      console.error("Screening failed:", err);
    } finally {
      setIsScreening(false);
    }
  };

  const handleFinalApply = async () => {
    setIsSubmitting(true);
    try {
      await api.applyToJob(job.id, resumeText);
      onApplied();
      onClose();
    } catch (err) {
      console.error("Failed to submit application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--civic)", fontWeight: 700 }}>
              AI-TRANSPARENT ATS SCREENING
            </span>
            <h3 style={{ fontSize: "1.1rem" }}>Apply for {job.title}</h3>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              {job.company_name} • {job.location}
            </span>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 14 }}>
            Nexora never silently rejects candidates. Review your Scikit-Learn TF-IDF match score and
            Claude AI feedback below to strengthen your profile before final submission.
          </p>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={15} />
                <span>Resume / Candidate Summary</span>
              </label>
              <button
                type="button"
                className="btn-outline-civic"
                style={{ padding: "3px 10px", fontSize: "0.74rem" }}
                onClick={handleRunScreening}
                disabled={isScreening}
              >
                <Sparkles size={13} />
                <span>{isScreening ? "Analyzing Match..." : "Check ATS Score"}</span>
              </button>
            </div>

            <textarea
              className="form-textarea"
              rows={5}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your professional experience, technical skills, and civic impact..."
            />
          </div>

          {/* ATS Results View */}
          {atsResult && (
            <div className="ats-result-card">
              <div className="ats-score-meter">
                <div
                  className={`ats-circle ${
                    atsResult.ats_score >= 75 ? "high" : atsResult.ats_score >= 50 ? "med" : "low"
                  }`}
                >
                  <span style={{ fontSize: "1.2rem" }}>{atsResult.ats_score}%</span>
                  <span style={{ fontSize: "0.55rem", fontWeight: 700 }}>ATS MATCH</span>
                </div>

                <div>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700 }}>
                    {atsResult.ats_score >= 75
                      ? "High Keyword Alignment!"
                      : atsResult.ats_score >= 50
                      ? "Moderate Resonance"
                      : "Keywords Missing"}
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                    Evaluated against {job.skills_required.length} required competencies and role description.
                  </p>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
                <div style={{ backgroundColor: "#f0fdf4", padding: 10, borderRadius: 6, border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", display: "flex", gap: 4, alignItems: "center" }}>
                    <CheckCircle2 size={13} />
                    <span>Matched Skills ({atsResult.matched_skills.length})</span>
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {atsResult.matched_skills.map((s, idx) => (
                      <span key={idx} className="badge-tag badge-tag-civic" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: "#fef2f2", padding: 10, borderRadius: 6, border: "1px solid #fecaca" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#991b1b", display: "flex", gap: 4, alignItems: "center" }}>
                    <AlertCircle size={13} />
                    <span>Missing Keywords ({atsResult.missing_skills.length})</span>
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {atsResult.missing_skills.map((s, idx) => (
                      <span key={idx} className="badge-tag" style={{ fontSize: "0.7rem", padding: "2px 6px", color: "#991b1b" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Claude AI Coach Feedback */}
              {atsResult.claude_analysis && (
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, padding: 12 }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={14} />
                    <span>Claude AI Coach Recommendation:</span>
                  </span>
                  <p style={{ fontSize: "0.8rem", color: "#334155", marginTop: 4, lineHeight: 1.4 }}>
                    {atsResult.claude_analysis.summary}
                  </p>

                  <ul style={{ margin: "8px 0 0 16px", fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                    {atsResult.claude_analysis.actionable_steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: 3 }}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleFinalApply}
            disabled={isSubmitting}
          >
            <Send size={14} />
            <span>{isSubmitting ? "Submitting Application..." : "Submit Verified Application"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
