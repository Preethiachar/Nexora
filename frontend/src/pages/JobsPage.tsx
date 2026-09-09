import React, { useState, useEffect } from "react";
import { Briefcase, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Job, JobApplication } from "../types";
import { api } from "../services/api";
import { JobCard } from "../components/JobCard";

export const JobsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"browse" | "applications">("browse");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTypeFilter, setJobTypeFilter] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsData, appsData] = await Promise.all([
        api.getJobs(jobTypeFilter !== "all" ? jobTypeFilter : undefined),
        api.getMyApplications(),
      ]);
      setJobs(jobsData);
      setMyApplications(appsData);
    } catch (err) {
      console.error("Failed to load jobs data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobTypeFilter]);

  const pipelineStages = [
    { key: "applied", label: "Applied" },
    { key: "under_review", label: "Under Review" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "interview", label: "Interview" },
    { key: "selected", label: "Selected" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
      {/* Page Header */}
      <div className="nexora-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 800 }}>
              Civic & Career Opportunities
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Fellowships, internships, civic volunteering roles, and jobs with transparent AI screening feedback.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`btn-ghost ${activeSubTab === "browse" ? "btn-outline" : ""}`}
              onClick={() => setActiveSubTab("browse")}
            >
              <Briefcase size={16} />
              <span>Browse ({jobs.length})</span>
            </button>

            <button
              className={`btn-ghost ${activeSubTab === "applications" ? "btn-outline-civic" : ""}`}
              onClick={() => setActiveSubTab("applications")}
            >
              <CheckCircle2 size={16} />
              <span>My Applications ({myApplications.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === "browse" ? (
        <>
          {/* Opportunity Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Opportunities" },
              { id: "fellowship", label: "Civic Tech Fellowships" },
              { id: "internship", label: "Internships" },
              { id: "volunteer", label: "Volunteer Initiatives" },
            ].map((f) => (
              <button
                key={f.id}
                className={`btn-ghost ${jobTypeFilter === f.id ? "btn-outline-civic" : ""}`}
                style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                onClick={() => setJobTypeFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Job List */}
          {loading ? (
            <div className="nexora-card" style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
              Loading curated student & civic opportunities...
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <JobCard key={job.id} job={job} onRefresh={loadData} />
            ))
          ) : (
            <div className="nexora-card" style={{ padding: 32, textAlign: "center" }}>
              <p style={{ color: "var(--text-secondary)" }}>No opportunities found under this filter.</p>
            </div>
          )}
        </>
      ) : (
        /* Application Pipeline Tracking */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {myApplications.length > 0 ? (
            myApplications.map((app) => (
              <div key={app.id} className="nexora-card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700 }}>
                      {app.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {app.company_name} • {app.location}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        backgroundColor: "#ecfdf5",
                        color: "#047857",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        padding: "4px 10px",
                        borderRadius: 12,
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      {app.ats_score}% ATS Match
                    </span>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                      <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                      Applied recently
                    </p>
                  </div>
                </div>

                {/* Status pipeline indicator */}
                <div style={{ display: "flex", gap: 6, margin: "14px 0" }}>
                  {pipelineStages.map((stg) => {
                    const isPassed =
                      stg.key === app.status ||
                      (app.status === "shortlisted" && stg.key === "applied") ||
                      (app.status === "interview" && ["applied", "under_review", "shortlisted"].includes(stg.key));
                    return (
                      <div
                        key={stg.key}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          padding: "6px 2px",
                          borderRadius: 6,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          backgroundColor: isPassed ? "var(--primary-light)" : "#f1f5f9",
                          color: isPassed ? "var(--primary)" : "var(--text-muted)",
                          border: isPassed ? "1px solid #bfdbfe" : "1px solid transparent",
                        }}
                      >
                        {stg.label}
                      </div>
                    );
                  })}
                </div>

                {/* Feedback Note */}
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    borderLeft: "3px solid var(--civic)",
                    padding: "8px 12px",
                    borderRadius: "0 6px 6px 0",
                    fontSize: "0.8rem",
                    color: "#334155",
                  }}
                >
                  <Sparkles size={13} color="var(--civic)" style={{ display: "inline", marginRight: 6 }} />
                  <strong>Transparent Feedback:</strong> {app.feedback}
                </div>
              </div>
            ))
          ) : (
            <div className="nexora-card" style={{ padding: 32, textAlign: "center" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: 10 }}>
                You haven't applied to any opportunities yet.
              </p>
              <button className="btn-primary" onClick={() => setActiveSubTab("browse")}>
                Explore Opportunities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
