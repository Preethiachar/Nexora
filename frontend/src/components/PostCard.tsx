import React, { useState } from "react";
import { ThumbsUp, Heart, Award, MessageCircle, Share2, Send, CheckCircle2 } from "lucide-react";
import { Post } from "../types";
import { api } from "../services/api";

interface PostCardProps {
  post: Post;
  currentUserId: number;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUserId }) => {
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [userReaction, setUserReaction] = useState(post.user_reaction);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [pollVotedIndex, setPollVotedIndex] = useState<number | null>(null);

  const handleReact = async (type: string) => {
    try {
      const resp = await api.reactToPost(post.id, type);
      if (resp.status === "unreacted") {
        setUserReaction(null);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        if (!userReaction) {
          setLikesCount((prev) => prev + 1);
        }
        setUserReaction(resp.reaction);
      }
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const added = await api.commentOnPost(post.id, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const isPoll = post.post_type === "poll" && post.poll_data;

  return (
    <article className="nexora-card post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-meta">
          <img
            src={post.author.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=author"}
            alt={post.author.full_name}
            className="user-avatar-sm"
          />
          <div>
            <div className="author-title-row">
              <span className="author-name">{post.author.full_name}</span>
              {post.author.civic_hours > 0 && (
                <span className="badge-civic-hours" title="Verifiable Civic Activity">
                  <CheckCircle2 size={12} color="#059669" />
                  <span>{post.author.civic_hours}h Civic</span>
                </span>
              )}
            </div>

            <p className="author-headline">{post.author.headline}</p>
            <span className="post-time">Posted recently</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-body">
        {post.content}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {post.tags.map((tag, idx) => (
              <span key={idx} className="badge-tag badge-tag-tech">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Poll Component */}
      {isPoll && (
        <div className="poll-container">
          <p className="poll-question-text">{post.poll_data?.question}</p>
          <div>
            {post.poll_data?.options.map((opt, idx) => {
              const isSelected = pollVotedIndex === idx;
              return (
                <button
                  key={idx}
                  className="poll-option-btn"
                  style={{
                    backgroundColor: isSelected ? "var(--primary-light)" : "#ffffff",
                    borderColor: isSelected ? "var(--primary)" : "#cbd5e1",
                  }}
                  onClick={() => setPollVotedIndex(idx)}
                >
                  <span>{opt}</span>
                  {isSelected && <span style={{ color: "var(--primary)", fontWeight: 700 }}>✓ Voted</span>}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Nexora Student Civic Poll • 142 student votes
          </span>
        </div>
      )}

      {/* Media Image */}
      {post.media_url && (
        <img src={post.media_url} alt="Post attachment" className="post-media-img" />
      )}

      {/* Social Counters */}
      <div className="post-stats-row">
        <span>{likesCount} reactions</span>
        <div style={{ display: "flex", gap: 12 }}>
          <span onClick={() => setShowComments(!showComments)} style={{ cursor: "pointer" }}>
            {comments.length} comments
          </span>
          <span>{post.shares_count} reposts</span>
        </div>
      </div>

      {/* Reactions Bar */}
      <div className="post-reactions-bar">
        <button
          className={`reaction-btn ${userReaction === "like" ? "active" : ""}`}
          onClick={() => handleReact("like")}
        >
          <ThumbsUp size={16} />
          <span>Like</span>
        </button>

        <button
          className={`reaction-btn ${userReaction === "celebrate" ? "celebrate-active" : ""}`}
          onClick={() => handleReact("celebrate")}
        >
          <Award size={16} />
          <span>Celebrate</span>
        </button>

        <button
          className={`reaction-btn ${userReaction === "support" ? "support-active" : ""}`}
          onClick={() => handleReact("support")}
        >
          <Heart size={16} />
          <span>Support</span>
        </button>

        <button
          className="reaction-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle size={16} />
          <span>Comment</span>
        </button>

        <button className="reaction-btn" onClick={() => alert("Post link copied to clipboard!")}>
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="post-comments-box">
          {/* Add comment input */}
          <form className="comment-input-row" onSubmit={handleAddComment}>
            <input
              type="text"
              className="comment-input"
              placeholder="Add a constructive civic or technical comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: "8px 14px" }}>
              <Send size={14} />
            </button>
          </form>

          {/* Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                <img
                  src={c.author.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=comm"}
                  alt={c.author.full_name}
                  style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                />
                <div className="comment-bubble">
                  <div className="comment-author-name">{c.author.full_name}</div>
                  <div className="comment-content">{c.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
