import React from "react";
import { Award, CheckCircle2, Bookmark, Users, Lightbulb } from "lucide-react";
import { UserSummary } from "../types";

interface LeftSidebarProps {
  currentUser: UserSummary | null;
  onNavigate: (tab: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentUser, onNavigate }) => {
  const civicHours = currentUser?.civic_hours || 0;
  const progressPercent = Math.min(100, Math.round((civicHours / 200) * 100));

  return (
    <aside className="left-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile Overview Card */}
      <div className="nexora-card" style={{ textAlign: "center" }}>
        {/* Banner */}
        <div
          style={{
            height: 60,
            background: "linear-gradient(135deg, #0a66c2 0%, #059669 100%)",
            position: "relative",
          }}
        />

        <div style={{ padding: "0 16px 16px", marginTop: -30 }}>
          <img
            src={currentUser?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=nexora"}
            alt={currentUser?.full_name}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "3px solid #ffffff",
              boxShadow: "var(--shadow-sm)",
              objectFit: "cover",
              cursor: "pointer",
            }}
            onClick={() => onNavigate("profile")}
          />

          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              fontWeight: 700,
              marginTop: 6,
              cursor: "pointer",
            }}
            onClick={() => onNavigate("profile")}
          >
            {currentUser?.full_name}
          </h3>

          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.3 }}>
            {currentUser?.headline || "Nexora Changemaker"}
          </p>

          <div style={{ marginTop: 10 }}>
            <span className="badge-civic-hours">
              <CheckCircle2 size={13} color="#059669" />
              <span>{civicHours} Verified Civic Hours</span>
            </span>
          </div>
        </div>

        {/* Civic Progress Meter */}
        <div
          style={{
            borderTop: "1px solid var(--divider)",
            padding: "12px 16px",
            textAlign: "left",
            backgroundColor: "#fcfdfe",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 6 }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Civic Impact Tier</span>
            <span style={{ color: "var(--civic)", fontWeight: 700 }}>{civicHours} / 200h</span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: "100%", height: 6, backgroundColor: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
                borderRadius: 4,
              }}
            />
          </div>

          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>
            {200 - civicHours > 0 ? `${200 - civicHours}h until Gold Civic Fellow badge` : "Gold Civic Fellow unlocked!"}
          </p>
        </div>
      </div>

      {/* Quick Discovery Navigation Card */}
      <div className="nexora-card" style={{ padding: "12px 0" }}>
        <div
          className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "10px 16px", fontSize: "0.82rem" }}
          onClick={() => onNavigate("marketplace")}
        >
          <Lightbulb size={16} color="var(--accent)" />
          <span>Student Idea Marketplace</span>
        </div>

        <div
          className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "10px 16px", fontSize: "0.82rem" }}
          onClick={() => onNavigate("jobs")}
        >
          <Award size={16} color="var(--primary)" />
          <span>Civic & Tech Opportunities</span>
        </div>

        <div
          className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "10px 16px", fontSize: "0.82rem" }}
          onClick={() => onNavigate("network")}
        >
          <Users size={16} color="var(--civic)" />
          <span>My Network & Alumni</span>
        </div>

        <div
          className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "10px 16px", fontSize: "0.82rem" }}
          onClick={() => onNavigate("resume-screener")}
        >
          <Bookmark size={16} color="#6366f1" />
          <span>AI Resume ATS Screener</span>
        </div>
      </div>
    </aside>
  );
};
