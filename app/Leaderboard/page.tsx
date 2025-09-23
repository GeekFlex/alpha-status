"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/** Use the SAME key as your main page */
const USERS_KEY = "alpha_status_users_v4";

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

/** --- Simple scoring (works with your existing answers structure) --- */
type Domain = { min: number; max: number; better: "higher" | "lower" };
const domains: Record<string, Domain> = {
  // max lifts
  max_bench:   { min: 0, max: 1000, better: "higher" },
  max_deadlift:{ min: 0, max: 1000, better: "higher" },
  max_squat:   { min: 0, max: 1000, better: "higher" },
  // member
  member_length:{ min: 0, max: 12, better: "higher" },
  member_girth: { min: 0, max: 8,  better: "higher" },
  // conditioning
  mile_time:   { min: 0, max: 3600, better: "lower" }, // expects seconds or "mm.ss"
  workout_days:{ min: 0, max: 7,    better: "higher" },
  // anthropometrics
  chest_size:  { min: 0, max: 70,  better: "higher" },
  arm_size:    { min: 0, max: 30,  better: "higher" },
  quad_size:   { min: 0, max: 40,  better: "higher" },
  shoulder_size:{min: 0, max: 80,  better: "higher" },
  height:      { min: 0, max: 100, better: "higher" },
  body_fat:    { min: 0, max: 60,  better: "lower" },
  // admin look
  alpha_look:  { min: 0, max: 100, better: "higher" },
};

const weights: Record<string, number> = {
  // prioritize lifts, then member, then mile, then others
  max_bench: 0.12, max_deadlift: 0.12, max_squat: 0.12,
  member_length: 0.14, member_girth: 0.10,
  mile_time: 0.08, workout_days: 0.05,
  chest_size: 0.03, arm_size: 0.03, quad_size: 0.03, shoulder_size: 0.03, height: 0.02, body_fat: 0.03,
  alpha_look: 0.07,
  // activities bucket is handled separately as 0–100 → weight 0.10
  activities: 0.10,
};

function parseMile(v: any): number {
  if (typeof v === "string" && v.includes(".")) {
    const [mm, ss] = v.split(".").map((x) => parseInt(x || "0", 10));
    if (Number.isFinite(mm) && Number.isFinite(ss)) return mm * 60 + ss;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function norm(value: number, d: Domain) {
  const t = (value - d.min) / (d.max - d.min);
  const pct = d.better === "higher" ? Math.max(0, Math.min(1, t)) : Math.max(0, Math.min(1, 1 - t));
  return Math.round(pct * 100);
}

function scoreFromAnswers(a: Record<string, any>): number {
  if (!a) return 0;
  let total = 0;
  let wsum = 0;

  // activities → points to 0–100
  if (a.activities && typeof a.activities === "object") {
    const pts = Object.values(a.activities).filter(Boolean).length; // rough fallback if points weren’t stored
    const pct = Math.max(0, Math.min(100, pts * 5)); // approx 20 checks = 100
    total += pct * (weights.activities || 0);
    wsum  += (weights.activities || 0);
  }

  // numeric domains
  Object.keys(domains).forEach((key) => {
    const d = domains[key];
    let v: number;
    if (key === "mile_time") v = parseMile(a[key]);
    else v = Number(a[key]);
    if (!Number.isFinite(v)) return;
    const pct = norm(Math.max(d.min, Math.min(d.max, v)), d);
    const w = weights[key] || 0.02;
    total += pct * w;
    wsum += w;
  });

  if (!wsum) return 0;
  return Math.round((total / wsum) * 10); // → 0..1000
}

/** --- Styles (match your dark/rugged look) --- */
const pageWrap: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: 24,
  fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
  color: "#e5e7eb",
  position: "relative",
  zIndex: 1,
};
const box: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  background: "rgba(0,0,0,0.5)",
  padding: 16,
};
const buttonGhost: React.CSSProperties = {
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 600,
  border: "1px solid #e2e8f0",
  background: "rgba(255,255,255,0.08)",
  color: "#f8fafc",
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<Record<string, UserRecord>>({});

  useEffect(() => { setUsers(loadUsers()); }, []);

  const rows = useMemo(() => {
    return Object.entries(users).map(([email, u]) => ({
      email,
      name: u.profile?.name || email,
      photo: u.profile?.profilePhoto,
      score: scoreFromAnswers(u.answers || {}),
    }))
    .sort((a, b) => b.score - a.score);
  }, [users]);

  return (
    <main style={pageWrap}>
      {/* background image, dimmed */}
      <div style={{
        position: "fixed", inset: 0, backgroundImage: "url('/alpha-hero.png')",
        backgroundSize: "cover", backgroundPosition: "center", opacity: 0.25, zIndex: 0
      }} />

      <header style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#f1f5f9" }}>Leaderboard</h1>
        <Link href="/"><button style={buttonGhost}>← Back to App</button></Link>
      </header>

      <div style={box}>
        {rows.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 14 }}>No users yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {rows.map((r, i) => (
              <div key={r.email} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 10,
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, background: "rgba(15,23,42,0.65)"
              }}>
                <div style={{ width: 28, textAlign: "right", fontWeight: 800 }}>{i + 1}</div>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden",
                              background: "rgba(2,6,23,0.6)", border: "1px solid rgba(148,163,184,0.3)" }}>
                  {r.photo ? (
                    <img src={r.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ fontSize: 10, color: "#94a3b8", height: "100%", display: "grid", placeItems: "center" }}>
                      No photo
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f8fafc" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.email}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#f8fafc" }}>{r.score}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
