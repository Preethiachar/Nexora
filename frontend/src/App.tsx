import React, { useState, useEffect } from "react";
import { UserSummary } from "./types";
import { api, clearAuthToken } from "./services/api";
import { Navbar } from "./components/Navbar";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import { VerticalAISidebar } from "./components/VerticalAISidebar";
import { AuthPage } from "./pages/AuthPage";

// Pages
import { FeedPage } from "./pages/FeedPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { JobsPage } from "./pages/JobsPage";
import { ResumeScreeningPage } from "./pages/ResumeScreeningPage";
import { NetworkPage } from "./pages/NetworkPage";
import { MessagesPage } from "./pages/MessagesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [isAISidebarOpen, setIsAISidebarOpen] = useState<boolean>(true); // Open by default vertically to side
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const fetchCurrentUser = async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user);
    } catch (err) {
      console.error("No active session:", err);
      setCurrentUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getNotifications();
      setUnreadNotifications(res.unread_count || 0);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
    }
  }, [currentUser]);

  const handleSignOut = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: UserSummary) => {
    setCurrentUser(user);
    fetchUnreadCount();
  };

  const handleUserSwitched = (user: UserSummary) => {
    setCurrentUser(user);
    fetchUnreadCount();
  };

  // If not logged in, gate the platform behind the AuthPage
  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f2ef" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--text-secondary)" }}>
          Loading Nexora...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-container" style={{ paddingRight: isAISidebarOpen ? 380 : 0, transition: "padding-right 0.3s ease" }}>
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onUserSwitched={handleUserSwitched}
        onOpenAIAssistant={() => setIsAISidebarOpen(true)}
        unreadNotifications={unreadNotifications}
        onSignOut={handleSignOut}
        onOpenAuth={() => {}}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: "20px 0" }}>
        {activeTab === "feed" ? (
          <div className="main-layout">
            <LeftSidebar currentUser={currentUser} onNavigate={setActiveTab} />
            <FeedPage currentUser={currentUser} />
            <RightSidebar onNavigate={setActiveTab} />
          </div>
        ) : activeTab === "marketplace" ? (
          <MarketplacePage onNavigate={setActiveTab} />
        ) : activeTab === "jobs" ? (
          <JobsPage />
        ) : activeTab === "resume-screener" ? (
          <ResumeScreeningPage />
        ) : activeTab === "network" ? (
          <NetworkPage />
        ) : activeTab === "messages" ? (
          <MessagesPage currentUser={currentUser} />
        ) : activeTab === "notifications" ? (
          <NotificationsPage
            onNotificationRead={fetchUnreadCount}
            onNavigate={setActiveTab}
          />
        ) : activeTab === "profile" ? (
          <ProfilePage
            currentUser={currentUser}
            onProfileUpdated={fetchCurrentUser}
          />
        ) : (
          <FeedPage currentUser={currentUser} />
        )}
      </div>

      {/* Vertical AI Copilot Sidebar docked to the side */}
      <VerticalAISidebar
        isOpen={isAISidebarOpen}
        onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
      />
    </div>
  );
};

export default App;
