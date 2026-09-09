import React, { useEffect, useState } from "react";
import { TrendingUp, UserPlus, Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { PeerRecommendation } from "../types";
import { api } from "../services/api";

interface RightSidebarProps {
  onNavigate: (tab: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onNavigate }) => {
  const [recommendations, setRecommendations] = useState<PeerRecommendation[]>([]);
  const [connectingMap, setConnectingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.getPeerRecommendations()
      .then((recs) => setRecommendations(recs.slice(0, 3)))
      .catch((err) => console.error("Failed to load peer recommendations:", err));
  }, []);

  const handleConnect = async (userId: number) => {
    setConnectingMap((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.sendConnectionRequest(userId);
    } catch (err) {
      console.error("Connection request failed:", err);
    }
  };

  return (
    <aside className="right-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Student Idea Spotlight */}
      <div className="nexora-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: "var(--accent-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
            }}
          >
            <Lightbulb size={16} />
          </div>
          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700 }}>
            Idea Marketplace Spotlight
          </h4>
        </div>

        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
          <strong>CivicClean:</strong> AI-powered trash hotspot mapping for student volunteer drives.
        </p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
          <span className="badge-tag badge-tag-civic">Civic Tech</span>
          <span className="badge-tag">React</span>
          <span className="badge-tag">Python</span>
        </div>

        <button
          className="btn-outline-civic"
          style={{ width: "100%", justifyContent: "center", fontSize: "0.78rem" }}
          onClick={() => onNavigate("marketplace")}
        >
          <span>Explore Pitches</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* AI-Powered Peer Recommendations */}
      <div className="nexora-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Sparkles size={16} color="var(--primary)" />
          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700 }}>
            AI Recommended Peers
          </h4>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <div key={rec.user_id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <img
                  src={rec.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=peer"}
                  alt={rec.full_name}
                  style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {rec.full_name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        backgroundColor: "#ecfdf5",
                        color: "#047857",
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontWeight: 700,
                      }}
                      title="Scikit-Learn NLP TF-IDF Match Score"
                    >
                      {rec.match_score}% match
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {rec.headline}
                  </p>

                  <div style={{ marginTop: 4 }}>
                    <button
                      className="btn-outline"
                      style={{ padding: "3px 10px", fontSize: "0.72rem" }}
                      disabled={connectingMap[rec.user_id]}
                      onClick={() => handleConnect(rec.user_id)}
                    >
                      <UserPlus size={12} />
                      <span>{connectingMap[rec.user_id] ? "Pending" : "Connect"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Loading recommended student collaborators...
            </p>
          )}
        </div>
      </div>

      {/* Trending Civic Topics */}
      <div className="nexora-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <TrendingUp size={16} color="var(--civic)" />
          <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700 }}>
            Civic & Youth Trends
          </h4>
        </div>

        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          <li>
            <a
              href="#trend"
              style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.82rem", fontWeight: 600 }}
            >
              #NationalCivicHackathon
            </a>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>3,420 students participating</p>
          </li>
          <li>
            <a
              href="#trend"
              style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.82rem", fontWeight: 600 }}
            >
              #ClimateDataChallenge
            </a>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>1,890 updates • Trending in Tech</p>
          </li>
          <li>
            <a
              href="#trend"
              style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.82rem", fontWeight: 600 }}
            >
              #DigitalSafetyCurriculum
            </a>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Youth volunteers teaching 40+ schools</p>
          </li>
        </ul>
      </div>
    </aside>
  );
};
