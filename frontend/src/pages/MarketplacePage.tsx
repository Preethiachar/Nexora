import React, { useState, useEffect } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { StudentIdea } from "../types";
import { api } from "../services/api";
import { IdeaCard } from "../components/IdeaCard";
import { CreateIdeaModal } from "../components/CreateIdeaModal";

interface MarketplacePageProps {
  onNavigate?: (tab: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
  const [ideas, setIdeas] = useState<StudentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCause, setSelectedCause] = useState("All");
  const [skillSearch, setSkillSearch] = useState("");
  const [showPitchModal, setShowPitchModal] = useState(false);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const data = await api.getIdeas(
        selectedCause !== "All" ? selectedCause : undefined,
        skillSearch.trim() || undefined
      );
      setIdeas(data);
    } catch (err) {
      console.error("Failed to load ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [selectedCause]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIdeas();
  };

  const causesList = [
    "All",
    "Civic Tech",
    "Climate Action",
    "Digital Safety",
    "Food Security",
    "Education",
  ];

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 16px" }}>
      {/* Marketplace Hero */}
      <div className="marketplace-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2>Student Idea Marketplace</h2>
            <p>
              Where students pitch civic and social tech projects, attract teammates based on complementary
              skills, and gain visibility from mentors and civic organizations—purely collaborative,
              zero fundraising needed.
            </p>
          </div>

          <button
            className="btn-civic"
            style={{ backgroundColor: "#ffffff", color: "#065f46", fontWeight: 700, padding: "10px 20px" }}
            onClick={() => setShowPitchModal(true)}
          >
            <Plus size={18} />
            <span>Pitch Your Idea</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="nexora-card"
        style={{
          padding: 14,
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Causes pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {causesList.map((cause) => (
            <button
              key={cause}
              className={`btn-ghost ${selectedCause === cause ? "btn-outline-civic" : ""}`}
              style={{ fontSize: "0.78rem", padding: "6px 12px" }}
              onClick={() => setSelectedCause(cause)}
            >
              {cause}
            </button>
          ))}
        </div>

        {/* Skill Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            className="form-input"
            style={{ width: 220, padding: "6px 12px", fontSize: "0.82rem" }}
            placeholder="Search needed skill (e.g. React)..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
          />
          <button type="submit" className="btn-outline" style={{ padding: "6px 12px" }}>
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="nexora-card" style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
          Discovering active student civic pitches...
        </div>
      ) : ideas.length > 0 ? (
        <div className="idea-grid">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onRefresh={fetchIdeas} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="nexora-card" style={{ padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 12 }}>
            No project pitches found under this filter.
          </p>
          <button className="btn-civic" onClick={() => setShowPitchModal(true)}>
            <Sparkles size={16} />
            <span>Be the first to pitch an idea in this domain!</span>
          </button>
        </div>
      )}

      {/* Pitch Modal */}
      {showPitchModal && (
        <CreateIdeaModal
          onClose={() => setShowPitchModal(false)}
          onIdeaCreated={fetchIdeas}
        />
      )}
    </div>
  );
};
