"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/** ========================
 * Minimal styles (inline)
 * ======================== */
const box: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  background: "rgba(0,0,0,0.5)",
  padding: 16,
  color: "#f8fafc",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  width: "100%",
  background: "#0f172a",
  color: "#f8fafc",
  boxSizing: "border-box",
};
const buttonStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 600,
};
const buttonPrimary: React.CSSProperties = {
  ...buttonStyle,
  background: "#ef4444",
  color: "white",
  border: "1px solid #ef4444",
};
const buttonGhost: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #e2e8f0",
  background: "rgba(255,255,255,0.08)",
  color: "#f8fafc",
  transition: "background 0.2s, color 0.2s",
};
const labelText: React.CSSProperties = {
  fontSize: 12,
  color: "#f1f5f9",
  fontWeight: 600,
};
const helperText: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
};

/** ========================
 * Helpers (storage, etc.)
 * ======================== */
const USERS_KEY = "alpha_status_users_v4";

function loadUsers(): Record<string, UserRecord> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveUsers(data: Record<string, UserRecord>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(data));
}

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** ========================
 * Types
 * ======================== */
type UserRecord = {
  passwordHash: string;
  createdAt: number;
  isAdmin?: boolean;
  profile?: { name?: string; profilePhoto?: string; assessmentPhoto?: string };
  answers?: Record<string, any>;
};

/** ========================
 * Scoring helpers
 * ======================== */
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function pctHigher(v: number, min: number, max: number) {
  const t = (v - min) / (max - min);
  return Math.round(clamp01(t) * 100);
}
function pctLower(v: number, min: number, max: number) {
  const t = (v - min) / (max - min);
  return Math.round((1 - clamp01(t)) * 100);
}
function parseMileToSeconds(v: any): number {
  if (typeof v === "string" && v.includes(".")) {
    const [mm, ss] = v.split(".").map((x) => parseInt(x || "0", 10));
    if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
  }
  const asNum = parseFloat(v);
  return Number.isFinite(asNum) ? asNum : NaN;
}
function levelFor(score1000: number) {
  if (score1000 >= 900) return { name: "Apex", blurb: "Elite presence." };
  if (score1000 >= 750) return { name: "Alpha", blurb: "High performer." };
  if (score1000 >= 500) return { name: "Contender", blurb: "Solid foundation." };
  if (score1000 >= 250) return { name: "Rising", blurb: "Early gains." };
  return { name: "Getting Started", blurb: "Stack small wins." };
}

/** ========================
 * Number Input fix
 * ======================== */
function NumberInput(props: {
  value: any;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const { value, onChange, min, max, step = 0.5, unit, disabled } = props;
  const [text, setText] = useState(value ?? "");

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  return (
    <div>
      <input
        type="number"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        style={{ ...inputStyle, paddingRight: 60 }}
      />
      {unit && (
        <div style={{ ...helperText, marginTop: 4 }}>
          Unit: {unit} • Range: {min}–{max}
        </div>
      )}
    </div>
  );
}

/** ========================
 * Page Component
 * ======================== */
export default function Page() {
  const [users, setUsers] = useState<Record<string, UserRecord>>({});
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const currentUser = currentEmail ? users[currentEmail] : undefined;

  useEffect(() => {
    setUsers(loadUsers());
  }, []);
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  async function handleAuth() {
    if (!email || !pwd) return alert("Enter email and password.");
    const pwdHash = await sha256(pwd);
    if (isLoginMode) {
      const u = users[email];
      if (!u) return alert("No account found. Create one instead.");
      if (u.passwordHash !== pwdHash) return alert("Wrong password.");
      setCurrentEmail(email);
    } else {
      if (users[email]) return alert("Account already exists. Try logging in.");
      setUsers((prev) => ({
        ...prev,
        [email]: { passwordHash: pwdHash, createdAt: Date.now() },
      }));
      setCurrentEmail(email);
    }
  }
  function handleLogout() {
    setCurrentEmail(null);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/alpha-hero.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#f8fafc",
        padding: 24,
      }}
    >
      {/* Header */}
      <header
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            Alpha Status
          </h1>
          <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>
            {currentEmail ? (
              <>Signed in as <b>{currentEmail}</b></>
            ) : (
              "Sign in or create an account to begin."
            )}
          </div>
        </div>
        {currentEmail && (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/leaderboard">
              <button style={buttonGhost}>Leaderboard</button>
            </Link>
            <button style={buttonGhost}>Export CSV</button>
            <button onClick={handleLogout} style={buttonGhost}>Sign Out</button>
          </div>
        )}
      </header>

      {/* Auth or App */}
      {!currentEmail ? (
        <div style={{ ...box, maxWidth: 400, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              style={{ ...buttonStyle, ...(isLoginMode ? buttonPrimary : buttonGhost) }}
              onClick={() => setIsLoginMode(true)}
            >
              Login
            </button>
            <button
              style={{ ...buttonStyle, ...(!isLoginMode ? buttonPrimary : buttonGhost) }}
              onClick={() => setIsLoginMode(false)}
            >
              Create Account
            </button>
          </div>
          <label>
            <div style={labelText}>Email</div>
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <div style={labelText}>Password</div>
            <input type="password" style={inputStyle} value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </label>
          <div style={{ marginTop: 12 }}>
            <button onClick={handleAuth} style={buttonPrimary}>
              {isLoginMode ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
      ) : (
        <div style={box}>Welcome back, {currentEmail}!</div>
      )}
    </main>
  );
}
