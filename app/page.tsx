"use client";
import React, { useEffect, useMemo, useState } from "react";

/** ========================
 * Minimal styles (inline)
 * ======================== */
const box: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fff",
  padding: 16,
};
const inputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};
const buttonStyle: React.CSSProperties = {
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  cursor: "pointer",
};
const buttonPrimary: React.CSSProperties = {
  ...buttonStyle,
  background: "#0f172a",
  color: "white",
  border: "1px solid #0f172a",
};
const buttonGhost: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "white",
};
const labelText: React.CSSProperties = { fontSize: 12, color: "#334155", fontWeight: 600 };
const helperText: React.CSSProperties = { fontSize: 11, color: "#64748b" };

/** ========================
 * Helpers (hash, storage, images)
 * ======================== */
const USERS_KEY = "alpha_status_users_v4";

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
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

type Option = { label: string; value: number };
type SelectFactor = { kind: "select"; id: string; label: string; weight: number; options: Option[] };
type NumberFactor = {
  kind: "number";
  id: string;
  label: string;
  weight: number;
  unit?: string;
  domain: { min: number; max: number; better: "higher" | "lower" };
  readOnly?: boolean;
};
type ChecklistFactor = {
  kind: "checklist";
  id: string;
  label: string;
  weight: number;
  cap?: number;
  items: { id: string; label: string; points: number }[];
};
type Factor = SelectFactor | NumberFactor | ChecklistFactor;
type Config = { factors: Factor[] };

/** ========================
 * Scoring config (weights)
 * ======================== */
