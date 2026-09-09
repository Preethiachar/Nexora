import React, { useState } from "react";
import { Lock, Mail, User, Briefcase, ArrowRight, Sparkles, CheckCircle2, Shield } from "lucide-react";
import { api, setAuthToken } from "../services/api";
import { UserSummary } from "../types";

interface AuthPageProps {
  onAuthSuccess: (user: UserSummary) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let resp;
      if (!isRegisterMode) {
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
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Top Brand Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div
          className="logo-icon-box"
          style={{ width: 44, height: 44, fontSize: "1.4rem", borderRadius: 10 }}
        >
          N
        </div>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.8rem",
            fontWeight: 800,
            color: "var(--primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Nexora
        </span>
      </div>

      {/* Center Auth Card */}
      <div
        className="nexora-card"
        style={{
          maxWidth: 920,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
        }}
      >
        {/* Left: Platform Overview & Mission */}
        <div
          style={{
            background: "linear-gradient(150deg, #0a66c2 0%, #059669 100%)",
            color: "#ffffff",
            padding: "40px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(255,255,255,0.18)",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              <Sparkles size={14} />
              <span>Youth & Civic Engagement</span>
            </span>

            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.65rem",
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: 14,
              }}
            >
              The Unified Platform for Students & Civic Innovators
            </h2>

            <p style={{ fontSize: "0.9rem", opacity: 0.92, lineHeight: 1.6, marginBottom: 24 }}>
              Discover volunteering initiatives, build your verified civic identity, recruit teammates in the
              Student Idea Marketplace, and get transparent AI-powered ATS resume feedback.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CheckCircle2 size={18} color="#a7f3d0" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700 }}>Student Idea Marketplace</h4>
                  <p style={{ fontSize: "0.76rem", opacity: 0.85 }}>
                    Pitch civic ideas and recruit teammates based on complementary skills—without funding overhead.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CheckCircle2 size={18} color="#a7f3d0" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700 }}>Transparent AI Resume ATS</h4>
                  <p style={{ fontSize: "0.76rem", opacity: 0.85 }}>
                    Real-time Scikit-Learn TF-IDF scoring and Claude AI guidance instead of silent rejections.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Shield size={18} color="#a7f3d0" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700 }}>Verified Civic Profile</h4>
                  <p style={{ fontSize: "0.76rem", opacity: 0.85 }}>
                    Track verified volunteer hours and earn civic badges recognized by universities and recruiters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.72rem", opacity: 0.75, marginTop: 24 }}>
            Powered by Python FastAPI, Scikit-Learn NLP, Claude AI, and React.js
          </div>
        </div>

        {/* Right: Registration & Login Form (Empty by Default) */}
        <div style={{ padding: "40px 32px", backgroundColor: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Form Header */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.35rem", fontWeight: 800 }}>
              {isRegisterMode ? "Create your account" : "Sign in to Nexora"}
            </h3>
            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 4 }}>
              {isRegisterMode
                ? "Enter your details to register as a student, recruiter, or mentor"
                : "Please enter your email and password to access the platform"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              backgroundColor: "#f1f5f9",
              borderRadius: "var(--radius-sm)",
              padding: 4,
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              style={{
                padding: "8px 0",
                fontSize: "0.84rem",
                fontWeight: 700,
                borderRadius: "var(--radius-sm)",
                backgroundColor: !isRegisterMode ? "#ffffff" : "transparent",
                color: !isRegisterMode ? "var(--primary)" : "var(--text-secondary)",
                boxShadow: !isRegisterMode ? "var(--shadow-sm)" : "none",
                cursor: "pointer",
              }}
              onClick={() => {
                setIsRegisterMode(false);
                setError(null);
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              style={{
                padding: "8px 0",
                fontSize: "0.84rem",
                fontWeight: 700,
                borderRadius: "var(--radius-sm)",
                backgroundColor: isRegisterMode ? "#ffffff" : "transparent",
                color: isRegisterMode ? "var(--civic)" : "var(--text-secondary)",
                boxShadow: isRegisterMode ? "var(--shadow-sm)" : "none",
                cursor: "pointer",
              }}
              onClick={() => {
                setIsRegisterMode(true);
                setError(null);
              }}
            >
              Register (Join)
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                fontSize: "0.82rem",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isRegisterMode && (
              <>
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <User size={14} />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Briefcase size={14} />
                    <span>Select Role</span>
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
                placeholder="name@example.com"
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={!isRegisterMode ? "btn-primary" : "btn-civic"}
              style={{ width: "100%", justifyContent: "center", padding: "11px 0", marginTop: 6, fontSize: "0.92rem" }}
              disabled={isLoading}
            >
              <span>{isLoading ? "Processing..." : !isRegisterMode ? "Sign In" : "Register Account"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Toggle between register and login */}
          <div style={{ textAlign: "center", marginTop: 18, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            {!isRegisterMode ? (
              <span>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "underline" }}
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError(null);
                  }}
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  style={{ color: "var(--civic)", fontWeight: 700, textDecoration: "underline" }}
                  onClick={() => {
                    setIsRegisterMode(false);
                    setError(null);
                  }}
                >
                  Sign In here
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
