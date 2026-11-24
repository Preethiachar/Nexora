import React, { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { api } from "../services/api";
import { MentorInfo } from "../types";

interface CreateIdeaModalProps {
  onClose: () => void;
  onIdeaCreated: () => void;
}

export const CreateIdeaModal: React.FC<CreateIdeaModalProps> = ({ onClose, onIdeaCreated }) => {
  const [title, setTitle] = useState("");
  const [causeTag, setCauseTag] = useState("Civic Tech & Open Source");
  const [summary, setSummary] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [solutionStatement, setSolutionStatement] = useState("");
  const [neededSkills, setNeededSkills] = useState("React, Python, Community Organizing");
  const [teamSizeTarget, setTeamSizeTarget] = useState(4);
  const [mentors, setMentors] = useState<MentorInfo[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getMentors()
      .then((data) => setMentors(data))
      .catch((err) => console.error("Error loading mentors:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createIdea({
        title,
        cause_tag: causeTag,
        summary,
        problem_statement: problemStatement,
        solution_statement: solutionStatement,
        needed_skills: neededSkills,
        team_size_target: Number(teamSizeTarget),
        mentor_id: selectedMentorId,
      });
      onIdeaCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create idea:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Lightbulb size={22} color="var(--accent)" />
            <h3>Pitch a Student Civic or Social Project</h3>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
              The Student Idea Marketplace allows you to recruit peers, showcase your civic vision,
              and gain mentorship from organizations—purely collaborative without funding or donation overhead.
            </p>

            <div className="form-group">
              <label className="form-label">Project Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. EcoRoute: Safe Campus Cycling Map"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Civic / Cause Domain</label>
              <select
                className="form-select"
                value={causeTag}
                onChange={(e) => setCauseTag(e.target.value)}
              >
                <option value="Civic Tech & Open Source">Civic Tech & Open Source</option>
                <option value="Climate Action & Sustainability">Climate Action & Sustainability</option>
                <option value="Digital Safety & Literacy">Digital Safety & Literacy</option>
                <option value="Youth Healthcare & Equity">Youth Healthcare & Equity</option>
                <option value="Education For All">Education For All</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Short Elevator Pitch (Summary)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="1-2 sentences capturing the heart of your project..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Problem Statement</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="What community or student challenge are you tackling?"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proposed Solution & Methodology</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="How will your team build or implement the solution?"
                value={solutionStatement}
                onChange={(e) => setSolutionStatement(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Needed Collaborator Skills</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Comma-separated e.g. React, Python, UI/UX, Public Speaking"
                  value={neededSkills}
                  onChange={(e) => setNeededSkills(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Team Size</label>
                <input
                  type="number"
                  className="form-input"
                  min={2}
                  max={12}
                  value={teamSizeTarget}
                  onChange={(e) => setTeamSizeTarget(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Project Mentor (Optional)</label>
              <select
                className="form-select"
                value={selectedMentorId || ""}
                onChange={(e) => setSelectedMentorId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- No Mentor Selected (Choose later anytime) --</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.headline || m.role})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                You can also select or change your mentor at any time directly on your Idea Card.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-civic" disabled={isSubmitting}>
              {isSubmitting ? "Pitching..." : "Launch Idea Pitch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