const CFG: Config = {
  factors: [
    // Appearance (light)
    {
      kind: "select",
      id: "facial_hair",
      label: "Facial Hair",
      weight: 0.01,
      options: [
        { label: "Clean shaven", value: 50 },
        { label: "Stubble", value: 70 },
        { label: "Trimmed beard", value: 85 },
        { label: "Full beard", value: 95 },
      ],
    },
    {
      kind: "select",
      id: "chest_hair",
      label: "Chest Hair",
      weight: 0.01,
      options: [
        { label: "None", value: 70 },
        { label: "Light", value: 80 },
        { label: "Moderate", value: 90 },
        { label: "Thick", value: 95 },
      ],
    },
    {
      kind: "select",
      id: "calloused_hands",
      label: "Calloused Hands",
      weight: 0.01,
      options: [
        { label: "Soft", value: 50 },
        { label: "Some", value: 80 },
        { label: "Well-earned", value: 95 },
      ],
    },
    {
      kind: "select",
      id: "hand_size",
      label: "Hand Size",
      weight: 0.02,
      options: [
        { label: "Small", value: 50 },
        { label: "Medium", value: 75 },
        { label: "Large", value: 90 },
        { label: "Extra Large", value: 100 },
      ],
    },
    { kind: "number", id: "shoe_size", label: "Shoe Size", unit: "US", weight: 0.02, domain: { min: 0, max: 20, better: "higher" } },

    // Anthropometrics
    { kind: "number", id: "chest_size", label: "Chest size", unit: "in", weight: 0.03, domain: { min: 0, max: 70, better: "higher" } },
    { kind: "number", id: "arm_size", label: "Arm size", unit: "in", weight: 0.03, domain: { min: 0, max: 30, better: "higher" } },
    { kind: "number", id: "quad_size", label: "Quad size", unit: "in", weight: 0.03, domain: { min: 0, max: 40, better: "higher" } },
    { kind: "number", id: "shoulder_size", label: "Shoulder size", unit: "in", weight: 0.03, domain: { min: 0, max: 80, better: "higher" } },
    { kind: "number", id: "height", label: "Height", unit: "in", weight: 0.02, domain: { min: 0, max: 100, better: "higher" } },
    { kind: "number", id: "body_fat", label: "Body Fat %", unit: "%", weight: 0.03, domain: { min: 0, max: 60, better: "lower" } },

    // Max lifts (highest)
    { kind: "number", id: "max_bench", label: "Max Bench Press", unit: "lb", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },
    { kind: "number", id: "max_deadlift", label: "Max Deadlift", unit: "lb", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },
    { kind: "number", id: "max_squat", label: "Max Squat", unit: "lb", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },

    // Conditioning + frequency
    { kind: "number", id: "mile_time", label: "Fastest 1 mile (mm.ss)", unit: "min:sec", weight: 0.08, domain: { min: 0, max: 3600, better: "lower" } },
    { kind: "number", id: "workout_days", label: "Workout Days per Week", unit: "days", weight: 0.05, domain: { min: 0, max: 7, better: "higher" } },

    // Member sizes (next priority)
    { kind: "number", id: "member_length", label: "Member Length", unit: "in", weight: 0.1, domain: { min: 0, max: 12, better: "higher" } },
    { kind: "number", id: "member_girth", label: "Member Girth", unit: "in", weight: 0.08, domain: { min: 0, max: 8, better: "higher" } },

    // Admin-assessed look
    { kind: "number", id: "alpha_look", label: "Alpha Look (admin rated)", unit: "/100", weight: 0.07, domain: { min: 0, max: 100, better: "higher" }, readOnly: true },

    // Misc
    { kind: "number", id: "hit_number", label: "Hit Number", unit: "#", weight: 0.02, domain: { min: 0, max: 500, better: "higher" } },

    // Knowledge (1–10) (no handiness)
    { kind: "number", id: "knowledge_street", label: "Knowledge — Street Smarts", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_academics", label: "Knowledge — Academics", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_sports", label: "Knowledge — Sports", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_financial", label: "Knowledge — Financial", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_strength", label: "Knowledge — Strength Training", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_politics", label: "Knowledge — Politics", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_travel", label: "Knowledge — World Travel", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_survival", label: "Knowledge — Survival", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_nutrition", label: "Knowledge — Nutrition", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_first_aid", label: "Knowledge — First Aid", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_mechanics", label: "Knowledge — Mechanics/Auto", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_navigation", label: "Knowledge — Navigation/Orienteering", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_cooking", label: "Knowledge — Cooking", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_home_repair", label: "Knowledge — Home Repair/DIY", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_leadership", label: "Knowledge — Leadership", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_tech", label: "Knowledge — Tech/Coding", unit: "/10", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },

    // Activities
    {
      kind: "checklist",
      id: "activities",
      label: "Activities completed",
      weight: 0.1,
      cap: 100,
      items: [
        { id: "hyrox", label: "HYROX", points: 20 },
        { id: "spartan", label: "Spartan", points: 15 },
        { id: "marathon", label: "Marathon", points: 20 },
        { id: "triathlon", label: "Triathlon", points: 20 },
        { id: "murph", label: "Murph", points: 15 },
        { id: "tough_mudder", label: "Tough Mudder", points: 15 },
        { id: "rock_climb", label: "Rock climbing", points: 10 },
        { id: "snowmobiling", label: "Snowmobiling", points: 5 },
        { id: "surfing", label: "Surfing", points: 10 },
        { id: "skiing", label: "Skiing", points: 10 },
        { id: "snowboarding", label: "Snowboarding", points: 10 },
        { id: "wakeboarding", label: "Wakeboarding", points: 10 },
        { id: "waterskiing", label: "Water skiing", points: 10 },
        { id: "jetski", label: "Jet skiing", points: 5 },
        { id: "shotgun", label: "Shotgun a beer", points: 5 },
        { id: "chopwood", label: "Chop wood", points: 5 },
        { id: "bjj", label: "BJJ", points: 15 },
        { id: "wrestling", label: "Wrestling", points: 15 },
        { id: "golfing", label: "Golfing", points: 5 },
        { id: "boxing", label: "Boxing", points: 15 },
        { id: "winfight", label: "Winning a fight", points: 20 },
        { id: "shootgun", label: "Shooting a gun", points: 10 },
        { id: "shootbow", label: "Shooting a bow and arrow", points: 10 },
        { id: "hiking", label: "Hiking", points: 5 },
        { id: "hockey", label: "Hockey", points: 10 },
        { id: "lacrosse", label: "Lacrosse", points: 10 },
        { id: "rugby", label: "Rugby", points: 15 },
        { id: "volleyball", label: "Volleyball", points: 5 },
        { id: "powerlifting_meet", label: "Powerlifting meet", points: 20 },
        { id: "football", label: "Football", points: 15 },
        { id: "motocross", label: "Motocross", points: 15 },
      ],
    },
  ],
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
 * Page Component
 * ======================== */
export default function Page() {
  // Auth + users
  const [users, setUsers] = useState<Record<string, UserRecord>>({});
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [adminSetupCode, setAdminSetupCode] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const currentUser = currentEmail ? users[currentEmail] : undefined;
  const isAdmin = !!currentUser?.isAdmin;
  const ADMIN_SETUP = (process.env.NEXT_PUBLIC_ADMIN_SETUP_CODE as string) || "alpha-secret";

  // Profile + answers
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [assessmentPhoto, setAssessmentPhoto] = useState<string | undefined>();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Load users on mount
  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  // When switching users, load profile into local state
  useEffect(() => {
    if (currentUser?.profile) {
      setName(currentUser.profile.name || "");
      setProfilePhoto(currentUser.profile.profilePhoto);
      setAssessmentPhoto(currentUser.profile.assessmentPhoto);
      setAnswers(currentUser.answers || {});
    }
  }, [currentEmail]);

  // Persist users whenever they change
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  // Scoring
  const { score1000, level } = useMemo(() => {
    const raw: Record<string, number> = {};
    CFG.factors.forEach((f) => {
      if (f.kind === "number") {
        const vRaw = answers[f.id];
        const v = f.id === "mile_time" ? parseMileToSeconds(vRaw) : parseFloat(vRaw);
        if (!Number.isFinite(v)) {
          raw[f.id] = 0;
          return;
        }
        const clamped = Math.max(f.domain.min, Math.min(f.domain.max, v));
        raw[f.id] = f.domain.better === "higher" ? pctHigher(clamped, f.domain.min, f.domain.max) : pctLower(clamped, f.domain.min, f.domain.max);
      } else if (f.kind === "select") {
        const v = Number(answers[f.id] ?? NaN);
        raw[f.id] = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
      } else if (f.kind === "checklist") {
        const set = (answers[f.id] as Record<string, boolean>) || {};
        const total = f.items.reduce((sum, it) => sum + (set[it.id] ? it.points : 0), 0);
        const cap = f.cap ?? 100;
        raw[f.id] = Math.round(Math.max(0, Math.min(1, total / cap)) * 100);
      }
    });

    const totalW = CFG.factors.reduce((s, f) => s + f.weight, 0);
    const weighted = CFG.factors.reduce((sum, f) => sum + (raw[f.id] ?? 0) * f.weight, 0);
    const s1000 = Math.round((weighted / (totalW || 1)) * 10);
    return { score1000: s1000, level: levelFor(s1000) };
  }, [answers]);

  // Actions
  async function handleAuth() {
    if (!email || !pwd) return alert("Enter email and password.");
    const pwdHash = await sha256(pwd);

    if (isLoginMode) {
      const u = users[email];
      if (!u) return alert("No account found. Create one instead.");
      if (u.passwordHash !== pwdHash) return alert("Wrong password.");
      setCurrentEmail(email);
      setAnswers(u.answers || {});
    } else {
      if (users[email]) return alert("Account already exists. Try logging in.");
      const isAdminNew = !!adminSetupCode && adminSetupCode === ADMIN_SETUP;
      setUsers((prev) => ({ ...prev, [email]: { passwordHash: pwdHash, createdAt: Date.now(), isAdmin: isAdminNew } }));
      setCurrentEmail(email);
    }
  }

  function handleLogout() {
    setCurrentEmail(null);
    setAnswers({});
    setName("");
    setProfilePhoto(undefined);
    setAssessmentPhoto(undefined);
  }

  function handleSaveProfile() {
    if (!currentEmail) return;
    setUsers((prev) => ({
      ...prev,
      [currentEmail]: {
        ...(prev[currentEmail] || { createdAt: Date.now(), passwordHash: "" }),
        profile: { name, profilePhoto, assessmentPhoto },
        answers,
        isAdmin: prev[currentEmail]?.isAdmin,
      },
    }));
  }

  function exportCSV() {
    const us = loadUsers();
    const factorIds = CFG.factors.map((f) => f.id);
    const header = ["email", "isAdmin", "createdAt", "name", "hasProfilePhoto", "hasAssessmentPhoto", "alpha_look", "score1000", ...factorIds];
    const rows: string[][] = [header];

    Object.entries(us).forEach(([em, u]) => {
      const alphaLook = typeof u.answers?.alpha_look !== "undefined" ? String(u.answers.alpha_look) : "";
      const factorVals = factorIds.map((id) => {
        const fv: any = u.answers?.[id];
        if (fv && typeof fv === "object") {
          return Object.entries(fv)
            .filter(([, v]) => !!v)
            .map(([k]) => k)
            .join(";");
        }
        return typeof fv === "undefined" ? "" : String(fv);
      });
      rows.push([
        em,
        u.isAdmin ? "1" : "0",
        new Date(u.createdAt).toISOString(),
        u.profile?.name || "",
        u.profile?.profilePhoto ? "1" : "0",
        u.profile?.assessmentPhoto ? "1" : "0",
        alphaLook,
        "", // live score not recomputed in export (optional)
        ...factorVals,
      ]);
    });

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alpha_status_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /** Reusable input */
  function NumberInput(props: { value: any; onChange: (v: string) => void; min: number; max: number; step?: number; unit?: string; disabled?: boolean }) {
    const { value, onChange, min, max, step = 0.5, unit, disabled } = props;
    return (
      <div>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            const v = parseFloat(e.target.value);
            if (Number.isFinite(v)) {
              const clamped = Math.max(min, Math.min(max, v));
              if (clamped !== v) onChange(String(clamped));
            }
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          style={{ ...inputStyle, paddingRight: 60 }}
        />
        {unit && <div style={{ ...helperText, marginTop: 4 }}>Unit: {unit} • Range: {min}–{max}</div>}
      </div>
    );
  }

  /** UI */
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", color: "#0f172a" }}>
      {/* Header */}
      <header style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Alpha Status</h1>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
            {currentEmail ? (
              <>
                Signed in as <b>{currentEmail}</b>
                {isAdmin ? " • Admin" : ""}
              </>
            ) : (
              "Sign in or create an account to begin."
            )}
          </div>
        </div>
        {currentEmail && (
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && (
              <button onClick={exportCSV} style={buttonGhost}>
                Export CSV
              </button>
            )}
            <button onClick={handleLogout} style={buttonGhost}>
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
        <picture>
          <source srcSet="/alpha-hero.webp" type="image/webp" />
          <source srcSet="/alpha-hero.png" type="image/png" />
          <img src="/alpha-hero.png" alt="Alpha double-biceps hero" style={{ width: 340, height: "auto", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.15))" }} />
        </picture>
      </div>

      {/* Auth or App */}
      {!currentEmail ? (
        <div style={{ ...box, display: "grid", gap: 12 }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 8 }}>
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

          {!isLoginMode && (
            <label>
              <div style={labelText}>Admin Setup Code (optional)</div>
              <input style={inputStyle} value={adminSetupCode} onChange={(e) => setAdminSetupCode(e.target.value)} placeholder="Enter to create an admin" />
              <div style={helperText}>Set in Vercel env as <code>NEXT_PUBLIC_ADMIN_SETUP_CODE</code> (default: <code>alpha-secret</code>).</div>
            </label>
          )}

          <div>
            <button onClick={handleAuth} style={buttonPrimary}>
              {isLoginMode ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Profile & Preview */}
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 16 }}>
            <div style={{ ...box, gridColumn: "span 2" }}>
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 700 }}>Profile</h2>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <div style={labelText}>Name</div>
                  <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <div style={labelText}>Profile Photo</div>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const url = await fileToDataURL(f); setProfilePhoto(url); }} />
                </label>

                <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
                  <div style={labelText}>Assessment Photo (for admin alpha look)</div>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const url = await fileToDataURL(f); setAssessmentPhoto(url); }} />
                </label>
              </div>
            </div>

            <div style={box}>
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 700 }}>Preview</h2>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ height: 160, borderRadius: 12, overflow: "hidden", background: "#f8fafc", border: "1px solid #e2e8f0", display: "grid", placeItems: "center" }}>
                  {profilePhoto ? <img src={profilePhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12, color: "#64748b" }}>No profile photo</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{name || "Unnamed"}</div>
                <div>
                  <div style={{ ...helperText, marginBottom: 6 }}>Assessment photo</div>
                  <div style={{ height: 140, borderRadius: 12, overflow: "hidden", background: "#f8fafc", border: "1px solid #e2e8f0", display: "grid", placeItems: "center" }}>
                    {assessmentPhoto ? <img src={assessmentPhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12, color: "#64748b" }}>Upload a waist-up assessment photo</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: "grid", gap: 12 }}>
            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Strength — Max Lifts</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {[
                  { id: "max_bench", label: "Max Bench Press", min: 0, max: 1000, unit: "lb" },
                  { id: "max_deadlift", label: "Max Deadlift", min: 0, max: 1000, unit: "lb" },
                  { id: "max_squat", label: "Max Squat", min: 0, max: 1000, unit: "lb" },
                ].map((f) => (
                  <label key={f.id}>
                    <div style={labelText}>{f.label}</div>
                    <NumberInput value={answers[f.id]} onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))} min={f.min} max={f.max} step={0.5} unit={f.unit} />
                  </label>
                ))}
              </div>
            </details>

            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Member Sizes</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {[
                  { id: "member_length", label: "Member Length", min: 0, max: 12, unit: "in" },
                  { id: "member_girth", label: "Member Girth", min: 0, max: 8, unit: "in" },
                ].map((f) => (
                  <label key={f.id}>
                    <div style={labelText}>{f.label}</div>
                    <NumberInput value={answers[f.id]} onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))} min={f.min} max={f.max} step={0.5} unit={f.unit} />
                  </label>
                ))}
              </div>
            </details>

            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Conditioning</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <label>
                  <div style={labelText}>Fastest 1 mile (mm.ss)</div>
                  <NumberInput value={answers["mile_time"]} onChange={(v) => setAnswers((a) => ({ ...a, mile_time: v }))} min={0} max={3600} step={0.1} unit="min:sec" />
                  <div style={helperText}>Tip: enter as <b>mm.ss</b> (e.g., 6.30 for 6:30). Lower is better.</div>
                </label>
                <label>
                  <div style={labelText}>Workout Days per Week</div>
                  <NumberInput value={answers["workout_days"]} onChange={(v) => setAnswers((a) => ({ ...a, workout_days: v }))} min={0} max={7} step={0.5} unit="days" />
                </label>
              </div>
            </details>

            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Anthropometrics</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {[
                  { id: "chest_size", label: "Chest size", min: 0, max: 70, unit: "in" },
                  { id: "arm_size", label: "Arm size", min: 0, max: 30, unit: "in" },
                  { id: "quad_size", label: "Quad size", min: 0, max: 40, unit: "in" },
                  { id: "shoulder_size", label: "Shoulder size", min: 0, max: 80, unit: "in" },
                  { id: "height", label: "Height", min: 0, max: 100, unit: "in" },
                  { id: "body_fat", label: "Body Fat %", min: 0, max: 60, unit: "%" },
                ].map((f) => (
                  <label key={f.id}>
                    <div style={labelText}>{f.label}</div>
                    <NumberInput value={answers[f.id]} onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))} min={f.min} max={f.max} step={0.5} unit={f.unit} />
                  </label>
                ))}
              </div>
            </details>

            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Appearance</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {/* Shoe Size is numeric; others are selects */}
                <label>
                  <div style={labelText}>Shoe Size</div>
                  <NumberInput value={answers["shoe_size"]} onChange={(v) => setAnswers((a) => ({ ...a, shoe_size: v }))} min={0} max={20} step={0.5} unit="US" />
                </label>
                {[
                  {
                    id: "facial_hair",
                    label: "Facial Hair",
                    options: [
                      { label: "Clean shaven", value: 50 },
                      { label: "Stubble", value: 70 },
                      { label: "Trimmed beard", value: 85 },
                      { label: "Full beard", value: 95 },
                    ],
                  },
                  {
                    id: "chest_hair",
                    label: "Chest Hair",
                    options: [
                      { label: "None", value: 70 },
                      { label: "Light", value: 80 },
                      { label: "Moderate", value: 90 },
                      { label: "Thick", value: 95 },
                    ],
                  },
                  {
                    id: "calloused_hands",
                    label: "Calloused Hands",
                    options: [
                      { label: "Soft", value: 50 },
                      { label: "Some", value: 80 },
                      { label: "Well-earned", value: 95 },
                    ],
                  },
                  {
                    id: "hand_size",
                    label: "Hand Size",
                    options: [
                      { label: "Small", value: 50 },
                      { label: "Medium", value: 75 },
                      { label: "Large", value: 90 },
                      { label: "Extra Large", value: 100 },
                    ],
                  },
                ].map((f) => (
                  <label key={f.id}>
                    <div style={labelText}>{f.label}</div>
                    <select
                      style={inputStyle}
                      value={String(answers[f.id] ?? "")}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: Number(e.target.value) }))}
                    >
                      <option value="" disabled>
                        Choose…
                      </option>
                      {f.options.map((o) => (
                        <option key={o.label} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </details>

            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Knowledge (1–10)</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {[
                  "street",
                  "academics",
                  "sports",
                  "financial",
                  "strength",
                  "politics",
                  "travel",
                  "survival",
                  "nutrition",
                  "first_aid",
                  "mechanics",
                  "navigation",
                  "cooking",
                  "home_repair",
                  "leadership",
                  "tech",
                ].map((k) => {
                  const id = "knowledge_" + k;
                  const label = "Knowledge — " + k.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <label key={id}>
                      <div style={labelText}>{label}</div>
                      <NumberInput value={answers[id]} onChange={(v) => setAnswers((a) => ({ ...a, [id]: v }))} min={1} max={10} step={0.5} unit="/10" />
                    </label>
                  );
                })}
              </div>
            </details>

            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Activities</summary>
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {(
                  CFG.factors.find((x) => x.id === "activities") as ChecklistFactor
                ).items.map((it) => {
                  const set = (answers["activities"] as Record<string, boolean>) || {};
                  const checked = !!set[it.id];
                  return (
                    <label key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            activities: { ...(a.activities || {}), [it.id]: e.target.checked },
                          }))
                        }
                      />
                      <span style={{ fontSize: 14 }}>{it.label}</span>
                    </label>
                  );
                })}
              </div>
            </details>

            <details style={box}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Admin-Assessed</summary>
              <div style={{ marginTop: 12 }}>
                <label>
                  <div style={labelText}>Alpha Look (admin rated 0–100)</div>
                  <NumberInput
                    value={answers["alpha_look"]}
                    onChange={(v) => setAnswers((a) => ({ ...a, alpha_look: v }))}
                    min={0}
                    max={100}
                    step={1}
                    unit="/100"
                    disabled={!isAdmin}
                  />
                  {!isAdmin && <div style={helperText}>(admin sets this)</div>}
                </label>
              </div>
            </details>
          </div>

          {/* Score + actions */}
          <div style={{ ...box, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Alpha Lever (out of 1000)</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{score1000}</div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  {level.name} — {level.blurb}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSaveProfile} style={buttonPrimary}>
                  Save
                </button>
                <button onClick={() => setAnswers({})} style={buttonGhost}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
