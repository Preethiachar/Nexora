import React, { useState, useEffect, useRef } from "react";
import { 
  Home, Users, Lightbulb, Briefcase, FileCheck, 
  MessageSquare, Bell, Search, Sparkles, UserCheck, X, Loader2, ExternalLink
} from "lucide-react";
import { UserSummary, SearchResults } from "../types";
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
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchCategory, setSearchCategory] = useState<"all" | "people" | "ideas" | "jobs">("all");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAllUsers()
      .then((users) => setAllUsers(users))
      .catch((err) => console.error("Error loading users:", err));
  }, []);

  const performSearch = async (term: string, cat = searchCategory) => {
    if (!term.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearching(true);
    setShowSearchDropdown(true);
    try {
      const res = await api.search(term, cat);
      setSearchResults(res);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(searchQuery);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

          <div ref={searchRef} style={{ position: "relative" }}>
            <form onSubmit={handleSearchSubmit} className="navbar-search" style={{ display: "flex", alignItems: "center" }}>
              <button
                type="submit"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 6px 0 0",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--civic)"
                }}
                title="Search Nexora"
              >
                <Search className="search-icon" size={16} />
              </button>
              <input
                type="text"
                placeholder="Search people, ideas, opportunities..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length > 1) {
                    performSearch(e.target.value);
                  } else {
                    setSearchResults(null);
                    setShowSearchDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 1) {
                    performSearch(searchQuery);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults(null);
                    setShowSearchDropdown(false);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0 4px" }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="btn-civic"
                style={{
                  padding: "4px 10px",
                  fontSize: "0.74rem",
                  marginLeft: 6,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                Search
              </button>
            </form>

            {/* Interactive Search Results Dropdown */}
            {showSearchDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  width: 440,
                  maxHeight: 460,
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                  border: "1px solid #e2e8f0",
                  zIndex: 2000,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}
              >
                {/* Search Categories Header */}
                <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "8px 12px", gap: 6, backgroundColor: "#f8fafc" }}>
                  {(["all", "people", "ideas", "jobs"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSearchCategory(cat);
                        performSearch(searchQuery, cat);
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        textTransform: "capitalize",
                        backgroundColor: searchCategory === cat ? "var(--civic)" : "#e2e8f0",
                        color: searchCategory === cat ? "#ffffff" : "var(--text-secondary)"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                  <div style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-muted)", alignSelf: "center" }}>
                    {searchResults ? `${searchResults.total} results` : ""}
                  </div>
                </div>

                {/* Results List */}
                <div style={{ padding: "8px 12px", overflowY: "auto", maxHeight: 380 }}>
                  {isSearching ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24, gap: 8, color: "var(--text-muted)" }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span style={{ fontSize: "0.8rem" }}>Searching platform...</span>
                    </div>
                  ) : !searchResults || searchResults.total === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      No matches found for "{searchQuery}".
                    </div>
                  ) : (
                    <div>
                      {/* People Results */}
                      {searchResults.users.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                            People ({searchResults.users.length})
                          </span>
                          {searchResults.users.map((u) => (
                            <div
                              key={u.id}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setActiveTab("network");
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "6px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                transition: "background 0.2s"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <img
                                src={u.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                                alt={u.full_name}
                                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{u.full_name}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {u.headline || u.university || u.role}
                                </div>
                              </div>
                              <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.65rem" }}>
                                {u.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ideas Results */}
                      {searchResults.ideas.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                            Student Ideas ({searchResults.ideas.length})
                          </span>
                          {searchResults.ideas.map((i) => (
                            <div
                              key={i.id}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setActiveTab("marketplace");
                              }}
                              style={{
                                padding: "6px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                transition: "background 0.2s"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--civic)" }}>{i.title}</div>
                                <span style={{ fontSize: "0.68rem", color: "#059669" }}>{i.spots_remaining} spots open</span>
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {i.summary}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Jobs Results */}
                      {searchResults.jobs.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                            Opportunities ({searchResults.jobs.length})
                          </span>
                          {searchResults.jobs.map((j) => (
                            <div
                              key={j.id}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setActiveTab("jobs");
                              }}
                              style={{
                                padding: "6px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                transition: "background 0.2s"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{j.title}</div>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{j.job_type}</span>
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                {j.company_name} • {j.location}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
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
