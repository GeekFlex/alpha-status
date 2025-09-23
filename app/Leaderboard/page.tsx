"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/** Shared-ish look: dark glass on rugged bg */
const box: React.CSSProperties = {
  border: "1px solid rgba(30,41,59,0.3)",
  borderRadius: 14,
  background: "rgba(15,23,42,0.75)",
  backdropFilter: "blur(4px)",
  padding: 16,
};
const buttonStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  cursor: "pointer",
  letterSpacing: 0.2,
};
const buttonGhost: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid rgba(255,255,255,0.45)",
  background: "rgba(15,23,42,0.9)",
  color: "#ffffff",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};
const helperText: React.CSSProperties = { fontSize: 11, color: "#94a3b8" };

/** LocalStorage + types (same key as main page) */
const USERS_KEY = "alpha_status_users_v5";
type UserRecord = {
  passwordHash: string;
  createdAt: number;
  isAdmin?: boolean;
  profile?: { name?: string; profilePhoto?: string; assessmentPhoto?: string };
  answers?: Record<string, any>;
};
function loadUsers(): Record<string, UserRecord> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); } catch { return {}; }
}

/** Minimal scoring config (same IDs/weights/domains as home page) */
type SelectFactor = { kind: "select"; id: string; weight: number };
type NumberFactor  = { kind: "number"; id: string; weight: number; domain: { min: number; max: number; better: "higher" | "lower" } };
type ChecklistFactor = { kind: "checklist"; id: string; weight: number; cap?: number; items: { id: string; points: number }[] };
type Factor = SelectFactor | NumberFactor | ChecklistFactor;

