"use client";
import React, { useEffect, useMemo, useState } from "react";

/** ========================
 *  Simple UI helpers (no deps)
 *  ======================== */
const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <details className="rounded-xl border border-slate-200 bg-white p-4 open:shadow-sm">
    <summary className="cursor-pointer select-none text-base font-semibold">{title}</summary>
    <div className="mt-3 grid gap-3">{children}</div>
  </details>
);

const Row: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <label className="grid gap-1">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

function InputNumber({
  value,
  onChange,
  min,
  max,
  step = 0.5,
  unit,
  disabled,
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) {
            const clamped = Math.max(min, Math.min(max, v));
            if (clamped !== v) onChange(String(clamped));
          }
        }}
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        disabled={disabled}
      />
      {unit && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {unit}
        </span>
      )}
      <p className="mt-1 text-[11px] text-slate-500">
        Range: {min}–{max} {unit || ""}
      </p>
    </div>
  );
}

/** ========================
 *  Types + scoring config
 *  ======================== */
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

const CFG: Config = {
  factors: [
    // Appearance (light weight)
    { kind: "select", id: "facial_hair", label: "Facial Hair", weight: 0.01, options: [
      { label: "Clean shaven", value: 50 }, { label: "Stubble", value: 70 },
      { label: "Trimmed beard", value: 85 }, { label: "Full beard", value: 95 },
    ]},
    { kind: "select", id: "chest_hair", label: "Chest Hair", weight: 0.01, options: [
      { label: "None", value: 70 }, { label: "Light", value: 80 },
      { label: "Moderate", value: 90 }, { label: "Thick", value: 95 },
    ]},
    { kind: "select", id: "calloused_hands", label: "Calloused Hands", weight: 0.01, options: [
      { label: "Soft", value: 50 }, { label: "Some", value: 80 }, { label: "Well-earned", value: 95 },
    ]},
    { kind: "select", id: "hand_size", label: "Hand Size", weight: 0.02, options: [
      { label: "Small", value: 50 }, { label: "Medium", value: 75 }, { label: "Large", value: 90 }, { label: "Extra Large", value: 100 },
    ]},
    { kind: "number", id: "shoe_size", label: "Shoe Size", unit: "US", weight: 0.02, domain: { min: 0, max: 20, better: "higher" } },

    // Anthropometrics
    { kind: "number", id: "chest_size", label: "Chest size", unit: "in", weight: 0.03, domain: { min: 0, max: 70, better: "higher" } },
    { kind: "number", id: "arm_size", label: "Arm size", unit: "in", weight: 0.03, domain: { min: 0, max: 30, better: "higher" } },
    { kind: "number", id: "quad_size", label: "Quad size", unit: "in", weight: 0.03, domain: { min: 0, max: 40, better: "higher" } },
    { kind: "number", id: "shoulder_size", label: "Shoulder size", unit: "in", weight: 0.03, domain: { min: 0, max: 80, better: "higher" } },
    { kind: "number", id: "height", label: "Height", unit: "in", weight: 0.02, domain: { min: 0, max: 100, better: "higher" } },
    { kind: "number", id: "body_fat", label: "Body Fat %", unit: "%", weight: 0.03, domain: { min: 0, max: 60, better: "lower" } },

    // Max lifts (highest weight)
    { kind: "number", id: "max_bench", label: "Max Bench Press", unit: "lb", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },
    { kind: "number", id: "max_deadlift", label: "Max Deadlift", unit: "lb", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },
    { kind: "number", id: "max_squat", label: "Max Squat", unit: "lb", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },

    // Conditioning + Frequency
    { kind: "number", id: "mile_time", label: "Fastest 1 mile (mm.ss)", unit: "min:sec", weight: 0.08, domain: { min: 0, max: 3600, better: "lower" } },
    { kind: "number", id: "workout_days", label: "Workout Days per Week", unit: "days", weight: 0.05, domain: { min: 0, max: 7, better: "higher" } },

    // Member (next priority)
    { kind: "number", id: "member_length", label: "Member Length", unit: "in", weight: 0.10, domain: { min: 0, max: 12, better: "higher" } },
    { kind: "number", id: "member_girth", label: "Member Girth", unit: "in", weight: 0.08, domain: { min: 0, max: 8, better: "higher" } },

    // Admin-assessed look adds to total
    { kind: "number", id: "alpha_look", label: "Alpha Look (admin rated)", unit: "/100", weight: 0.07, domain: { min: 0, max: 100, better: "higher" }, readOnly: true },

    // Hit number (misc)
    { kind: "number", id: "hit_number", label: "Hit Number", unit: "#", weight: 0.02, domain: { min: 0, max: 500, better: "higher" } },

    // Knowledge (1–10, higher is better) — minus “Handiness” per your edit
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

    // Activities (checkbox list)
    {
      kind: "checklist",
      id: "activities",
      label: "Activities completed",
      weight: 0.10,
      cap: 100,
      items: [
        { id: "hyrox", label: "HYROX", points: 20 }, { id: "spartan", label: "Spartan", points: 15 },
        { id: "marathon", label: "Marathon", points: 20 }, { id: "triathlon", label: "Triathlon", points: 20 },
        { id: "murph", label: "Murph", points: 15 }, { id: "tough_mudder", label: "Tough Mudder", points: 15 },
        { id: "rock_climb", label: "Rock climbing", points: 10 }, { id: "snowmobiling", label: "Snowmobiling", points: 5 },
        { id: "surfing", label: "Surfing", points: 10 }, { id: "skiing", label: "Skiing", points: 10 },
        { id: "snowboarding", label: "Snowboarding", points: 10 }, { id: "wakeboarding", label: "Wakeboarding", points: 10 },
        { id: "waterskiing", label: "Water skiing", points: 10 }, { id: "jetski", label: "Jet skiing", points: 5 },
        { id: "shotgun", label: "Shotgun a beer", points: 5 }, { id: "chopwood", label: "Chop wood", points: 5 },
        { id: "bjj", label: "BJJ", points: 15 }, { id: "wrestling", label: "Wrestling", points: 15 },
        { id: "golfing", label: "Golfing", points: 5 }, { id: "boxing", label: "Boxing", points: 15 },
        { id: "winfight", label: "Winning a fight", points: 20 }, { id: "shootgun", label: "Shooting a gun", points: 10 },
        { id: "shootbow", label: "Shooting a bow and arrow", points: 10 }, { id: "hiking", label: "Hiking", points: 5 },
        { id: "hockey", label: "Hockey", points: 10 }, { id: "lacrosse", label: "Lacrosse", points: 10 },
        { id: "rugby", label: "Rugby", points: 15 }, { id: "volleyball", label: "Volleyball", points: 5 },
        { id: "powerlifting_meet", label: "Powerlifting meet", points: 20 }, { id: "football", label: "Football", points: 15 },
        { id: "motocross", label: "Motocross", points: 15 },
      ],
    },
  ],
};

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function toPctHigher(v: number, min: number, max: number) {
  const t = (v - min) / (max - min);
  return Math.round(clamp01(t) * 100);
}
function toPctLower(v: number, min: number, max: number) {
  const t = (v - min) / (max - min);
  return Math.round((1 - clamp01(t)) * 100);
}
function levelFor(score1000: number) {
  if (score1000 >= 900) return { name: "Apex", blurb: "Elite presence." };
  if (score1000 >= 750) return { name: "Alpha", blurb: "High performer." };
  if (score1000 >= 500) return { name: "Contender", blurb: "Solid foundation." };
  if (score1000 >= 250) return { name: "Rising", blurb: "Early gains." };
  return { name: "Getting Started", blurb: "Stack small wins." };
}

