import React, { useState, useEffect } from "react";
import { 
  Sparkles, CheckCircle2, AlertCircle, RefreshCw, FileText, 
  ArrowRight, Wand2, Copy, Download, Check, Zap, CheckCheck
} from "lucide-react";
import { Job, ATSMatchResult, OptimizedResumeResult } from "../types";
import { api } from "../services/api";

export const ResumeScreeningPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | "custom">("custom");
  const [jobTitle, setJobTitle] = useState("Civic Tech Software Fellow");
  const [jobDescription, setJobDescription] = useState(
    `We are seeking student technologists proficient in Python, React, and FastAPI to build accessible digital public infrastructure. Must possess experience in community organizing or open source civic tools, Git, and data analysis.`
  );
  const [resumeText, setResumeText] = useState(
    `Maya Chen
Junior in Computer Science | Indian Institute of Science
Skills: Python, React, Machine Learning, FastAPI, Git, Civic Tech, Volunteering, Community Organizing

Experience:
- Student Project Lead @ CivicClean (2025 - Present): Built an open-source civic map classifying trash hotspots with YOLOv8 computer vision and React. Mobilized 60+ student volunteers across 12 neighborhood cleanups, removing over 1,200 kg of plastic.
- Tech Volunteer @ GreenEarth: Developed data visualization dashboard for urban tree canopy monitoring using Python and Pandas.`
  );
  const [isScreening, setIsScreening] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSMatchResult | null>(null);

  // Automatic Resume Builder states
  const [isBuildingResume, setIsBuildingResume] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResumeResult | null>(null);
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const [isApplyingToProfile, setIsApplyingToProfile] = useState(false);
  const [profileAppliedMsg, setProfileAppliedMsg] = useState("");

  useEffect(() => {
    api.getJobs()
      .then((data) => {
        setJobs(data);
        if (data.length > 0) {
          setSelectedJobId(data[0].id);
          setJobTitle(data[0].title);
          setJobDescription(`${data[0].description}\n${data[0].requirements || ""}`);
        }
      })
      .catch((err) => console.error("Error loading jobs:", err));
  }, []);

  const handleJobSelectChange = (val: string) => {
    if (val === "custom") {
      setSelectedJobId("custom");
      setJobTitle("Custom Civic Opportunity");
      setJobDescription("");
    } else {
      const jid = Number(val);
      setSelectedJobId(jid);
      const found = jobs.find((j) => j.id === jid);
      if (found) {
        setJobTitle(found.title);
        setJobDescription(`${found.description}\n${found.requirements || ""}`);
      }
    }
  };

  const handleAnalyze = async (overrideResume?: string) => {
    const textToAnalyze = typeof overrideResume === "string" ? overrideResume : resumeText;
    if (!textToAnalyze.trim() || !jobDescription.trim()) return;
    setIsScreening(true);
    try {
      const res = await api.screenResume({
        resume_text: textToAnalyze,
        job_id: typeof selectedJobId === "number" ? selectedJobId : undefined,
        job_title: jobTitle,
        job_description: jobDescription,
      });
      setAtsResult(res);
      if (typeof overrideResume === "string") {
        setResumeText(overrideResume);
      }
    } catch (err) {
      console.error("Failed to screen resume:", err);
    } finally {
      setIsScreening(false);
    }
  };

  const handleBuildResume = async () => {
    if (!atsResult) return;
    setIsBuildingResume(true);
    setProfileAppliedMsg("");
    try {
      const res = await api.buildOptimizedResume({
        resume_text: resumeText,
        job_title: jobTitle,
        job_description: jobDescription,
        missing_skills: atsResult.missing_skills,
        recommendations: atsResult.recommendations,
      });
      setOptimizedResume(res);
    } catch (err) {
      console.error("Failed to build optimized resume:", err);
    } finally {
      setIsBuildingResume(false);
    }
  };

  const handleCopyOptimizedResume = () => {
    if (!optimizedResume) return;
    navigator.clipboard.writeText(optimizedResume.optimized_resume_text);
    setCopiedOptimized(true);
    setTimeout(() => setCopiedOptimized(false), 2000);
  };

  const handleDownloadResume = () => {
    if (!optimizedResume) return;
    const element = document.createElement("a");
    const file = new Blob([optimizedResume.optimized_resume_text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${jobTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Optimized_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleApplyToProfile = async () => {
    if (!optimizedResume) return;
    setIsApplyingToProfile(true);
    try {
      const extracted = await api.extractResume(optimizedResume.optimized_resume_text);
      await api.applyExtractedResume(extracted);
      setProfileAppliedMsg("✅ Applied optimized skills, summary, and experience to your Nexora Profile!");
      setTimeout(() => setProfileAppliedMsg(""), 3500);
    } catch (err) {
      console.error("Failed to apply to profile:", err);
    } finally {
      setIsApplyingToProfile(false);
    }
  };


  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 16px" }}>
      {/* Hero */}
      <div className="marketplace-hero" style={{ background: "linear-gradient(135deg, #059669 0%, #0a66c2 100%)" }}>
        <h2>AI-Powered Transparent Resume Screening</h2>
        <p>
          Unlike traditional Applicant Tracking Systems (ATS) that silently discard student applications,
          Nexora uses <strong>Scikit-Learn NLP TF-IDF vectorization</strong> and <strong>Claude AI</strong> to
          provide immediate, transparent feedback on your skill alignment and missing keywords.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left Column: Input Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Target Role Card */}
          <div className="nexora-card" style={{ padding: 18 }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.98rem", fontWeight: 700, marginBottom: 12 }}>
              1. Select Target Opportunity
            </h3>

            <div className="form-group">
              <label className="form-label">Choose from Nexora Opportunities</label>
              <select
                className="form-select"
                value={selectedJobId}
                onChange={(e) => handleJobSelectChange(e.target.value)}
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.company_name})
                  </option>
                ))}
                <option value="custom">-- Custom Job / Volunteering Description --</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Job Description / Requirements</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target role description here..."
              />
            </div>
          </div>

          {/* Resume Input Card */}
          <div className="nexora-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.98rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={18} />
                <span>2. Candidate Resume Text</span>
              </h3>
              <button
                className="btn-ghost"
                style={{ fontSize: "0.74rem", padding: "3px 8px" }}
                onClick={() =>
                  setResumeText(
                    `Alex Rivera - Climate Tech Builder\nSkills: Python, Scikit-Learn, Data Analysis, Environmental Science, Community Organizing\nExperience: Built urban air quality sensor telemetry for 40+ student volunteers.`
                  )
                }
              >
                Load Alex's Sample
              </button>
            </div>

            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={8}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text including education, projects, skills, and civic volunteering..."
              />
            </div>

            <button
              className="btn-civic"
              style={{ width: "100%", justifyContent: "center", padding: "10px 0" }}
              onClick={() => handleAnalyze()}
              disabled={isScreening}
            >
              <Sparkles size={16} />
              <span>{isScreening ? "Calculating Scikit-Learn TF-IDF & Claude Insights..." : "Run Transparent ATS Screen"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: ATS Breakdown */}
        <div>
          {atsResult ? (
            <div className="nexora-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 800 }}>
                  Diagnostic ATS Feedback
                </h3>
                <span className="badge-tag badge-tag-civic">Verified Transparent</span>
              </div>

              {/* Match Score Meter */}
              <div className="ats-score-meter">
                <div
                  className={`ats-circle ${
                    atsResult.ats_score >= 70 ? "high" : atsResult.ats_score >= 45 ? "med" : "low"
                  }`}
                >
                  <span style={{ fontSize: "1.3rem" }}>{atsResult.ats_score}%</span>
                  <span style={{ fontSize: "0.55rem", fontWeight: 700 }}>MATCH</span>
                </div>

                <div>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700 }}>
                    {atsResult.ats_score >= 70
                      ? "Excellent Candidate Alignment!"
                      : atsResult.ats_score >= 45
                      ? "Competitive with Actionable Gaps"
                      : "Low Keyword Resonance"}
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                    Evaluated against target: <strong>{atsResult.job_title}</strong>
                  </p>
                </div>
              </div>

              {/* Matched vs Missing Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0" }}>
                <div style={{ backgroundColor: "#f0fdf4", padding: 12, borderRadius: 8, border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 700, fontSize: "0.78rem" }}>
                    <CheckCircle2 size={14} />
                    <span>Matched Keywords ({atsResult.matched_skills.length})</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {atsResult.matched_skills.map((s, idx) => (
                      <span key={idx} className="badge-tag badge-tag-civic" style={{ fontSize: "0.72rem" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: "#fef2f2", padding: 12, borderRadius: 8, border: "1px solid #fecaca" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#991b1b", fontWeight: 700, fontSize: "0.78rem" }}>
                    <AlertCircle size={14} />
                    <span>Missing Skills ({atsResult.missing_skills.length})</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {atsResult.missing_skills.map((s, idx) => (
                      <span key={idx} className="badge-tag" style={{ fontSize: "0.72rem", color: "#991b1b" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Claude AI Coach Evaluation */}
              {atsResult.claude_analysis && (
                <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem" }}>
                    <Sparkles size={16} />
                    <span>Claude AI Coach Insights:</span>
                  </div>

                  <p style={{ fontSize: "0.84rem", color: "#334155", margin: "8px 0", lineHeight: 1.5 }}>
                    {atsResult.claude_analysis.summary}
                  </p>

                  <h5 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginTop: 10 }}>
                    Identified Candidate Strengths:
                  </h5>
                  <ul style={{ margin: "4px 0 10px 18px", fontSize: "0.78rem", color: "#334155" }}>
                    {atsResult.claude_analysis.strengths.map((st, i) => (
                      <li key={i} style={{ marginBottom: 3 }}>
                        {st}
                      </li>
                    ))}
                  </ul>

                  <h5 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#059669", marginTop: 10 }}>
                    Actionable Profile Optimizations:
                  </h5>
                  <ul style={{ margin: "4px 0 0 18px", fontSize: "0.78rem", color: "#334155" }}>
                    {atsResult.claude_analysis.actionable_steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: 3 }}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AUTOMATIC RESUME BUILDING SECTION AFTER GETTING SCORE */}
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: "#f0fdf4",
                  border: "1.5px solid #86efac",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={16} />
                      </div>
                      <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 800, color: "#166534" }}>
                        Automatic Resume Builder & Score Booster
                      </h4>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#334155", marginTop: 4 }}>
                      AI will rewrite your resume, inject the {atsResult.missing_skills.length} missing keywords, and formulate STAR quantifiable bullets to boost your ATS match to 95%+.
                    </p>
                  </div>
                </div>

                {profileAppliedMsg && (
                  <div style={{ padding: "8px 12px", backgroundColor: "#ffffff", border: "1px solid #86efac", borderRadius: 6, color: "#166534", fontSize: "0.78rem", fontWeight: 700, marginTop: 10 }}>
                    {profileAppliedMsg}
                  </div>
                )}

                {!optimizedResume ? (
                  <button
                    type="button"
                    className="btn-civic"
                    style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "10px 0", fontSize: "0.85rem" }}
                    onClick={handleBuildResume}
                    disabled={isBuildingResume}
                  >
                    <Wand2 size={16} />
                    <span>{isBuildingResume ? "Architecting ATS-Compliant Resume with Claude..." : "⚡ Auto-Build ATS-Optimized Resume"}</span>
                  </button>
                ) : (
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.76rem" }}>
                        ✨ Projected ATS Score: <strong>{optimizedResume.projected_score}% Match</strong>
                      </span>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: "0.72rem" }}
                        onClick={() => setOptimizedResume(null)}
                      >
                        Reset / Re-build
                      </button>
                    </div>

                    {/* Injected Keywords Badge List */}
                    <div style={{ padding: 10, backgroundColor: "#ffffff", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534", display: "block", marginBottom: 4 }}>
                        Integrated Keywords:
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {optimizedResume.added_keywords.map((kw, i) => (
                          <span key={i} className="badge-tag badge-tag-civic" style={{ fontSize: "0.68rem" }}>
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Editable Resume Text */}
                    <textarea
                      className="form-textarea"
                      rows={10}
                      value={optimizedResume.optimized_resume_text}
                      onChange={(e) => setOptimizedResume({ ...optimizedResume, optimized_resume_text: e.target.value })}
                      style={{ fontFamily: "monospace", fontSize: "0.78rem", backgroundColor: "#ffffff" }}
                    />

                    {/* Action Buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleAnalyze(optimizedResume.optimized_resume_text)}
                        style={{ justifyContent: "center", fontSize: "0.78rem", padding: "8px 0" }}
                        title="Run ATS Screen on this optimized resume to verify your improved score"
                      >
                        <RefreshCw size={14} />
                        <span>Re-Screen with This</span>
                      </button>

                      <button
                        type="button"
                        className="btn-civic"
                        onClick={handleCopyOptimizedResume}
                        style={{ justifyContent: "center", fontSize: "0.78rem", padding: "8px 0" }}
                      >
                        {copiedOptimized ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedOptimized ? "Copied!" : "Copy Resume"}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={handleDownloadResume}
                        style={{ justifyContent: "center", fontSize: "0.78rem", padding: "8px 0", backgroundColor: "#ffffff", border: "1px solid #cbd5e1" }}
                      >
                        <Download size={14} />
                        <span>Download (.txt)</span>
                      </button>

                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={handleApplyToProfile}
                        disabled={isApplyingToProfile}
                        style={{ justifyContent: "center", fontSize: "0.78rem", padding: "8px 0", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "var(--civic)" }}
                      >
                        <CheckCheck size={14} />
                        <span>{isApplyingToProfile ? "Applying..." : "Apply to Profile"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="nexora-card" style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
              <Sparkles size={36} color="var(--civic)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Ready to Screen
              </h3>
              <p style={{ fontSize: "0.85rem", marginTop: 6 }}>
                Click "Run Transparent ATS Screen" to evaluate your resume against the selected role.
                You'll receive full keyword attribution and constructive improvement guidance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
