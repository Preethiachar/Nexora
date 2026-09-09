import React, { useState, useEffect } from "react";
import { Sparkles, Image, BarChart2, CheckCircle2 } from "lucide-react";
import { Post, UserSummary } from "../types";
import { api } from "../services/api";
import { PostCard } from "../components/PostCard";
import { CreatePostModal } from "../components/CreatePostModal";

interface FeedPageProps {
  currentUser: UserSummary | null;
}

export const FeedPage: React.FC<FeedPageProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getFeed();
      setPosts(data);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((p) => {
    if (filter === "civic") return p.post_type === "civic_initiative";
    if (filter === "polls") return p.post_type === "poll";
    return true;
  });

  return (
    <main>
      {/* Start a Post Card */}
      <div className="nexora-card start-post-card">
        <div className="start-post-input-row">
          <img
            src={currentUser?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=me"}
            alt={currentUser?.full_name}
            className="user-avatar-sm"
          />
          <button
            className="start-post-trigger-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Start a post or pitch a civic initiative...
          </button>
        </div>

        <div className="start-post-actions-row">
          <button
            className="post-action-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Image size={18} color="#0a66c2" />
            <span>Media</span>
          </button>

          <button
            className="post-action-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>Civic Action</span>
          </button>

          <button
            className="post-action-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <BarChart2 size={18} color="#f59e0b" />
            <span>Poll</span>
          </button>

          <button
            className="post-action-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Sparkles size={18} color="#6366f1" />
            <span>Claude AI Draft</span>
          </button>
        </div>
      </div>

      {/* Feed Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          className={`btn-ghost ${filter === "all" ? "btn-outline" : ""}`}
          style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          onClick={() => setFilter("all")}
        >
          All Activity
        </button>
        <button
          className={`btn-ghost ${filter === "civic" ? "btn-outline-civic" : ""}`}
          style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          onClick={() => setFilter("civic")}
        >
          🌱 Civic & Social Initiatives
        </button>
        <button
          className={`btn-ghost ${filter === "polls" ? "btn-outline" : ""}`}
          style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          onClick={() => setFilter("polls")}
        >
          📊 Student Polls
        </button>
      </div>

      {/* Feed Posts Stream */}
      {loading ? (
        <div className="nexora-card" style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>
          Loading personalized student & civic feed...
        </div>
      ) : filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUser?.id || 0}
          />
        ))
      ) : (
        <div className="nexora-card" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>No posts found under this filter.</p>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={fetchPosts}
        />
      )}
    </main>
  );
};
