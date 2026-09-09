import React, { useState } from "react";
import { MapPin, DollarSign, Sparkles, CheckCircle2 } from "lucide-react";
import { Job } from "../types";
import { ApplyJobModal } from "./ApplyJobModal";

interface JobCardProps {
  job: Job;
  onRefresh: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onRefresh }) => {
  const [showApplyModal, setShowApplyModal] = useState(false);

  const isApplied = !!job.user_application;

  return (
    <div className="nexora-card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 14 }}>
        {/* Company Avatar / Logo */}
        <img
          src={job.company_logo || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80"}
          alt={job.company_name}
          style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0" }}
        />

        <div style={{ flex: 1 }}>
          {/* Title & Organization */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700 }}>
                {job.title}
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                {job.company_name}
              </p>
            </div>

            {/* Opportunity Type Pill */}
            <span
              className={`badge-tag ${
                job.job_type === "volunteer"
                  ? "badge-tag-civic"
                  : job.job_type === "fellowship"
                  ? "badge-tag-tech"
                  : ""
              }`}
              style={{ textTransform: "capitalize" }}
            >
              {job.job_type}
            </span>
          </div>

          {/* Meta Details */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "8px 0", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={13} />
              <span>{job.location} {job.is_remote ? "(Remote)" : ""}</span>
            </span>

            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <DollarSign size={13} />
              <span>{job.salary_range}</span>
            </span>

            <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
              {job.cause_area}
            </span>
          </div>

          {/* Description */}
          <p style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.5, margin: "10px 0" }}>
            {job.description}
          </p>

          {/* Required Skills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {job.skills_required.map((skill, idx) => (
              <span key={idx} className="badge-tag" style={{ fontSize: "0.72rem" }}>
                {skill}
              </span>
            ))}
          </div>

          {/* Actions Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--divider)" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {job.total_applicants} applicants • Transparent AI Screening
            </span>

            {isApplied ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--civic)", fontWeight: 700, fontSize: "0.82rem" }}>
                <CheckCircle2 size={16} />
                <span>
                  Applied ({job.user_application?.status?.replace("_", " ").toUpperCase()}) • {job.user_application?.ats_score}% ATS Match
                </span>
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                onClick={() => setShowApplyModal(true)}
              >
                <Sparkles size={14} />
                <span>Apply & Check ATS Match</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showApplyModal && (
        <ApplyJobModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onApplied={onRefresh}
        />
      )}
    </div>
  );
};
