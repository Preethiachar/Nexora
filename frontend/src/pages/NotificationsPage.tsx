import React, { useState, useEffect } from "react";
import { Bell, Check, UserCheck, MessageSquare, Award, Clock, Users } from "lucide-react";
import { NotificationItem } from "../types";
import { api } from "../services/api";

interface NotificationsPageProps {
  onNotificationRead: () => void;
  onNavigate: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onNotificationRead,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onNotificationRead();
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "connection":
        return <UserCheck size={18} color="var(--primary)" />;
      case "group_invite":
        return <Users size={18} color="var(--civic)" />;
      case "idea_mentor":
        return <Award size={18} color="#eab308" />;
      case "idea_apply":
        return <Award size={18} color="var(--accent)" />;
      case "job_update":
        return <Check size={18} color="var(--civic)" />;
      default:
        return <Bell size={18} color="var(--primary)" />;
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 16px" }}>
      <div className="nexora-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
            Notifications
          </h2>
          <button className="btn-ghost" style={{ fontSize: "0.8rem" }} onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        </div>
      </div>

      <div className="nexora-card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>
            Loading notifications...
          </p>
        ) : notifications.length > 0 ? (
          <div>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.link_url) {
                    onNavigate(n.link_url.replace("/", ""));
                  }
                }}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--divider)",
                  backgroundColor: n.is_read ? "#ffffff" : "#f0fdf4",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                }}
              >
                <div style={{ paddingTop: 2 }}>{getIcon(n.notification_type)}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", fontWeight: 700 }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={11} />
                      Just now
                    </span>
                  </div>

                  <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
            No new notifications right now.
          </p>
        )}
      </div>
    </div>
  );
};
