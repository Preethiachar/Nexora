import React, { useState, useEffect, useRef } from "react";
import { 
  Send, MessageSquare, Sparkles, Mail, Copy, Check, 
  ArrowRight, UserCheck, X, Search, Plus, UserPlus, 
  Users, MessageCircle, RefreshCw, SendHorizontal,
  Paperclip, FileText, Download, Award, Shield, FileUp, Loader2
} from "lucide-react";
import { ConversationItem, MessageItem, UserSummary, IdeaGroupItem, GroupMessageItem } from "../types";
import { api, getFileUrl } from "../services/api";

interface PeerInfo {
  id: number;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  email?: string;
  role?: string;
}

interface MessagesPageProps {
  currentUser: UserSummary | null;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [activePeer, setActivePeer] = useState<PeerInfo | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "groups" | "directory">("chats");

  // Group Messaging & Document Upload state
  const [groups, setGroups] = useState<IdeaGroupItem[]>([]);
  const [activeGroup, setActiveGroup] = useState<IdeaGroupItem | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessageItem[]>([]);
  const [groupInputText, setGroupInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Email Generator state
  const [showAiMailModal, setShowAiMailModal] = useState(false);
  const [mailType, setMailType] = useState("internship_inquiry");
  const [mailTone, setMailTone] = useState("professional");
  const [mailKeyNotes, setMailKeyNotes] = useState("");
  const [isGeneratingMail, setIsGeneratingMail] = useState(false);
  const [generatedMail, setGeneratedMail] = useState<{ subject: string; body: string } | null>(null);
  const [copiedMail, setCopiedMail] = useState(false);
  const [isSendingMailDirectly, setIsSendingMailDirectly] = useState(false);

  // Load conversations, user directory & project groups
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [convs, users, userGroups] = await Promise.all([
        api.getConversations().catch(() => []),
        api.getAllUsers().catch(() => []),
        api.getUserGroups().catch(() => []),
      ]);

      setConversations(convs);
      setGroups(userGroups);
      if (userGroups.length > 0) {
        setActiveGroup(userGroups[0]);
      }

      const peers = users.filter((u: UserSummary) => u.id !== currentUser?.id);
      setAllUsers(peers);

      if (convs.length > 0) {
        setActivePeer({
          id: convs[0].peer.id,
          full_name: convs[0].peer.full_name,
          avatar_url: convs[0].peer.avatar_url,
          headline: convs[0].peer.headline,
        });
        setActiveTab("chats");
      } else if (userGroups.length > 0) {
        setActiveTab("groups");
      } else {
        // If no conversations exist yet, automatically show directory so user can pick whom to mail!
        setActiveTab("directory");
        if (peers.length > 0) {
          setActivePeer({
            id: peers[0].id,
            full_name: peers[0].full_name,
            avatar_url: peers[0].avatar_url,
            headline: peers[0].headline,
            email: peers[0].email,
            role: peers[0].role,
          });
        }
      }
    } catch (err) {
      console.error("Error initializing messaging:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  // Load messages whenever activePeer changes
  useEffect(() => {
    if (!activePeer) {
      setMessages([]);
      return;
    }
    api.getMessages(activePeer.id)
      .then((msgs) => setMessages(msgs))
      .catch((err) => console.error("Error loading messages:", err));
  }, [activePeer?.id]);

  // Load group messages whenever activeGroup changes
  useEffect(() => {
    if (!activeGroup) {
      setGroupMessages([]);
      return;
    }
    api.getGroupMessages(activeGroup.id)
      .then((msgs) => setGroupMessages(msgs))
      .catch((err) => console.error("Error loading group messages:", err));
  }, [activeGroup?.id]);

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    if (!groupInputText.trim() && !selectedFile) return;

    try {
      setIsUploadingFile(true);
      let sentMsg: GroupMessageItem;
      if (selectedFile) {
        sentMsg = await api.uploadGroupDocument(activeGroup.id, selectedFile, groupInputText.trim());
      } else {
        sentMsg = await api.sendGroupMessage(activeGroup.id, groupInputText.trim());
      }
      setGroupMessages((prev) => [...prev, sentMsg]);
      setGroupInputText("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      api.getUserGroups().then((g) => setGroups(g));
    } catch (err) {
      console.error("Failed to send group message:", err);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const getFileBadge = (fileType?: string | null) => {
    const ext = (fileType || "").toLowerCase();
    if (ext === "pdf") {
      return { label: "PDF Document", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    }
    if (ext === "doc" || ext === "docx") {
      return { label: "Word Document", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
    }
    if (ext === "ppt" || ext === "pptx") {
      return { label: "PowerPoint Presentation", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };
    }
    return { label: "Document Attachment", color: "#475569", bg: "#f8fafc", border: "#e2e8f0" };
  };

  const selectContact = (contact: PeerInfo) => {
    setActivePeer(contact);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePeer) return;

    try {
      const sent = await api.sendMessage(activePeer.id, inputText.trim());
      setMessages((prev) => [...prev, sent]);
      setInputText("");

      // Refresh conversations list so new chat shows in left sidebar
      api.getConversations().then((c) => setConversations(c));
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleGenerateAiMail = async () => {
    if (!activePeer) return;
    setIsGeneratingMail(true);
    setGeneratedMail(null);
    try {
      const res = await api.generateEmail({
        recipient_name: activePeer.full_name,
        recipient_headline: activePeer.headline,
        mail_type: mailType,
        tone: mailTone,
        key_notes: mailKeyNotes,
      });
      setGeneratedMail(res);
    } catch (err) {
      console.error("Failed to generate AI email:", err);
    } finally {
      setIsGeneratingMail(false);
    }
  };

  const handleCopyMail = () => {
    if (!generatedMail) return;
    const textToCopy = `Subject: ${generatedMail.subject}\n\n${generatedMail.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedMail(true);
    setTimeout(() => setCopiedMail(false), 2000);
  };

  const handleInsertIntoChat = () => {
    if (!generatedMail) return;
    const combined = `[Subject: ${generatedMail.subject}]\n\n${generatedMail.body}`;
    setInputText(combined);
    setShowAiMailModal(false);
  };

  const handleSendMailDirectly = async () => {
    if (!generatedMail || !activePeer) return;
    setIsSendingMailDirectly(true);
    try {
      const combined = `📨 **${generatedMail.subject}**\n\n${generatedMail.body}`;
      const sent = await api.sendMessage(activePeer.id, combined);
      setMessages((prev) => [...prev, sent]);
      setShowAiMailModal(false);
      setGeneratedMail(null);
      api.getConversations().then((c) => setConversations(c));
    } catch (err) {
      console.error("Failed to send generated email directly:", err);
    } finally {
      setIsSendingMailDirectly(false);
    }
  };

  // Filtered lists based on search
  const filteredUsers = allUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.headline && u.headline.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredConversations = conversations.filter(
    (c) =>
      c.peer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message && c.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 16px" }}>
      <div
        className="nexora-card"
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          height: 680,
          overflow: "hidden",
        }}
      >
        {/* ================= LEFT SIDEBAR: WHOM TO MAIL & CONVERSATIONS ================= */}
        <div style={{ borderRight: "1px solid var(--divider)", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700 }}>
                Messaging & Mail
              </h3>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setActiveTab("directory")}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--primary)",
                  backgroundColor: "#eff6ff",
                }}
                title="Start a new chat with anyone in the directory"
              >
                <Plus size={14} />
                <span>New Message</span>
              </button>
            </div>

            <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Logged in as: <strong>{currentUser?.full_name || "User"}</strong> (Sender)
            </p>

            {/* Search Input */}
            <div style={{ marginTop: 10, position: "relative" }}>
              <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: 10 }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search whom to message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, fontSize: "0.82rem", padding: "6px 10px 6px 30px" }}
              />
            </div>

            {/* Tab switchers: Active Chats vs Groups vs Directory */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTab("chats")}
                style={{
                  padding: "6px 2px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === "chats" ? "var(--primary)" : "#f1f5f9",
                  color: activeTab === "chats" ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <MessageCircle size={12} />
                <span>Direct ({conversations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("groups")}
                style={{
                  padding: "6px 2px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === "groups" ? "var(--civic)" : "#f1f5f9",
                  color: activeTab === "groups" ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <Users size={12} />
                <span>Groups ({groups.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("directory")}
                style={{
                  padding: "6px 2px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === "directory" ? "var(--primary)" : "#f1f5f9",
                  color: activeTab === "directory" ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <UserCheck size={12} />
                <span>People</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <p style={{ padding: 16, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Loading contacts & messages...
              </p>
            ) : activeTab === "groups" ? (
              /* TAB: PROJECT GROUPS */
              groups.length > 0 ? (
                groups.map((grp) => {
                  const isSelected = activeGroup?.id === grp.id;
                  return (
                    <div
                      key={grp.id}
                      onClick={() => setActiveGroup(grp)}
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#f0fdf4" : "transparent",
                        borderLeft: isSelected ? "3px solid var(--civic)" : "3px solid transparent",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          flexShrink: 0,
                        }}
                      >
                        👥
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {grp.name}
                          </span>
                          <span className="badge-tag" style={{ fontSize: "0.6rem", backgroundColor: "#e2e8f0", textTransform: "capitalize" }}>
                            {grp.my_role}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--civic)", fontWeight: 600, marginTop: 1 }}>
                          {grp.members_count} team members
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: "2px 0 0" }}>
                          {grp.last_message}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <Users size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    No project groups yet
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
                    Pitch an idea in <strong>Idea Market</strong> and accept a team member application — a dedicated collaboration group will be created automatically!
                  </p>
                </div>
              )
            ) : activeTab === "chats" ? (
              /* TAB 1: CONVERSATIONS LIST */
              conversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isSelected = activePeer?.id === conv.peer.id;
                  return (
                    <div
                      key={conv.conversation_id}
                      onClick={() => selectContact(conv.peer)}
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                        borderLeft: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
                        transition: "background-color 0.15s",
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <img
                          src={conv.peer.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=c"}
                          alt={conv.peer.full_name}
                          style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: "#10b981",
                            border: "2px solid #ffffff",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontSize: "0.86rem",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {conv.peer.full_name}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
                          Recipient • {conv.peer.headline || "Nexora Member"}
                        </p>
                        <p
                          style={{
                            fontSize: "0.76rem",
                            color: "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginTop: 2,
                          }}
                        >
                          {conv.last_message}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 18, textAlign: "center" }}>
                  <MessageSquare size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    No active conversations yet
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                    Choose anyone from the Contacts Directory below to start messaging or generating an AI email!
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setActiveTab("directory")}
                    style={{ marginTop: 10, fontSize: "0.78rem", padding: "6px 12px", width: "100%", justifyContent: "center" }}
                  >
                    <UserPlus size={14} />
                    <span>View Contacts to Message</span>
                  </button>
                </div>
              )
            ) : (
              /* TAB 2: WHOM TO MAIL / CONTACTS DIRECTORY */
              <div>
                <div style={{ padding: "8px 14px", backgroundColor: "#f8fafc", borderBottom: "1px solid var(--divider)" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                    SELECT RECIPIENT TO MESSAGE OR MAIL:
                  </span>
                </div>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isSelected = activePeer?.id === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => selectContact(user)}
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#eff6ff" : "transparent",
                          borderLeft: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.15s",
                        }}
                      >
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                          alt={user.full_name}
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", fontWeight: 700 }}>
                              {user.full_name}
                            </span>
                            <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.62rem" }}>
                              {user.role}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                            {user.headline || "Nexora Innovator"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ padding: 16, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    No matching contacts found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: ACTIVE CHAT & SENDER/RECEIVER HEADER ================= */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#ffffff" }}>
          {activeTab === "groups" ? (
            activeGroup ? (
              <>
                {/* GROUP TOP HEADER */}
                <div
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--divider)",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      👥
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                          {activeGroup.name}
                        </span>
                        <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.62rem" }}>
                          Team Collaboration Group
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span>Project: <strong>{activeGroup.idea_title}</strong></span>
                        <span>•</span>
                        <span>{activeGroup.members_count} Members</span>
                      </div>
                    </div>
                  </div>

                  {/* Members Avatars preview */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <div style={{ display: "flex", marginRight: 4 }}>
                      {activeGroup.members.slice(0, 4).map((m, idx) => (
                        <img
                          key={m.id}
                          src={m.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=gm"}
                          alt={m.full_name}
                          title={`${m.full_name} (${m.role})`}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            marginLeft: idx > 0 ? -8 : 0,
                            border: "2px solid #ffffff",
                            objectFit: "cover",
                          }}
                        />
                      ))}
                    </div>
                    <span className="badge-tag" style={{ fontSize: "0.68rem", backgroundColor: "#f0fdf4", color: "#166534", textTransform: "capitalize" }}>
                      Your Role: {activeGroup.my_role}
                    </span>
                  </div>
                </div>

                {/* GROUP MESSAGES BODY */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    backgroundColor: "#fafbfc",
                  }}
                >
                  {groupMessages.length > 0 ? (
                    groupMessages.map((m) => {
                      const isMine = m.sender_id === currentUser?.id;
                      const badge = m.file_url ? getFileBadge(m.file_type) : null;

                      return (
                        <div
                          key={m.id}
                          style={{
                            alignSelf: isMine ? "flex-end" : "flex-start",
                            maxWidth: "75%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMine ? "flex-end" : "flex-start",
                          }}
                        >
                          {/* Sender info */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, padding: "0 4px" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: isMine ? "var(--civic)" : "#334155" }}>
                              {isMine ? "You" : m.sender_name}
                            </span>
                            <span
                              className="badge-tag"
                              style={{
                                fontSize: "0.58rem",
                                padding: "0 4px",
                                textTransform: "capitalize",
                                backgroundColor: m.sender_role === "lead" ? "#dcfce7" : m.sender_role === "mentor" ? "#ede9fe" : "#f1f5f9",
                                color: m.sender_role === "lead" ? "#166534" : m.sender_role === "mentor" ? "#6d28d9" : "#475569",
                              }}
                            >
                              {m.sender_role === "lead" ? "Team Lead" : m.sender_role === "mentor" ? "Mentor" : "Collaborator"}
                            </span>
                          </div>

                          {/* Message Bubble */}
                          <div
                            style={{
                              backgroundColor: isMine ? "var(--civic)" : "#ffffff",
                              color: isMine ? "#ffffff" : "#1e293b",
                              padding: "10px 14px",
                              borderRadius: isMine ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                              fontSize: "0.88rem",
                              lineHeight: 1.45,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                              border: isMine ? "none" : "1px solid #e2e8f0",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {m.content}

                            {/* Document Attachment Card (Word, PDF, PPT) */}
                            {m.file_url && badge && (
                              <div
                                style={{
                                  marginTop: 8,
                                  backgroundColor: isMine ? "rgba(255,255,255,0.18)" : badge.bg,
                                  border: `1px solid ${isMine ? "rgba(255,255,255,0.3)" : badge.border}`,
                                  borderRadius: 8,
                                  padding: "8px 12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                  <FileText size={24} color={isMine ? "#ffffff" : badge.color} />
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "0.8rem",
                                        fontWeight: 700,
                                        color: isMine ? "#ffffff" : "#1e293b",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: 220,
                                      }}
                                    >
                                      {m.file_name}
                                    </div>
                                    <div style={{ fontSize: "0.68rem", color: isMine ? "rgba(255,255,255,0.85)" : badge.color }}>
                                      {badge.label} • {m.file_size || "Document"}
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={getFileUrl(m.file_url || "")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    textDecoration: "none",
                                    backgroundColor: isMine ? "#ffffff" : badge.color,
                                    color: isMine ? "var(--civic)" : "#ffffff",
                                  }}
                                >
                                  <Download size={12} />
                                  <span>Download</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                        <Users size={26} />
                      </div>
                      <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700 }}>
                        Welcome to {activeGroup.name}!
                      </h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: 440, marginTop: 4 }}>
                        Collaborate with your project team and mentors. You can exchange messages and upload Word (.doc, .docx), PDF (.pdf), and PowerPoint (.ppt, .pptx) files!
                      </p>
                    </div>
                  )}
                </div>

                {/* GROUP MESSAGE & FILE UPLOAD INPUT */}
                <div style={{ borderTop: "1px solid var(--divider)", backgroundColor: "#ffffff", padding: "10px 16px" }}>
                  {/* Selected file preview pill */}
                  {selectedFile && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: 6,
                        padding: "6px 10px",
                        marginBottom: 8,
                        fontSize: "0.78rem",
                      }}
                    >
                      <FileUp size={16} color="#2563eb" />
                      <span style={{ fontWeight: 600, color: "#1e40af" }}>{selectedFile.name}</span>
                      <span style={{ color: "#64748b", fontSize: "0.72rem" }}>
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", color: "#dc2626" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendGroupMessage} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />

                    {/* Attachment Paperclip button */}
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach Word, PDF, or PPT document"
                      style={{ padding: "8px 10px", color: "var(--civic)", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                    >
                      <Paperclip size={16} />
                    </button>

                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type a team message or attach Word, PDF, PPT..."
                      value={groupInputText}
                      onChange={(e) => setGroupInputText(e.target.value)}
                    />

                    <button
                      type="submit"
                      className="btn-civic"
                      style={{ padding: "0 18px", gap: 6 }}
                      disabled={isUploadingFile || (!groupInputText.trim() && !selectedFile)}
                    >
                      {isUploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      <span>{isUploadingFile ? "Uploading..." : "Send"}</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
                <Users size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700 }}>
                  Select a Project Team Group
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: 400, marginTop: 4 }}>
                  Pick a group from the left sidebar to communicate and share Word, PDF, or PowerPoint files with your team and mentors.
                </p>
              </div>
            )
          ) : activePeer ? (
            <>
              {/* TOP HEADER: SPECIFIC WHOM WE ARE SENDING AND RECEIVING */}
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--divider)",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* Visual Communication Route */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  {/* Sender: You */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img
                      src={currentUser?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=preethi"}
                      alt={currentUser?.full_name || "You"}
                      style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)" }}>
                          You ({currentUser?.full_name || "User"})
                        </span>
                        <span className="badge-tag" style={{ fontSize: "0.62rem", padding: "1px 5px", backgroundColor: "#eff6ff", color: "var(--primary)" }}>
                          SENDER
                        </span>
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        Current Active User
                      </span>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 6px" }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: 0.5 }}>
                      SENDING TO
                    </span>
                    <ArrowRight size={18} color="var(--primary)" />
                  </div>

                  {/* Recipient */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <img
                      src={activePeer.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activePeer.full_name}`}
                      alt={activePeer.full_name}
                      style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #059669" }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {activePeer.full_name}
                        </span>
                        <span className="badge-tag" style={{ fontSize: "0.62rem", padding: "1px 5px", backgroundColor: "#f0fdf4", color: "#166534" }}>
                          RECIPIENT
                        </span>
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                        {activePeer.headline || "Nexora Network Member"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Automatic Mail Generator Button */}
                <button
                  type="button"
                  className="btn-civic"
                  onClick={() => setShowAiMailModal(true)}
                  style={{ fontSize: "0.78rem", padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                >
                  <Sparkles size={14} />
                  <span>AI Email Generator</span>
                </button>
              </div>

              {/* Informational Sub-banner */}
              <div
                style={{
                  padding: "6px 18px",
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid var(--divider)",
                  fontSize: "0.72rem",
                  color: "var(--text-secondary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  Direct Messaging: <strong>You ({currentUser?.full_name})</strong> ➔ <strong>{activePeer.full_name}</strong>
                </span>
                <span style={{ color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block" }} />
                  Active Direct Channel
                </span>
              </div>

              {/* Messages Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  backgroundColor: "#fafbfc",
                }}
              >
                {messages.length > 0 ? (
                  messages.map((m) => {
                    const isMine = m.sender_id === currentUser?.id;
                    const senderLabel = isMine ? `You (${currentUser?.full_name})` : activePeer.full_name;
                    const receiverLabel = isMine ? activePeer.full_name : `You (${currentUser?.full_name})`;

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMine ? "flex-end" : "flex-start",
                          maxWidth: "75%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMine ? "flex-end" : "flex-start",
                        }}
                      >
                        {/* Sender / Receiver Label */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, padding: "0 4px" }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              color: isMine ? "var(--primary)" : "#334155",
                            }}
                          >
                            {senderLabel}
                          </span>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                            ➔ {receiverLabel}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div
                          style={{
                            backgroundColor: isMine ? "var(--primary)" : "#ffffff",
                            color: isMine ? "#ffffff" : "#1e293b",
                            padding: "10px 14px",
                            borderRadius: isMine ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                            fontSize: "0.88rem",
                            lineHeight: 1.45,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            border: isMine ? "none" : "1px solid #e2e8f0",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {m.content}
                        </div>

                        {/* Timestamp & Delivery confirmation */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, padding: "0 4px" }}>
                          <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
                            {isMine ? `Delivered to ${activePeer.full_name}` : `Received from ${activePeer.full_name}`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* No messages sent yet between these two */
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: 24,
                    }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#eff6ff", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Mail size={26} />
                    </div>
                    <h4 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700 }}>
                      Start conversation with {activePeer.full_name}
                    </h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: 420, marginTop: 4 }}>
                      Send a direct message or use the <strong>AI Email Generator</strong> to craft a personalized message for fellowships, project collaboration, or networking.
                    </p>

                    {/* Quick starter chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setInputText(`Hi ${activePeer.full_name}, I saw your work on Nexora and would love to connect!`)}
                        style={{ fontSize: "0.75rem", padding: "6px 12px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1" }}
                      >
                        👋 Say Hello
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setInputText(`Hi ${activePeer.full_name}, are you open to collaborating on a civic tech project on Nexora?`)}
                        style={{ fontSize: "0.75rem", padding: "6px 12px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1" }}
                      >
                        🤝 Propose Collaboration
                      </button>
                      <button
                        type="button"
                        className="btn-civic"
                        onClick={() => setShowAiMailModal(true)}
                        style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                      >
                        <Sparkles size={13} />
                        <span>✨ Generate AI Outreach Email</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input Toolbar & Form */}
              <div style={{ borderTop: "1px solid var(--divider)", backgroundColor: "#ffffff" }}>
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowAiMailModal(true)}
                    title="Generate Outreach / Follow-up Email with AI"
                    style={{ padding: "8px 10px", color: "var(--civic)", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                  >
                    <Sparkles size={16} />
                  </button>

                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Write message from You (${currentUser?.full_name || "User"}) to ${activePeer.full_name}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  <button type="submit" className="btn-primary" style={{ padding: "0 18px" }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Blank state: who to mail selector */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 32,
                textAlign: "center",
              }}
            >
              <Users size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700 }}>
                Whom would you like to message or mail?
              </h3>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", maxWidth: 440, marginTop: 4 }}>
                Select any peer, mentor, or recruiter from your network in the left panel to begin a direct conversation or draft an AI email.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= AI AUTOMATIC GENERATION OF MAIL MODAL ================= */}
      {showAiMailModal && activePeer && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 660, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700 }}>
                    AI Automatic Email & Outreach Generator
                  </h3>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                    Recipient: <strong>{activePeer.full_name}</strong> • Sender: <strong>{currentUser?.full_name || "User"}</strong>
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: 4 }}
                onClick={() => {
                  setShowAiMailModal(false);
                  setGeneratedMail(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: "auto", flex: 1, padding: 20 }}>
              {!generatedMail ? (
                <>
                  {/* Recipient Confirmation Box */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                    <img
                      src={activePeer.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activePeer.full_name}`}
                      alt={activePeer.full_name}
                      style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>To: {activePeer.full_name}</span>
                        <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.65rem" }}>Recipient</span>
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0 }}>
                        {activePeer.headline || "Nexora Network Member"}
                      </p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email / Outreach Purpose</label>
                    <select
                      className="form-select"
                      value={mailType}
                      onChange={(e) => setMailType(e.target.value)}
                    >
                      <option value="internship_inquiry">Internship & Fellowship Opportunity Inquiry</option>
                      <option value="collaboration_pitch">Civic Tech Project Collaboration Pitch</option>
                      <option value="coffee_chat_mentorship">Mentorship & Virtual Coffee Chat Request</option>
                      <option value="application_followup">Application Status Follow-up</option>
                      <option value="networking">General Professional Network Introduction</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Communication Tone</label>
                    <select
                      className="form-select"
                      value={mailTone}
                      onChange={(e) => setMailTone(e.target.value)}
                    >
                      <option value="professional">Professional & Polished</option>
                      <option value="enthusiastic">Enthusiastic & Purpose-Driven</option>
                      <option value="concise">Direct & Concise (Recruiter Friendly)</option>
                      <option value="formal">Formal & Academic</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Specific Details / Custom Note (Optional)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="e.g., Interested in collaborating on your climate monitoring telemetry or exploring your Summer 2026 fellowship..."
                      value={mailKeyNotes}
                      onChange={(e) => setMailKeyNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-civic"
                    style={{ width: "100%", justifyContent: "center", padding: "10px 0" }}
                    onClick={handleGenerateAiMail}
                    disabled={isGeneratingMail}
                  >
                    <Sparkles size={16} />
                    <span>{isGeneratingMail ? "Drafting High-Impact Outreach with Claude AI..." : "Generate Professional Email"}</span>
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge-tag badge-tag-civic" style={{ fontSize: "0.78rem" }}>
                      ✨ AI Email Generated
                    </span>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ fontSize: "0.74rem" }}
                      onClick={() => setGeneratedMail(null)}
                    >
                      Regenerate / Change options
                    </button>
                  </div>

                  <div>
                    <label className="form-label">Email Subject</label>
                    <input
                      type="text"
                      className="form-input"
                      value={generatedMail.subject}
                      onChange={(e) => setGeneratedMail({ ...generatedMail, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Email Body</label>
                    <textarea
                      className="form-textarea"
                      rows={8}
                      value={generatedMail.body}
                      onChange={(e) => setGeneratedMail({ ...generatedMail, body: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setShowAiMailModal(false);
                  setGeneratedMail(null);
                }}
              >
                Cancel
              </button>

              {generatedMail && (
                <>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleCopyMail}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {copiedMail ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                    <span>{copiedMail ? "Copied!" : "Copy Email"}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleInsertIntoChat}
                  >
                    Insert into Chat Input
                  </button>

                  <button
                    type="button"
                    className="btn-civic"
                    onClick={handleSendMailDirectly}
                    disabled={isSendingMailDirectly}
                  >
                    <Send size={15} />
                    <span>{isSendingMailDirectly ? "Sending..." : "Send Directly as Message"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
