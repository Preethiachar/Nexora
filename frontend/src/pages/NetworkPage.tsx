import React, { useState, useEffect } from "react";
import { UserCheck, UserPlus, Check, X, Sparkles } from "lucide-react";
import { PeerRecommendation } from "../types";
import { api } from "../services/api";

export const NetworkPage: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<PeerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNetwork = async () => {
    try {
      setLoading(true);
      const [connData, recsData] = await Promise.all([
        api.getConnections(),
        api.getPeerRecommendations(),
      ]);
      setConnections(connData.connections || []);
      setPendingRequests(connData.pending_requests || []);
      setRecommendations(recsData || []);
    } catch (err) {
      console.error("Failed to load network:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  const handleAccept = async (connId: number) => {
    try {
      await api.acceptConnection(connId);
      loadNetwork();
    } catch (err) {
      console.error("Failed to accept:", err);
    }
  };

  const handleReject = async (connId: number) => {
    try {
      await api.rejectConnection(connId);
      loadNetwork();
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  const handleConnect = async (userId: number) => {
    try {
      await api.sendConnectionRequest(userId);
      loadNetwork();
    } catch (err) {
      console.error("Failed to send request:", err);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
      {/* Pending Invitations */}
      {pendingRequests.length > 0 && (
        <div className="nexora-card" style={{ padding: 18, marginBottom: 16 }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>
            Invitations Received ({pendingRequests.length})
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingRequests.map((req) => (
              <div
                key={req.connection_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={req.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=r"}
                    alt={req.full_name}
                    style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.92rem" }}>
                      {req.full_name}
                    </span>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {req.headline}
                    </p>
                    <span className="badge-civic-hours" style={{ marginTop: 4 }}>
                      {req.civic_hours} Verified Hours
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-civic"
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => handleAccept(req.connection_id)}
                  >
                    <Check size={14} />
                    <span>Accept</span>
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    onClick={() => handleReject(req.connection_id)}
                  >
                    <X size={14} />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Peer Recommendations Section */}
      <div className="nexora-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Sparkles size={18} color="var(--primary)" />
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700 }}>
            People You May Want to Collaborate With
          </h3>
          <span className="badge-tag badge-tag-tech">Scikit-Learn NLP Matched</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {recommendations.map((rec) => (
            <div
              key={rec.user_id}
              style={{
                border: "1px solid var(--card-border)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <img
                src={rec.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=p"}
                alt={rec.full_name}
                style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }}
              />
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.92rem" }}>
                {rec.full_name}
              </span>
              <p
                style={{
                  fontSize: "0.76rem",
                  color: "var(--text-secondary)",
                  height: 34,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  margin: "4px 0 8px",
                }}
              >
                {rec.headline}
              </p>

              <span
                style={{
                  backgroundColor: "#ecfdf5",
                  color: "#047857",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              >
                {rec.match_score}% Match
              </span>

              <button
                className="btn-outline"
                style={{ width: "100%", justifyContent: "center", fontSize: "0.78rem" }}
                onClick={() => handleConnect(rec.user_id)}
              >
                <UserPlus size={14} />
                <span>Connect</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 1st Degree Connections Directory */}
      <div className="nexora-card" style={{ padding: 18 }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, marginBottom: 14 }}>
          My Connections ({connections.length})
        </h3>

        {connections.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {connections.map((c) => (
              <div
                key={c.connection_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={c.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=c"}
                    alt={c.full_name}
                    style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.92rem" }}>
                        {c.full_name}
                      </span>
                      <span className="badge-tag" style={{ fontSize: "0.68rem" }}>
                        1st
                      </span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {c.headline}
                    </p>
                  </div>
                </div>

                <button className="btn-outline-civic" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
                  <UserCheck size={14} />
                  <span>Message</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            No connections yet. Explore recommended student peers above to build your network!
          </p>
        )}
      </div>
    </div>
  );
};
