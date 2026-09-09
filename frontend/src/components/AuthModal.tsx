import React, { useState } from "react";
import { X, Lock, Mail, User, Briefcase, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { api, setAuthToken } from "../services/api";
import { UserSummary } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserSummary) => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let resp;
      if (mode === "login") {
        resp = await api.login({ email: email.trim(), password });
      } else {
        resp = await api.register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role,
        });
      }

      setAuthToken(resp.access_token);
      onAuthSuccess(resp.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setMode("login");
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 460, borderRadius: "var(--radius-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Nexora Brand */}
        <div
          style={{
            padding: "24px 24px 16px",
            borderBottom: "1px solid var(--divider)",
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-heading)",
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--primary)",
              marginBottom: 4,
            }}
          >
            <div className="logo-icon-box" style={{ width: 32, height: 32, fontSize: "1rem" }}>
              N
            </div>
            <span>Nexora</span>
          </div>

          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
            {mode === "login" ? "Welcome back to Nexora" : "Join the Student & Youth Network"}
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
            {mode === "login"
              ? "Sign in to access your civic feed, applications, and ideas"
              : "Create your professional and verifiable civic identity"}
          </p>

          <button
            className="btn-ghost"
            style={{ position: "absolute", top: 16, right: 16 }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <button
            type="button"
            style={{
              padding: "12px",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: mode === "login" ? "var(--primary)" : "var(--text-secondary)",
              borderBottom: mode === "login" ? "2.5px solid var(--primary)" : "none",
              backgroundColor: mode === "login" ? "var(--primary-light)" : "transparent",
            }}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              padding: "12px",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: mode === "register" ? "var(--civic)" : "var(--text-secondary)",
              borderBottom: mode === "register" ? "2.5px solid var(--civic)" : "none",
              backgroundColor: mode === "register" ? "var(--civic-light)" : "transparent",
            }}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {/* Error notification banner */}
        {error && (
          <div
            style={{
              margin: "16px 24px 0",
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 6,
              fontSize: "0.8rem",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          {mode === "register" && (
            <>
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <User size={14} />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Maya Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Briefcase size={14} />
                  <span>Account Role</span>
                </label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student / Young Changemaker</option>
                  <option value="organization_recruiter">Organization / Recruiter / NGO</option>
                  <option value="mentor">Faculty / Social Innovation Mentor</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Mail size={14} />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. student@nexora.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={14} />
              <span>Password</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={mode === "login" ? "btn-primary" : "btn-civic"}
            style={{ width: "100%", justifyContent: "center", padding: "10px 0", marginTop: 8 }}
            disabled={isLoading}
          >
            <span>{isLoading ? "Processing..." : mode === "login" ? "Sign In to Nexora" : "Create My Account"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Accounts Helper (One Click) */}
        <div
          style={{
            padding: "14px 24px 20px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid var(--divider)",
            borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Sparkles size={14} color="var(--primary)" />
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              Fast Login With Pre-Seeded Profiles:
            </span>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              className="badge-tag"
              style={{ cursor: "pointer", fontSize: "0.72rem" }}
              onClick={() => fillDemoAccount("maya.chen@nexora.edu")}
            >
              🎓 Maya (Student)
            </button>
            <button
              type="button"
              className="badge-tag"
              style={{ cursor: "pointer", fontSize: "0.72rem" }}
              onClick={() => fillDemoAccount("sarah.jenkins@civicalabs.org")}
            >
              🏢 Sarah (Recruiter)
            </button>
            <button
              type="button"
              className="badge-tag"
              style={{ cursor: "pointer", fontSize: "0.72rem" }}
              onClick={() => fillDemoAccount("vikram.patel@innovation.edu")}
            >
              💡 Dr. Vikram (Mentor)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
