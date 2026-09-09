import React, { useState, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { ConversationItem, MessageItem, UserSummary } from "../types";
import { api } from "../services/api";

interface MessagesPageProps {
  currentUser: UserSummary | null;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activePeerId, setActivePeerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConversations()
      .then((convs) => {
        setConversations(convs);
        if (convs.length > 0) {
          setActivePeerId(convs[0].peer.id);
        }
      })
      .catch((err) => console.error("Error loading conversations:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activePeerId) return;
    api.getMessages(activePeerId)
      .then((msgs) => setMessages(msgs))
      .catch((err) => console.error("Error loading messages:", err));
  }, [activePeerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePeerId) return;

    try {
      const sent = await api.sendMessage(activePeerId, inputText.trim());
      setMessages((prev) => [...prev, sent]);
      setInputText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const activeConversation = conversations.find((c) => c.peer.id === activePeerId);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
      <div
        className="nexora-card"
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          height: 600,
          overflow: "hidden",
        }}
      >
        {/* Left: Conversations List */}
        <div style={{ borderRight: "1px solid var(--divider)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--divider)" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700 }}>
              Messaging
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <p style={{ padding: 16, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Loading conversations...
              </p>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const isSelected = conv.peer.id === activePeerId;
                return (
                  <div
                    key={conv.conversation_id}
                    onClick={() => setActivePeerId(conv.peer.id)}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
                    }}
                  >
                    <img
                      src={conv.peer.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=c"}
                      alt={conv.peer.full_name}
                      style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {conv.peer.full_name}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {conv.last_message}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ padding: 16, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                No active conversations yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--divider)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <img
                  src={activeConversation.peer.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=h"}
                  alt={activeConversation.peer.full_name}
                  style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700 }}>
                    {activeConversation.peer.full_name}
                  </h4>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                    {activeConversation.peer.headline}
                  </p>
                </div>
              </div>

              {/* Messages Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {messages.map((m) => {
                  const isMine = m.sender_id === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMine ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: isMine ? "var(--primary)" : "#f1f5f9",
                          color: isMine ? "#ffffff" : "#1e293b",
                          padding: "10px 14px",
                          borderRadius: 14,
                          fontSize: "0.88rem",
                          lineHeight: 1.4,
                        }}
                      >
                        {m.content}
                      </div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          display: "block",
                          textAlign: isMine ? "right" : "left",
                          marginTop: 2,
                          padding: "0 4px",
                        }}
                      >
                        Sent
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--divider)",
                  display: "flex",
                  gap: 8,
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Write a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: "0 18px" }}>
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
              }}
            >
              <MessageSquare size={42} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