/** ========================
 *  Auth + storage
 *  ======================== */
type UserRecord = {
  passwordHash: string;
  createdAt: number;
  isAdmin?: boolean;
  profile?: { name?: string; profilePhoto?: string; assessmentPhoto?: string };
  answers?: Record<string, any>;
};
const USERS_KEY = "alpha_status_users_v3";

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function loadUsers(): Record<string, UserRecord> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); } catch { return {}; }
}
function saveUsers(data: Record<string, UserRecord>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(data));
}
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ADMIN_SETUP_CODE = (process.env.NEXT_PUBLIC_ADMIN_SETUP_CODE as string) || "alpha-secret";

/** ========================
 *  Main Page
 *  ======================== */
export default function Home() {
  const [users, setUsers] = useState<Record<string, UserRecord>>({});
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [adminSetupCode, setAdminSetupCode] = useState("");

  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const currentUser = currentEmail ? users[currentEmail] : undefined;
  const isAdmin = !!currentUser?.isAdmin;

  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [assessmentPhoto, setAssessmentPhoto] = useState<string | undefined>();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // load/save users
  useEffect(() => { setUsers(loadUsers()); }, []);
  useEffect(() => { if (currentUser?.profile) {
    setName(currentUser.profile.name || "");
    setProfilePhoto(currentUser.profile.profilePhoto);
    setAssessmentPhoto(currentUser.profile.assessmentPhoto);
  }}, [currentEmail]);
  useEffect(() => { saveUsers(users); }, [users]);

  // compute score
  const { score1000, level } = useMemo(() => {
    const raw: Record<string, number> = {};
    CFG.factors.forEach((f) => {
      if (f.kind === "number") {
        const vRaw = answers[f.id];
        const v = f.id === "mile_time"
          ? parseMileToSeconds(vRaw) // allow mm.ss entry; store as seconds internally
          : parseFloat(vRaw);
        if (!Number.isFinite(v)) { raw[f.id] = 0; return; }
        const clamped = Math.max(f.domain.min, Math.min(f.domain.max, v));
        raw[f.id] = f.domain.better === "higher"
          ? toPctHigher(clamped, f.domain.min, f.domain.max)
          : toPctLower(clamped, f.domain.min, f.domain.max);
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

  // helper: parse "mm.ss" for mile into seconds; also accept plain seconds
  function parseMileToSeconds(v: any): number {
    if (typeof v === "string" && v.includes(".")) {
      const [mm, ss] = v.split(".").map((x) => parseInt(x || "0", 10));
      if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
    }
    const asNum = parseFloat(v);
    return Number.isFinite(asNum) ? asNum : NaN;
  }

  function handleSaveProfile() {
    if (!currentEmail) return;
    setUsers((prev) => ({
      ...prev,
      [currentEmail]: {
        ...(prev[currentEmail] || { createdAt: Date.now(), passwordHash: "" }),
        profile: { name, profilePhoto, assessmentPhoto },
        answers: answers,
        isAdmin: prev[currentEmail]?.isAdmin,
      },
    }));
  }

  async function handleAuth() {
    if (!email || !pwd) return alert("Enter email and password");
    const pwdHash = await sha256(pwd);
    if (isLoginMode) {
      const u = users[email];
      if (!u) return alert("No account found. Create one instead.");
      if (u.passwordHash !== pwdHash) return alert("Wrong password.");
      setCurrentEmail(email);
      setAnswers(u.answers || {});
    } else {
      if (users[email]) return alert("Account already exists. Try logging in.");
      const isAdminNew = adminSetupCode && adminSetupCode === ADMIN_SETUP_CODE;
      setUsers((prev) => ({ ...prev, [email]: { passwordHash: pwdHash, createdAt: Date.now(), isAdmin: isAdminNew } }));
      setCurrentEmail(email);
    }
  }

  function handleLogout() { setCurrentEmail(null); setAnswers({}); setName(""); setProfilePhoto(undefined); setAssessmentPhoto(undefined); }

  function exportCSV() {
    const us = loadUsers();
    const factorIds = CFG.factors.map((f) => f.id);
    const header = ["email","isAdmin","createdAt","name","hasProfilePhoto","hasAssessmentPhoto","alpha_look","score1000", ...factorIds];
    const rows: string[][] = [header];
    Object.entries(us).forEach(([em, u]) => {
      const score = computeScoreFor(u.answers || {});
      const alphaLook = typeof u.answers?.alpha_look !== "undefined" ? String(u.answers.alpha_look) : "";
      const factorVals = factorIds.map((id) => {
        const fv = u.answers?.[id];
        if (typeof fv === "object" && fv) {
          return Object.entries(fv).filter(([, v]) => !!v).map(([k]) => k).join(";");
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
        String(score),
        ...factorVals,
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alpha_status_export_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function computeScoreFor(ans: Record<string, any>): number {
    const raw: Record<string, number> = {};
    CFG.factors.forEach((f) => {
      if (f.kind === "number") {
        const vRaw = ans[f.id];
        const v = f.id === "mile_time" ? parseMileToSeconds(vRaw) : parseFloat(vRaw);
        if (!Number.isFinite(v)) { raw[f.id] = 0; return; }
        const clamped = Math.max(f.domain.min, Math.min(f.domain.max, v));
        raw[f.id] = f.domain.better === "higher" ? toPctHigher(clamped, f.domain.min, f.domain.max) : toPctLower(clamped, f.domain.min, f.domain.max);
      } else if (f.kind === "select") {
        const v = Number(ans[f.id] ?? NaN);
        raw[f.id] = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
      } else if (f.kind === "checklist") {
        const set = (ans[f.id] as Record<string, boolean>) || {};
        const total = f.items.reduce((sum, it) => sum + (set[it.id] ? it.points : 0), 0);
        const cap = f.cap ?? 100;
        raw[f.id] = Math.round(Math.max(0, Math.min(1, total / cap)) * 100);
      }
    });
    const totalW = CFG.factors.reduce((s, f) => s + f.weight, 0);
    const weighted = CFG.factors.reduce((sum, f) => sum + (raw[f.id] ?? 0) * f.weight, 0);
    return Math.round((weighted / (totalW || 1)) * 10);
  }

  // ====== UI
  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* Header + Hero */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alpha Status</h1>
          <p className="text-sm text-slate-600">
            {currentEmail ? <>Signed in as <b>{currentEmail}</b>{isAdmin ? " • Admin" : ""}</> : "Sign in or create an account to begin."}
          </p>
        </div>
        {currentEmail && (
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={exportCSV} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Export CSV</button>
            )}
            <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Sign Out</button>
          </div>
        )}
      </header>

      <div className="mb-6 flex items-center justify-center">
        <picture>
          <source srcSet="/alpha-hero.webp" type="image/webp" />
          <source srcSet="/alpha-hero.png" type="image/png" />
          <img src="/alpha-hero.png" alt="Alpha double-biceps hero" className="h-auto w-[340px] drop-shadow-lg" />
        </picture>
      </div>

      {!currentEmail ? (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <button className={`rounded-lg px-3 py-1 text-sm ${isLoginMode ? "bg-slate-900 text-white" : "border border-slate-300"}`} onClick={() => setIsLoginMode(true)}>Login</button>
            <button className={`rounded-lg px-3 py-1 text-sm ${!isLoginMode ? "bg-slate-900 text-white" : "border border-slate-300"}`} onClick={() => setIsLoginMode(false)}>Create Account</button>
          </div>
          <Row label="Email"><input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} /></Row>
          <Row label="Password"><input type="password" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={pwd} onChange={(e) => setPwd(e.target.value)} /></Row>
          {!isLoginMode && (
            <Row label="Admin Setup Code (optional)">
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Enter to create an admin" value={adminSetupCode} onChange={(e) => setAdminSetupCode(e.target.value)} />
              <p className="text-xs text-slate-500">Use your secret (Vercel env: NEXT_PUBLIC_ADMIN_SETUP_CODE) to create an admin account.</p>
            </Row>
          )}
          <div><button onClick={handleAuth} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{isLoginMode ? "Sign In" : "Create Account"}</button></div>
        </div>
      ) : (
        <>
          {/* Profile + Preview */}
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
              <h2 className="mb-3 text-lg font-semibold">Profile</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <Row label="Name"><input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} /></Row>
                <Row label="Profile Photo">
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const url = await fileToDataURL(f); setProfilePhoto(url); }} />
                </Row>
                <div className="md:col-span-2">
                  <Row label="Assessment Photo (for admin alpha look)">
                    <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const url = await fileToDataURL(f); setAssessmentPhoto(url); }} />
                  </Row>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Preview</h2>
              <div className="grid gap-3">
                <div className="grid place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50" style={{height: 160}}>
                  {profilePhoto ? <img src={profilePhoto} className="h-full w-full object-cover" /> : <span className="text-sm text-slate-500">No profile photo</span>}
                </div>
                <div className="text-sm font-medium">{name || "Unnamed"}</div>
                <div>
                  <div className="mb-1 text-xs text-slate-500">Assessment photo</div>
                  <div className="grid place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50" style={{height: 140}}>
                    {assessmentPhoto ? <img src={assessmentPhoto} className="h-full w-full object-cover" /> : <span className="text-sm text-slate-500">Upload a waist-up assessment photo</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible sections */}
          <div className="grid gap-4">
            <Section title="Strength — Max Lifts">
              {["max_bench","max_deadlift","max_squat"].map((id) => {
                const f = CFG.factors.find((x) => x.id === id) as NumberFactor;
                return (
                  <Row key={id} label={f.label}>
                    <InputNumber value={answers[id]} onChange={(v) => setAnswers((a) => ({ ...a, [id]: v }))} min={f.domain.min} max={f.domain.max} step={0.5} unit={f.unit} />
                  </Row>
                );
              })}
            </Section>

            <Section title="Member Sizes">
              {["member_length","member_girth"].map((id) => {
                const f = CFG.factors.find((x) => x.id === id) as NumberFactor;
                return (
                  <Row key={id} label={f.label}>
                    <InputNumber value={answers[id]} onChange={(v) => setAnswers((a) => ({ ...a, [id]: v }))} min={f.domain.min} max={f.domain.max} step={0.5} unit={f.unit} />
                  </Row>
                );
              })}
            </Section>

            <Section title="Conditioning">
              {["mile_time","workout_days"].map((id) => {
                const f = CFG.factors.find((x) => x.id === id) as NumberFactor;
                return (
                  <Row key={id} label={f.label}>
                    <InputNumber value={answers[id]} onChange={(v) => setAnswers((a) => ({ ...a, [id]: v }))} min={f.domain.min} max={f.domain.max} step={id==="mile_time"?0.1:0.5} unit={f.unit} />
                    {id === "mile_time" && <p className="text-[11px] text-slate-500">Tip: enter as <b>mm.ss</b> (e.g., 6.30 for 6:30)</p>}
                  </Row>
                );
              })}
            </Section>

            <Section title="Anthropometrics">
              {["chest_size","arm_size","quad_size","shoulder_size","height","body_fat"].map((id) => {
                const f = CFG.factors.find((x) => x.id === id) as NumberFactor;
                return (
                  <Row key={id} label={f.label}>
                    <InputNumber value={answers[id]} onChange={(v) => setAnswers((a) => ({ ...a, [id]: v }))} min={f.domain.min} max={f.domain.max} unit={f.unit} />
                  </Row>
                );
              })}
            </Section>

            <Section title="Appearance">
              {["facial_hair","chest_hair","calloused_hands","hand_size","shoe_size"].map((id) => {
                const f = CFG.factors.find((x) => x.id === id)!;
                return (
                  <Row key={id} label={f.label}>
                    {"options" in f ? (
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        value={String(answers[id] ?? "")}
                        onChange={(e) => setAnswers((a) => ({ ...a, [id]: Number(e.target.value) }))}
                      >
                        <option value="" disabled>Choose…</option>
                        {(f as SelectFactor).options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <InputNumber value={answers[id]} onChange={(v) => setAnswers((a) => ({ ...a, [id]: v }))} min={(f as NumberFactor).domain.min} max={(f as NumberFactor).domain.max} unit={(f as NumberFactor).unit} />
                    )}
                  </Row>
                );
              })}
            </Section>

            <Section title="Knowledge (1–10)">
              {CFG.factors.filter(f => f.id.startsWith("knowledge_")).map((f) => (
                <Row key={f.id} label={(f as NumberFactor).label}>
                  <InputNumber value={answers[f.id]} onChange={(v) => setAnswers((a) => ({ ...a, [f.id]: v }))} min={(f as NumberFactor).domain.min} max={(f as NumberFactor).domain.max} unit="/10" />
                </Row>
              ))}
            </Section>

            <Section title="Activities">
              <div className="grid gap-2">
                {(CFG.factors.find((x) => x.id === "activities") as ChecklistFactor).items.map((it) => {
                  const set = (answers["activities"] as Record<string, boolean>) || {};
                  const checked = !!set[it.id];
                  return (
                    <label key={it.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="accent-slate-900"
                        checked={checked}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            activities: { ...(a.activities || {}), [it.id]: e.target.checked },
                          }))
                        }
                      />
                      <span className="text-sm">{it.label}</span>
                    </label>
                  );
                })}
              </div>
            </Section>

            <Section title="Admin-Assessed">
              <Row label="Alpha Look (admin rated 0–100)">
                <InputNumber
                  value={answers["alpha_look"]}
                  onChange={(v) => setAnswers((a) => ({ ...a, alpha_look: v }))}
                  min={0}
                  max={100}
                  step={1}
                  unit="/100"
                  disabled={!isAdmin}
                />
                {!isAdmin && <p className="text-[11px] text-slate-500">(admin sets this)</p>}
              </Row>
            </Section>
          </div>

          {/* Score + actions */}
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Alpha Lever (out of 1000)</div>
                <div className="text-3xl font-bold">{score1000}</div>
                <div className="text-sm text-slate-600">{level.name} — {level.blurb}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Save</button>
                <button onClick={() => setAnswers({})} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Reset</button>
              </div>
            </div>
          </div>

          {/* Admin panel */}
          {isAdmin && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Admin — Users</h2>
                <button onClick={exportCSV} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Export CSV</button>
              </div>
              <div className="grid gap-2">
                {Object.entries(users).map(([em, u]) => (
                  <div key={em} className="grid grid-cols-5 items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                    <div className="col-span-2">
                      <div className="font-medium">{u.profile?.name || "(no name)"}</div>
                      <div className="text-xs text-slate-500">{em}{u.isAdmin ? " • Admin" : ""}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                        {u.profile?.profilePhoto ? <img src={u.profile.profilePhoto} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="h-10 w-16 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                        {u.profile?.assessmentPhoto ? <img src={u.profile.assessmentPhoto} className="h-full w-full object-cover" /> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-24 rounded border border-slate-300 px-2 py-1"
                        placeholder="Alpha look"
                        value={u.answers?.alpha_look ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUsers((prev) => ({
                            ...prev,
                            [em]: {
                              ...prev[em],
                              answers: { ...(prev[em].answers || {}), alpha_look: v },
                            },
                          }));
                        }}
                      />
                      <button
                        className="rounded border border-slate-300 px-2 py-1"
                        onClick={() => {
                          const updated = { ...(users[em].answers || {}) };
                          const v = parseFloat(String(updated.alpha_look));
                          if (!Number.isFinite(v)) return;
                          setUsers((prev) => ({ ...prev, [em]: { ...prev[em], answers: updated } }));
                        }}
                      >
                        Save
                      </button>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      created {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
