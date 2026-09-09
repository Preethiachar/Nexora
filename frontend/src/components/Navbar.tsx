import React, { useState, useEffect } from "react";
import { 
  Home, Users, Lightbulb, Briefcase, FileCheck, 
  MessageSquare, Bell, Search, Sparkles, UserCheck 
} from "lucide-react";
import { UserSummary } from "../types";
import { api } from "../services/api";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserSummary | null;
  onUserSwitched: (user: UserSummary) => void;
  onOpenAIAssistant: () => void;
  unreadNotifications: number;
  onSignOut: () => void;
  onOpenAuth: (mode: "login" | "register") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onUserSwitched,
  onOpenAIAssistant,
  unreadNotifications,
  onSignOut,
  onOpenAuth,
}) => {
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.getAllUsers()
      .then((users) => setAllUsers(users))
      .catch((err) => console.error("Error loading users:", err));
  }, []);

  const handleUserSelect = async (userId: number) => {
    try {
      const resp = await api.switchUser(userId);
      localStorage.setItem("nexora_token", resp.access_token);
      onUserSwitched(resp.user);
    } catch (err) {
      console.error("Failed to switch user:", err);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand & Search */}
        <div className="navbar-brand-group">
          <div 
            className="logo-badge" 
            onClick={() => setActiveTab("feed")} 
            style={{ cursor: "pointer" }}
          >
            <div className="logo-icon-box">N</div>
            <span>Nexora</span>
          </div>

          <div className="navbar-search">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search people, ideas, jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation links */}
        <nav className="navbar-nav">
          <div
            className={`nav-item ${activeTab === "feed" ? "active" : ""}`}
            onClick={() => setActiveTab("feed")}
          >
            <Home size={20} />
            <span>Home</span>
          </div>

          <div
            className={`nav-item ${activeTab === "network" ? "active" : ""}`}
            onClick={() => setActiveTab("network")}
          >
            <Users size={20} />
            <span>My Network</span>
          </div>

          <div
            className={`nav-item ${activeTab === "marketplace" ? "active" : ""}`}
            onClick={() => setActiveTab("marketplace")}
            style={{ color: activeTab === "marketplace" ? "var(--accent)" : undefined }}
          >
            <Lightbulb size={20} />
            <span>Idea Market</span>
          </div>

          <div
            className={`nav-item ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            <Briefcase size={20} />
            <span>Opportunities</span>
          </div>

          <div
            className={`nav-item ${activeTab === "resume-screener" ? "active" : ""}`}
            onClick={() => setActiveTab("resume-screener")}
            style={{ color: activeTab === "resume-screener" ? "var(--civic)" : undefined }}
          >
            <FileCheck size={20} />
            <span>AI ATS Screen</span>
          </div>

          <div
            className={`nav-item ${activeTab === "messages" ? "active" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare size={20} />
            <span>Messaging</span>
          </div>

          <div
            className={`nav-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={20} />
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <span className="nav-item-badge">{unreadNotifications}</span>
            )}
          </div>

          <div
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <UserCheck size={20} />
            )}
            <span>Me</span>
          </div>
        </nav>

        {/* Auth / User & AI Copilot Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Vertical AI Copilot Toggle Button */}
          <button
            className="btn-civic"
            onClick={onOpenAIAssistant}
            style={{ padding: "6px 14px", fontSize: "0.82rem" }}
            title="Open Vertical Nexora AI Copilot"
          >
            <Sparkles size={16} />
            <span>AI Copilot</span>
          </button>

          {/* If Logged In: Show User Name & Logout Button */}
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 8, borderLeft: "1px solid var(--divider)" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                onClick={() => setActiveTab("profile")}
                title="View Profile"
              >
                <img
                  src={currentUser.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                  alt={currentUser.full_name}
                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.2 }}>
                    {currentUser.full_name}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--civic)", fontWeight: 600 }}>
                    {currentUser.civic_hours ? `${currentUser.civic_hours}h Civic` : "Active"}
                  </span>
                </div>
              </div>

              {/* Explicit Logout Button */}
              <button
                className="btn-ghost"
                style={{
                  fontSize: "0.78rem",
                  padding: "6px 12px",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 600,
                }}
                onClick={onSignOut}
                title="Log out of Nexora"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