const CFG: { factors: Factor[] } = {
  factors: [
    { kind: "select", id: "facial_hair", weight: 0.01 },
    { kind: "select", id: "chest_hair", weight: 0.01 },
    { kind: "select", id: "calloused_hands", weight: 0.01 },
    { kind: "select", id: "hand_size", weight: 0.02 },
    { kind: "number", id: "shoe_size", weight: 0.02, domain: { min: 0, max: 20, better: "higher" } },

    { kind: "number", id: "chest_size", weight: 0.03, domain: { min: 0, max: 70, better: "higher" } },
    { kind: "number", id: "arm_size", weight: 0.03, domain: { min: 0, max: 30, better: "higher" } },
    { kind: "number", id: "quad_size", weight: 0.03, domain: { min: 0, max: 40, better: "higher" } },
    { kind: "number", id: "shoulder_size", weight: 0.03, domain: { min: 0, max: 80, better: "higher" } },
    { kind: "number", id: "height", weight: 0.02, domain: { min: 0, max: 100, better: "higher" } },
    { kind: "number", id: "body_fat", weight: 0.03, domain: { min: 0, max: 60, better: "lower" } },

    { kind: "number", id: "max_bench", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },
    { kind: "number", id: "max_deadlift", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },
    { kind: "number", id: "max_squat", weight: 0.12, domain: { min: 0, max: 1000, better: "higher" } },

    { kind: "number", id: "mile_time", weight: 0.08, domain: { min: 0, max: 3600, better: "lower" } },
    { kind: "number", id: "workout_days", weight: 0.05, domain: { min: 0, max: 7, better: "higher" } },

    // heavier member weights (matches home page)
    { kind: "number", id: "member_length", weight: 0.14, domain: { min: 0, max: 12, better: "higher" } },
    { kind: "number", id: "member_girth",  weight: 0.10, domain: { min: 0, max: 8,  better: "higher" } },

    { kind: "number", id: "alpha_look", weight: 0.07, domain: { min: 0, max: 100, better: "higher" } },
    { kind: "number", id: "hit_number", weight: 0.02, domain: { min: 0, max: 500, better: "higher" } },

    // knowledge (weights only)
    { kind: "number", id: "knowledge_street",     weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_academics",  weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_sports",     weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_financial",  weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_strength",   weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_politics",   weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_travel",     weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_survival",   weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_nutrition",  weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_first_aid",  weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_mechanics",  weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_navigation", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_cooking",    weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_home_repair",weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_leadership", weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },
    { kind: "number", id: "knowledge_tech",       weight: 0.006, domain: { min: 1, max: 10, better: "higher" } },

    // activities (points only)
    {
      kind: "checklist", id: "activities", weight: 0.1, cap: 100,
      items: [
        { id: "hyrox", points: 20 }, { id: "spartan", points: 15 }, { id: "marathon", points: 20 },
        { id: "triathlon", points: 20 }, { id: "murph", points: 15 }, { id: "tough_mudder", points: 15 },
        { id: "rock_climb", points: 10 }, { id: "snowmobiling", points: 5 }, { id: "surfing", points: 10 },
        { id: "skiing", points: 10 }, { id: "snowboarding", points: 10 }, { id: "wakeboarding", points: 10 },
        { id: "waterskiing", points: 10 }, { id: "jetski", points: 5 }, { id: "shotgun", points: 5 },
        { id: "chopwood", points: 5 }, { id: "bjj", points: 15 }, { id: "wrestling", points: 15 },
        { id: "golfing", points: 5 }, { id: "boxing", points: 15 }, { id: "winfight", points: 20 },
        { id: "shootgun", points: 10 }, { id: "shootbow", points: 10 }, { id: "hiking", points: 5 },
        { id: "hockey", points: 10 }, { id: "lacrosse", points: 10 }, { id: "rugby", points: 15 },
        { id: "volleyball", points: 5 }, { id: "powerlifting_meet", points: 20 }, { id: "football", points: 15 },
        { id: "motocross", points: 15 }, { id: "fire_building", points: 10 }, { id: "fishing", points: 8 },
        { id: "baby_making", points: 5 },
      ],
    },
  ],
};

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function pctHigher(v: number, min: number, max: number) { return Math.round(clamp01((v - min) / (max - min)) * 100); }
function pctLower(v: number, min: number, max: number) { return Math.round((1 - clamp01((v - min) / (max - min))) * 100); }
function parseMileToSeconds(v: any): number {
  if (typeof v === "string" && v.includes(".")) {
    const [mm, ss] = v.split(".").map((x) => parseInt(x || "0", 10));
    if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
  }
  const asNum = parseFloat(v);
  return Number.isFinite(asNum) ? asNum : NaN;
}
function scoreFromAnswers(answers: Record<string, any>) {
  const raw: Record<string, number> = {};
  CFG.factors.forEach((f) => {
    if (f.kind === "number") {
      const vRaw = answers[f.id];
      const v = f.id === "mile_time" ? parseMileToSeconds(vRaw) : parseFloat(vRaw);
      if (!Number.isFinite(v)) { raw[f.id] = 0; return; }
      const { min, max, better } = f.domain;
      const clamped = Math.max(min, Math.min(max, v));
      raw[f.id] = better === "higher" ? pctHigher(clamped, min, max) : pctLower(clamped, min, max);
    } else if (f.kind === "select") {
      const v = Number(answers[f.id] ?? NaN);
      raw[f.id] = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
    } else if (f.kind === "checklist") {
      const set = (answers[f.id] as Record<string, boolean>) || {};
      const item = f as ChecklistFactor;
      const total = item.items.reduce((s, it) => s + (set[it.id] ? it.points : 0), 0);
      const cap = item.cap ?? 100;
      raw[f.id] = Math.round(Math.max(0, Math.min(1, total / cap)) * 100);
    }
  });
  const totalW = CFG.factors.reduce((s, f) => s + f.weight, 0);
  const weighted = CFG.factors.reduce((s, f) => s + (raw[f.id] ?? 0) * f.weight, 0);
  return Math.round((weighted / (totalW || 1)) * 10);
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<Record<string, UserRecord>>({});
  useEffect(() => { setUsers(loadUsers()); }, []);

  const leaderboard = useMemo(() => {
    return Object.entries(users).map(([email, u]) => ({
      email,
      name: u.profile?.name || email,
      photo: u.profile?.profilePhoto,
      score: scoreFromAnswers(u.answers || {}),
    })).sort((a, b) => b.score - a.score);
  }, [users]);

  return (
    <main style={{
      maxWidth: 900, margin: "0 auto", padding: 24,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      color: "#e5e7eb", position: "relative", zIndex: 1
    }}>
      {/* Background layers */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: "url('/alpha-hero.png')",
        backgroundSize: "cover", backgroundPosition: "center top",
        filter: "grayscale(15%) contrast(1.05)", opacity: 0.25, zIndex: 0
      }} />
      <div style={{
        position: "fixed", inset: 0,
        background: `
          radial-gradient(1200px 600px at 70% -10%, rgba(0,0,0,0.6), transparent),
          linear-gradient(to bottom, rgba(2,6,23,0.85), rgba(2,6,23,0.35)),
          repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, rgba(0,0,0,0.0) 2px, rgba(0,0,0,0.0) 6px)
        `,
        zIndex: 0
      }} />

      <header style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#f1f5f9", letterSpacing: 0.4 }}>Leaderboard</h1>
        <Link href="/"><button style={buttonGhost}>← Back to App</button></Link>
      </header>

      <div style={{ ...box }}>
        {leaderboard.length === 0 ? (
          <div style={helperText}>No users yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {leaderboard.map((row, idx) => (
              <div key={row.email} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 10,
                border: "1px solid rgba(148,163,184,0.3)",
                borderRadius: 12,
                background: "rgba(2,6,23,0.55)"
              }}>
                <div style={{ width: 28, textAlign: "right", fontWeight: 800 }}>{idx + 1}</div>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden",
                              background: "rgba(2,6,23,0.6)", border: "1px solid rgba(148,163,184,0.3)" }}>
                  {row.photo ? (
                    <img src={row.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ fontSize: 10, color: "#94a3b8", height: "100%", display: "grid", placeItems: "center" }}>
                      No photo
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f8fafc" }}>
                    {row.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.email}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#f8fafc" }}>{row.score}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
