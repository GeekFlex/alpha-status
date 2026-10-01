"use client";

import React, { useEffect, useMemo, useState } from "react";

const USERS_KEY = "alpha_status_test_v1";

/* =========================================================
   TYPES
   ========================================================= */

type UserRecord = {
  passwordHash: string;
  createdAt: number;
  isAdmin?: boolean;
  profile?: {
    name?: string;
    profilePhoto?: string;
    assessmentPhoto?: string;
    extraAlphaPhotos?: string[];
  };
  answers?: Record<string, any>;
};

type Domain = {
  min: number;
  max: number;
  better: "higher" | "lower";
};

type NumberFactor = {
  kind: "number";
  id: string;
  label: string;
  unit: string;
  weight: number;
  domain: Domain;
  adminOnly?: boolean;
};

type SelectFactor = {
  kind: "select";
  id: string;
  label: string;
  weight: number;
  options: {
    label: string;
    value: number;
  }[];
};

type ChecklistFactor = {
  kind: "checklist";
  id: string;
  label: string;
  weight: number;
  cap: number;
  items: {
    id: string;
    label: string;
    points: number;
  }[];
};

type Factor = NumberFactor | SelectFactor | ChecklistFactor;

/* =========================================================
   SCORING CONFIGURATION
   ========================================================= */

const FACTORS: Factor[] = [
  /* APPEARANCE */

  {
    kind: "select",
    id: "facial_hair",
    label: "Facial Hair",
    weight: 0.01,
    options: [
      { label: "Clean shaven", value: 50 },
      { label: "Stubble", value: 70 },
      { label: "Mustache", value: 78 },
      { label: "Goatee", value: 82 },
      { label: "Trimmed beard", value: 88 },
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

  {
    kind: "number",
    id: "shoe_size",
    label: "Shoe Size",
    unit: "US",
    weight: 0.02,
    domain: { min: 0, max: 20, better: "higher" },
  },

  /* BODY STATS */

  {
    kind: "number",
    id: "age",
    label: "Age",
    unit: "years",
    weight: 0,
    domain: { min: 18, max: 100, better: "higher" },
  },

  {
    kind: "number",
    id: "weight",
    label: "Weight",
    unit: "lb",
    weight: 0.01,
    domain: { min: 0, max: 400, better: "higher" },
  },

  {
    kind: "number",
    id: "chest_size",
    label: "Chest",
    unit: "in",
    weight: 0.01,
    domain: { min: 0, max: 70, better: "higher" },
  },

  {
    kind: "number",
    id: "biceps_flexed",
    label: "Biceps - Flexed",
    unit: "in",
    weight: 0.01,
    domain: { min: 0, max: 30, better: "higher" },
  },

  {
    kind: "number",
    id: "biceps_relaxed",
    label: "Biceps - Relaxed",
    unit: "in",
    weight: 0.005,
    domain: { min: 0, max: 30, better: "higher" },
  },

  {
    kind: "number",
    id: "forearms",
    label: "Forearms",
    unit: "in",
    weight: 0.005,
    domain: { min: 0, max: 25, better: "higher" },
  },

  {
    kind: "number",
    id: "quad_size",
    label: "Quads",
    unit: "in",
    weight: 0.01,
    domain: { min: 0, max: 40, better: "higher" },
  },

  {
    kind: "number",
    id: "shoulder_size",
    label: "Shoulders",
    unit: "in",
    weight: 0.01,
    domain: { min: 0, max: 80, better: "higher" },
  },

  {
    kind: "number",
    id: "waist",
    label: "Waist at Bellybutton",
    unit: "in",
    weight: 0.005,
    domain: { min: 20, max: 70, better: "lower" },
  },

  {
    kind: "number",
    id: "glutes",
    label: "Glutes",
    unit: "in",
    weight: 0.005,
    domain: { min: 0, max: 70, better: "higher" },
  },

  {
    kind: "number",
    id: "calves",
    label: "Calves",
    unit: "in",
    weight: 0.005,
    domain: { min: 0, max: 30, better: "higher" },
  },

  {
    kind: "number",
    id: "neck",
    label: "Neck",
    unit: "in",
    weight: 0.005,
    domain: { min: 0, max: 30, better: "higher" },
  },

  {
    kind: "number",
    id: "height",
    label: "Height",
    unit: "in",
    weight: 0.01,
    domain: { min: 0, max: 100, better: "higher" },
  },

  {
    kind: "number",
    id: "body_fat",
    label: "Body Fat",
    unit: "%",
    weight: 0.02,
    domain: { min: 0, max: 60, better: "lower" },
  },

  /* STRENGTH */

  {
    kind: "number",
    id: "max_bench",
    label: "Max Bench Press",
    unit: "lb",
    weight: 0.12,
    domain: { min: 0, max: 1000, better: "higher" },
  },

  {
    kind: "number",
    id: "max_deadlift",
    label: "Max Deadlift",
    unit: "lb",
    weight: 0.12,
    domain: { min: 0, max: 1000, better: "higher" },
  },

  {
    kind: "number",
    id: "max_squat",
    label: "Max Squat",
    unit: "lb",
    weight: 0.12,
    domain: { min: 0, max: 1000, better: "higher" },
  },

  /* TRAINING EXPERIENCE */

  {
    kind: "number",
    id: "years_lifting",
    label: "Years Lifting",
    unit: "years",
    weight: 0.025,
    domain: { min: 0, max: 20, better: "higher" },
  },

  /* ATHLETIC PERFORMANCE */

  {
    kind: "number",
    id: "max_pullups",
    label: "Max Pull-Ups",
    unit: "reps",
    weight: 0.035,
    domain: { min: 0, max: 30, better: "higher" },
  },

  {
    kind: "number",
    id: "max_pushups",
    label: "Max Push-Ups",
    unit: "reps",
    weight: 0.025,
    domain: { min: 0, max: 100, better: "higher" },
  },

  {
    kind: "number",
    id: "dead_hang",
    label: "Dead Hang",
    unit: "seconds",
    weight: 0.025,
    domain: { min: 0, max: 180, better: "higher" },
  },

  {
    kind: "number",
    id: "grip_strength",
    label: "Grip Strength",
    unit: "lb",
    weight: 0.025,
    domain: { min: 0, max: 220, better: "higher" },
  },

  {
    kind: "number",
    id: "vertical_jump",
    label: "Vertical Jump",
    unit: "in",
    weight: 0.025,
    domain: { min: 0, max: 40, better: "higher" },
  },

  {
    kind: "number",
    id: "sprint_100m",
    label: "100m Sprint",
    unit: "seconds",
    weight: 0.025,
    domain: { min: 9, max: 30, better: "lower" },
  },

  {
    kind: "number",
    id: "mile_time",
    label: "Fastest 1 Mile",
    unit: "mm.ss",
    weight: 0.045,
    domain: { min: 240, max: 900, better: "lower" },
  },

  {
    kind: "number",
    id: "five_k_time",
    label: "Fastest 5K",
    unit: "mm.ss",
    weight: 0.03,
    domain: { min: 720, max: 3600, better: "lower" },
  },

  {
    kind: "number",
    id: "hyrox_time",
    label: "Best HYROX Time",
    unit: "mm.ss",
    weight: 0.03,
    domain: { min: 2700, max: 9000, better: "lower" },
  },

  /* CONDITIONING */

  {
    kind: "number",
    id: "workout_days",
    label: "Fastest 1 Mile",
    unit: "mm.ss",
    weight: 0.08,
    domain: { min: 0, max: 3600, better: "lower" },
  },

  {
    kind: "number",
    id: "workout_days",
    label: "Workout Days per Week",
    unit: "days",
    weight: 0.05,
    domain: { min: 0, max: 7, better: "higher" },
  },

  /* MEMBER */

  {
    kind: "number",
    id: "member_length",
    label: "Member Length",
    unit: "in",
    weight: 0.14,
    domain: { min: 0, max: 12, better: "higher" },
  },

  {
    kind: "number",
    id: "member_girth",
    label: "Member Girth",
    unit: "in",
    weight: 0.1,
    domain: { min: 0, max: 8, better: "higher" },
  },

  /* ADMIN */

  {
    kind: "number",
    id: "alpha_look",
    label: "Alpha Look",
    unit: "/100",
    weight: 0.07,
    domain: { min: 0, max: 100, better: "higher" },
    adminOnly: true,
  },

  {
    kind: "number",
    id: "alpha_bonus",
    label: "Bonus Alpha Rating",
    unit: "/100",
    weight: 0.05,
    domain: { min: 0, max: 100, better: "higher" },
    adminOnly: true,
  },

  /* LIFE */

  {
    kind: "number",
    id: "hit_number",
    label: "Hit Number",
    unit: "#",
    weight: 0.02,
    domain: { min: 0, max: 500, better: "higher" },
  },

  {
    kind: "number",
    id: "children_count",
    label: "Number of Children",
    unit: "#",
    weight: 0.03,
    domain: { min: 0, max: 10, better: "higher" },
  },

  /* KNOWLEDGE */

  ...[
    ["knowledge_street", "Street Smarts"],
    ["knowledge_academics", "Academics"],
    ["knowledge_sports", "Sports"],
    ["knowledge_financial", "Financial"],
    ["knowledge_strength", "Strength Training"],
    ["knowledge_politics", "Politics"],
    ["knowledge_travel", "World Travel"],
    ["knowledge_survival", "Survival"],
    ["knowledge_nutrition", "Nutrition"],
    ["knowledge_first_aid", "First Aid"],
    ["knowledge_mechanics", "Mechanics / Auto"],
    ["knowledge_navigation", "Navigation / Orienteering"],
    ["knowledge_cooking", "Cooking"],
    ["knowledge_home_repair", "Home Repair / DIY"],
    ["knowledge_leadership", "Leadership"],
    ["knowledge_tech", "Tech / Coding"],
  ].map(
    ([id, label]): NumberFactor => ({
      kind: "number",
      id,
      label: `Knowledge - ${label}`,
      unit: "/10",
      weight: 0.006,
      domain: {
        min: 1,
        max: 10,
        better: "higher",
      },
    })
  ),

  /* ACTIVITIES */

  {
    kind: "checklist",
    id: "activities",
    label: "Activities Completed",
    weight: 0.1,
    cap: 100,
    items: [
      { id: "hyrox", label: "HYROX", points: 20 },
      { id: "spartan", label: "Spartan Race", points: 15 },
      { id: "marathon", label: "Marathon", points: 20 },
      { id: "ironman", label: "Ironman", points: 25 },
      { id: "triathlon", label: "Triathlon", points: 20 },
      { id: "five_k", label: "5K", points: 10 },
      { id: "murph", label: "Murph", points: 15 },
      { id: "tough_mudder", label: "Tough Mudder", points: 15 },

      { id: "weight_lifting", label: "Weight Lifting", points: 10 },
      { id: "rock_climb", label: "Rock Climbing", points: 10 },
      { id: "hiking", label: "Hiking", points: 5 },

      { id: "surfing", label: "Surfing", points: 10 },
      { id: "skiing", label: "Skiing", points: 10 },
      { id: "snowboarding", label: "Snowboarding", points: 10 },
      { id: "wakeboarding", label: "Wakeboarding", points: 10 },
      { id: "waterskiing", label: "Water Skiing", points: 10 },
      { id: "scuba_diving", label: "Scuba Diving", points: 15 },
      { id: "cliff_diving", label: "Cliff Diving", points: 15 },
      { id: "skydiving", label: "Skydiving", points: 20 },

      { id: "snowmobiling", label: "Driving a Snowmobile", points: 5 },
      { id: "jetski", label: "Driving a Jet Ski", points: 5 },
      { id: "drive_atv", label: "Driving an ATV", points: 10 },
      { id: "drive_motorcycle", label: "Driving a Motorcycle", points: 15 },
      { id: "drive_dirtbike", label: "Driving a Dirt Bike", points: 10 },
      { id: "drag_racing", label: "Drag Racing", points: 15 },

      { id: "fire_building", label: "Building a Fire", points: 10 },
      { id: "fishing", label: "Fishing", points: 5 },
      { id: "hunting", label: "Hunting", points: 10 },
      { id: "chopwood", label: "Chopping Wood", points: 5 },

      { id: "bjj", label: "Brazilian Jiu-Jitsu", points: 15 },
      { id: "wrestling", label: "Wrestling", points: 15 },
      { id: "boxing", label: "Boxing", points: 15 },
      { id: "winfight", label: "Winning a Fight", points: 20 },

      { id: "shootgun", label: "Shooting a Gun", points: 10 },
      { id: "shootbow", label: "Shooting a Bow and Arrow", points: 10 },

      { id: "golfing", label: "Golfing", points: 5 },
      { id: "soccer", label: "Soccer", points: 10 },
      { id: "baseball", label: "Baseball", points: 10 },
      { id: "hockey", label: "Hockey", points: 10 },
      { id: "lacrosse", label: "Lacrosse", points: 10 },
      { id: "rugby", label: "Rugby", points: 15 },
      { id: "volleyball", label: "Volleyball", points: 5 },
      { id: "football", label: "Football", points: 15 },

      { id: "powerlifting_meet", label: "Powerlifting Meet", points: 20 },
      { id: "motocross", label: "Motocross", points: 15 },

      { id: "shotgun", label: "Shotgun a Beer", points: 5 },
      { id: "reproduce", label: "Reproduce", points: 15 },
    ],
  },
];

/* =========================================================
   STYLES
   ========================================================= */

const pageWrap: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "24px 18px 70px",
  position: "relative",
  zIndex: 2,
  fontFamily: "Arial, Helvetica, sans-serif",
};

const card: React.CSSProperties = {
  background:
    "linear-gradient(145deg, rgba(8,12,18,.94), rgba(15,23,42,.90))",
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 14px 40px rgba(0,0,0,.35)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "#0b1220",
  color: "#f8fafc",
  border: "1px solid #475569",
  borderRadius: 9,
  padding: "10px 11px",
  fontSize: 14,
  outline: "none",
};

const buttonBase: React.CSSProperties = {
  borderRadius: 10,
  padding: "10px 15px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const primaryButton: React.CSSProperties = {
  ...buttonBase,
  border: "1px solid #ef4444",
  background: "#dc2626",
  color: "white",
};

const lightButton: React.CSSProperties = {
  ...buttonBase,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#020617",
};

const darkButton: React.CSSProperties = {
  ...buttonBase,
  border: "1px solid #475569",
  background: "#111827",
  color: "#f8fafc",
};

const dangerButton: React.CSSProperties = {
  ...buttonBase,
  border: "1px solid #991b1b",
  background: "#450a0a",
  color: "#fecaca",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#e2e8f0",
  marginBottom: 5,
};

const helperStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  marginTop: 4,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 21,
  fontWeight: 900,
  letterSpacing: "-.3px",
};

const sectionDescription: React.CSSProperties = {
  marginTop: 5,
  marginBottom: 17,
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.5,
};

/* =========================================================
   STORAGE
   ========================================================= */

function loadUsers(): Record<string, UserRecord> {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistUsers(users: Record<string, UserRecord>) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error(error);

    alert(
      "Your browser could not save the data. Uploaded photos may be using too much browser storage."
    );
  }
}

/* =========================================================
   HELPERS
   ========================================================= */

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   SCORING
   ========================================================= */

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function parseMile(value: any) {
  if (typeof value === "string" && value.includes(".")) {
    const [minutesText, secondsText] = value.split(".");

    const minutes = parseInt(minutesText || "0", 10);
    const seconds = parseInt(secondsText || "0", 10);

    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes * 60 + seconds;
    }
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : NaN;
}

function factorScore(factor: Factor, answers: Record<string, any>) {
  const value = answers[factor.id];

  if (factor.kind === "select") {
    if (value === "" || value === undefined || value === null) {
      return 0;
    }

    const numeric = Number(value);

    return Number.isFinite(numeric)
      ? Math.max(0, Math.min(100, numeric))
      : 0;
  }

  if (factor.kind === "checklist") {
    const selections =
      value && typeof value === "object" ? value : {};

    const points = factor.items.reduce(
      (total, item) => total + (selections[item.id] ? item.points : 0),
      0
    );

    return Math.round(clamp01(points / factor.cap) * 100);
  }

  if (value === "" || value === undefined || value === null) {
    return 0;
  }

  const timeFields = ["mile_time", "five_k_time", "hyrox_time"];

  let numeric =
    timeFields.includes(factor.id) ? parseMile(value) : Number(value);

  if (!Number.isFinite(numeric)) return 0;

  const { min, max, better } = factor.domain;

  numeric = Math.max(min, Math.min(max, numeric));

  const progress = (numeric - min) / (max - min);

  if (better === "higher") {
    return Math.round(clamp01(progress) * 100);
  }

  return Math.round((1 - clamp01(progress)) * 100);
}

type Achievement = {
  id: string;
  title: string;
  description: string;
  bonus: number;
};

function getClubTotal(answers: Record<string, any> = {}) {
  return (
    (Number(answers.max_bench) || 0) +
    (Number(answers.max_squat) || 0) +
    (Number(answers.max_deadlift) || 0)
  );
}

function getAchievements(answers: Record<string, any> = {}): Achievement[] {
  const achievements: Achievement[] = [];
  const club = getClubTotal(answers);
  const bench = Number(answers.max_bench) || 0;
  const deadlift = Number(answers.max_deadlift) || 0;
  const pullups = Number(answers.max_pullups) || 0;
  const mile = parseMile(answers.mile_time);
  const activities =
    answers.activities && typeof answers.activities === "object"
      ? answers.activities
      : {};

  const add = (id: string, title: string, description: string, bonus: number) =>
    achievements.push({ id, title, description, bonus });

  if (club >= 500) add("club500", "500 Club", "500+ lb combined big three.", 2);
  if (club >= 750) add("club750", "750 Club", "750+ lb combined big three.", 3);
  if (club >= 900) add("club900", "900 Club", "900+ lb combined big three.", 4);
  if (club >= 1000) add("club1000", "1000 Club", "1000+ lb combined big three.", 5);
  if (club >= 1200) add("club1200", "1200 Club", "1200+ lb combined big three.", 6);

  if (bench >= 225) add("bench225", "Two Plates", "225+ lb bench press.", 2);
  if (bench >= 275) add("bench275", "Heavy Bench", "275+ lb bench press.", 3);
  if (bench >= 315) add("bench315", "Three Plate Bench", "315+ lb bench press.", 5);

  if (deadlift >= 315) add("dead315", "Three Plate Pull", "315+ lb deadlift.", 2);
  if (deadlift >= 405) add("dead405", "Four Plate Pull", "405+ lb deadlift.", 4);
  if (deadlift >= 500) add("dead500", "500 Pull", "500+ lb deadlift.", 6);

  if (pullups >= 10) add("pull10", "Pull-Up 10", "10+ strict pull-ups.", 2);
  if (pullups >= 15) add("pull15", "Pull-Up 15", "15+ strict pull-ups.", 3);
  if (pullups >= 20) add("pull20", "Pull-Up 20", "20+ strict pull-ups.", 5);

  if (Number.isFinite(mile) && mile > 0 && mile <= 600)
    add("mile10", "Sub-10 Mile", "Mile under 10:00.", 1);
  if (Number.isFinite(mile) && mile > 0 && mile <= 540)
    add("mile9", "Sub-9 Mile", "Mile under 9:00.", 2);
  if (Number.isFinite(mile) && mile > 0 && mile <= 480)
    add("mile8", "Sub-8 Mile", "Mile under 8:00.", 3);
  if (Number.isFinite(mile) && mile > 0 && mile <= 420)
    add("mile7", "Sub-7 Mile", "Mile under 7:00.", 5);

  if (activities.hyrox) add("hyrox", "HYROX Finisher", "Completed a HYROX.", 4);
  if (activities.marathon) add("marathon", "Marathoner", "Completed a marathon.", 5);
  if (activities.ironman) add("ironman", "Ironman", "Completed an Ironman.", 7);

  if (activities.bjj || activities.boxing || activities.wrestling)
    add("combat", "Combat Trained", "BJJ, boxing or wrestling experience.", 3);

  const outdoors = ["hiking", "hunting", "fishing", "fire_building", "chopwood"]
    .filter((id) => activities[id]).length;
  if (outdoors >= 3)
    add("outdoors", "Outdoorsman", "Completed 3+ outdoor capability activities.", 3);

  const sports = ["soccer", "baseball", "hockey", "lacrosse", "rugby", "volleyball", "football", "golfing"]
    .filter((id) => activities[id]).length;
  if (sports >= 3)
    add("multisport", "Multi-Sport Athlete", "Participated in 3+ listed sports.", 3);

  const adrenaline = ["skydiving", "cliff_diving", "motocross", "drag_racing", "drive_motorcycle", "drive_dirtbike"]
    .filter((id) => activities[id]).length;
  if (adrenaline >= 2)
    add("adrenaline", "Adrenaline Junkie", "Completed 2+ high-adrenaline activities.", 3);

  return achievements;
}

function achievementBonus(answers: Record<string, any> = {}) {
  return Math.min(
    50,
    getAchievements(answers).reduce((total, achievement) => total + achievement.bonus, 0)
  );
}

function calculateScore(answers: Record<string, any> = {}) {
  const totalWeight = FACTORS.reduce(
    (total, factor) => total + factor.weight,
    0
  );

  const weighted = FACTORS.reduce(
    (total, factor) =>
      total + factorScore(factor, answers) * factor.weight,
    0
  );

  if (!totalWeight) return 0;

  const baseScore = Math.round((weighted / totalWeight) * 9.5);
  return Math.min(1000, baseScore + achievementBonus(answers));
}

function profileCompletion(answers: Record<string, any> = {}, name = "", profilePhoto?: string) {
  const scorable = FACTORS.filter(
    (factor) =>
      factor.kind !== "checklist" &&
      !("adminOnly" in factor && factor.adminOnly) &&
      factor.id !== "age"
  );
  const completedFactors = scorable.filter((factor) => {
    const value = answers[factor.id];
    return value !== undefined && value !== null && value !== "";
  }).length;

  const activityComplete =
    answers.activities &&
    typeof answers.activities === "object" &&
    Object.values(answers.activities).some(Boolean)
      ? 1
      : 0;

  const total = scorable.length + 3;
  const completed =
    completedFactors +
    activityComplete +
    (name.trim() ? 1 : 0) +
    (profilePhoto ? 1 : 0);

  return Math.round((completed / total) * 100);
}

function levelFor(score: number) {
  if (score >= 900) {
    return { name: "APEX", description: "Elite presence." };
  }

  if (score >= 750) {
    return { name: "ALPHA", description: "High performer." };
  }

  if (score >= 500) {
    return { name: "CONTENDER", description: "Solid foundation." };
  }

  if (score >= 250) {
    return { name: "RISING", description: "Early gains." };
  }

  return { name: "GETTING STARTED", description: "Stack small wins." };
}

function getFactors(ids: string[]) {
  return ids
    .map((id) => FACTORS.find((factor) => factor.id === id))
    .filter(Boolean) as Factor[];
}

/* =========================================================
   INPUT
   ========================================================= */

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 0.5,
  unit,
  disabled = false,
}: {
  value: any;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={{
          ...inputStyle,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />

      {unit && (
        <div style={helperStyle}>
          {unit} • Range {min}-{max}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FACTOR FIELD
   ========================================================= */

function FactorField({
  factor,
  answers,
  updateAnswer,
  adminMode,
}: {
  factor: Factor;
  answers: Record<string, any>;
  updateAnswer: (id: string, value: any) => void;
  adminMode: boolean;
}) {
  if (factor.kind === "checklist") return null;

  if (factor.kind === "select") {
    return (
      <div>
        <div style={labelStyle}>{factor.label}</div>

        <select
          value={answers[factor.id] ?? ""}
          onChange={(event) => updateAnswer(factor.id, event.target.value)}
          style={inputStyle}
        >
          <option value="">Select...</option>

          {factor.options.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  let step = 0.5;

  if (
    factor.id === "workout_days" ||
    factor.id === "age" ||
    factor.id === "years_lifting" ||
    factor.id === "max_pullups" ||
    factor.id === "max_pushups" ||
    factor.id === "dead_hang" ||
    factor.id === "children_count" ||
    factor.id === "hit_number" ||
    factor.id === "alpha_look" ||
    factor.id === "alpha_bonus" ||
    factor.id.startsWith("knowledge_")
  ) {
    step = 1;
  }

  if (["mile_time", "five_k_time", "hyrox_time"].includes(factor.id)) step = 0.01;

  const disabled = !!factor.adminOnly && !adminMode;

  return (
    <div>
      <div style={labelStyle}>
        {factor.label}
        {factor.adminOnly && !adminMode && " • Admin rated"}
      </div>

      <NumberInput
        value={answers[factor.id] ?? ""}
        onChange={(value) => updateAnswer(factor.id, value)}
        min={factor.domain.min}
        max={factor.domain.max}
        step={step}
        unit={factor.unit}
        disabled={disabled}
      />
    </div>
  );
}

/* =========================================================
   FACTOR SECTION
   ========================================================= */

function FactorSection({
  title,
  description,
  factors,
  answers,
  updateAnswer,
  adminMode,
}: {
  title: string;
  description?: string;
  factors: Factor[];
  answers: Record<string, any>;
  updateAnswer: (id: string, value: any) => void;
  adminMode: boolean;
}) {
  return (
    <section style={card}>
      <h2 style={sectionTitle}>{title}</h2>

      {description && (
        <div style={sectionDescription}>{description}</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: 15,
        }}
      >
        {factors.map((factor) => (
          <FactorField
            key={factor.id}
            factor={factor}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function Page() {
  const [users, setUsers] = useState<Record<string, UserRecord>>({});
  const [storageLoaded, setStorageLoaded] = useState(false);

  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState(true);

  const [view, setView] = useState<"profile" | "leaderboard">("profile");

  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string>();
  const [assessmentPhoto, setAssessmentPhoto] = useState<string>();
  const [bonusPhotos, setBonusPhotos] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const currentUser = currentEmail ? users[currentEmail] : undefined;
  const adminMode = !!currentUser?.isAdmin;

  useEffect(() => {
    setUsers(loadUsers());
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    persistUsers(users);
  }, [users, storageLoaded]);

  useEffect(() => {
    if (!currentEmail) return;

    const user = users[currentEmail];

    if (!user) return;

    setName(user.profile?.name || "");
    setProfilePhoto(user.profile?.profilePhoto);
    setAssessmentPhoto(user.profile?.assessmentPhoto);
    setBonusPhotos(user.profile?.extraAlphaPhotos || []);
    setAnswers(user.answers || {});
  }, [currentEmail]);

  const clubNumber =
    (Number(answers.max_bench) || 0) +
    (Number(answers.max_squat) || 0) +
    (Number(answers.max_deadlift) || 0);

  const clubName =
    clubNumber >= 1000
      ? "1000 LB CLUB"
      : clubNumber >= 900
      ? "900 LB CLUB"
      : clubNumber >= 800
      ? "800 LB CLUB"
      : clubNumber >= 700
      ? "700 LB CLUB"
      : clubNumber >= 600
      ? "600 LB CLUB"
      : clubNumber >= 500
      ? "500 LB CLUB"
      : "BUILDING";

  const score = useMemo(() => calculateScore(answers), [answers]);
  const level = levelFor(score);
  const achievements = useMemo(() => getAchievements(answers), [answers]);
  const achievementPoints = useMemo(() => achievementBonus(answers), [answers]);
  const completion = useMemo(
    () => profileCompletion(answers, name, profilePhoto),
    [answers, name, profilePhoto]
  );

  const strength = getFactors([
    "max_bench",
    "max_deadlift",
    "max_squat",
  ]);

  const member = getFactors([
    "member_length",
    "member_girth",
  ]);

  const athleticPerformance = getFactors([
    "max_pullups",
    "max_pushups",
    "dead_hang",
    "grip_strength",
    "vertical_jump",
    "sprint_100m",
    "mile_time",
    "five_k_time",
    "hyrox_time",
  ]);

  const conditioning = getFactors([
    "years_lifting",
    "workout_days",
  ]);

  const bodyStats = getFactors([
    "age",
    "weight",
    "chest_size",
    "biceps_flexed",
    "biceps_relaxed",
    "forearms",
    "quad_size",
    "shoulder_size",
    "waist",
    "glutes",
    "calves",
    "neck",
    "height",
    "body_fat",
  ]);

  const appearance = getFactors([
    "shoe_size",
    "facial_hair",
    "chest_hair",
    "calloused_hands",
    "hand_size",
  ]);

  const knowledge = FACTORS.filter((factor) =>
    factor.id.startsWith("knowledge_")
  );

  const life = getFactors([
    "children_count",
    "hit_number",
  ]);

  const adminFactors = getFactors([
    "alpha_look",
    "alpha_bonus",
  ]);

  const activityFactor = FACTORS.find(
    (factor) =>
      factor.kind === "checklist" &&
      factor.id === "activities"
  );

  const activities =
    activityFactor?.kind === "checklist"
      ? activityFactor.items
      : [];

  const activityAnswers =
    answers.activities && typeof answers.activities === "object"
      ? answers.activities
      : {};

  const activityCount = Object.values(activityAnswers).filter(Boolean).length;

  async function authenticate() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert("Enter an email and password.");
      return;
    }

    const hash = await sha256(password);

    if (loginMode) {
      const user = users[cleanEmail];

      if (!user) {
        alert("No account found. Create one instead.");
        return;
      }

      if (user.passwordHash !== hash) {
        alert("Incorrect password.");
        return;
      }

      setCurrentEmail(cleanEmail);
      setPassword("");
      setView("profile");

      return;
    }

    if (users[cleanEmail]) {
      alert("That account already exists.");
      return;
    }

    const firstAccount = Object.keys(users).length === 0;

    const newUser: UserRecord = {
      passwordHash: hash,
      createdAt: Date.now(),
      isAdmin: firstAccount,
      profile: {},
      answers: {},
    };

    setUsers((previous) => ({
      ...previous,
      [cleanEmail]: newUser,
    }));

    setCurrentEmail(cleanEmail);
    setName("");
    setProfilePhoto(undefined);
    setAssessmentPhoto(undefined);
    setBonusPhotos([]);
    setAnswers({});
    setPassword("");
    setView("profile");
  }

  function logout() {
    setCurrentEmail(null);
    setEmail("");
    setPassword("");
    setName("");
    setProfilePhoto(undefined);
    setAssessmentPhoto(undefined);
    setBonusPhotos([]);
    setAnswers({});
    setView("profile");
  }

  function updateAnswer(id: string, value: any) {
    setAnswers((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  function toggleActivity(id: string) {
    updateAnswer("activities", {
      ...activityAnswers,
      [id]: !activityAnswers[id],
    });
  }

  async function uploadProfilePhoto(file?: File) {
    if (!file) return;
    const url = await fileToDataURL(file);
    setProfilePhoto(url);
  }

  async function uploadAssessmentPhoto(file?: File) {
    if (!file) return;
    const url = await fileToDataURL(file);
    setAssessmentPhoto(url);
  }

  async function uploadBonusPhotos(files: FileList | null) {
    if (!files?.length) return;

    const converted: string[] = [];

    for (const file of Array.from(files)) {
      converted.push(await fileToDataURL(file));
    }

    setBonusPhotos((previous) => [...previous, ...converted]);
  }

  function removeBonusPhoto(index: number) {
    setBonusPhotos((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  function saveProfile() {
    if (!currentEmail) return;

    setUsers((previous) => {
      const existing = previous[currentEmail];

      return {
        ...previous,

        [currentEmail]: {
          ...existing,

          profile: {
            name,
            profilePhoto,
            assessmentPhoto,
            extraAlphaPhotos: bonusPhotos,
          },

          answers,
          isAdmin: existing?.isAdmin,
        },
      };
    });

    alert("Profile saved.");
  }

  function resetAnswers() {
    const confirmed = window.confirm(
      "Reset all Alpha Status answers? Your account and photos will remain."
    );

    if (!confirmed) return;

    setAnswers({});
  }

  function exportCSV() {
    const factorIds = FACTORS.map((factor) => factor.id);

    const rows: string[][] = [
      [
        "email",
        "name",
        "admin",
        "score1000",
        "level",
        "clubTotal",
        "achievementCount",
        "achievementBonus",
        ...factorIds,
      ],
    ];

    Object.entries(users).forEach(([userEmail, user]) => {
      const userAnswers = user.answers || {};
      const userScore = calculateScore(userAnswers);

      const userClubTotal =
        (Number(userAnswers.max_bench) || 0) +
        (Number(userAnswers.max_squat) || 0) +
        (Number(userAnswers.max_deadlift) || 0);

      const factorValues = factorIds.map((id) => {
        const value = userAnswers[id];

        if (value && typeof value === "object") {
          return Object.entries(value)
            .filter(([, checked]) => !!checked)
            .map(([key]) => key)
            .join(";");
        }

        return value === undefined ? "" : String(value);
      });

      rows.push([
        userEmail,
        user.profile?.name || "",
        user.isAdmin ? "1" : "0",
        String(userScore),
        levelFor(userScore).name,
        String(userClubTotal),
        String(getAchievements(userAnswers).length),
        String(achievementBonus(userAnswers)),
        ...factorValues,
      ]);
    });

    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(cell).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `alpha_status_${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  const leaderboard = useMemo(() => {
    return Object.entries(users)
      .map(([userEmail, user]) => {
        const userAnswers = user.answers || {};
        const userScore = calculateScore(userAnswers);

        const userClubTotal =
          (Number(userAnswers.max_bench) || 0) +
          (Number(userAnswers.max_squat) || 0) +
          (Number(userAnswers.max_deadlift) || 0);

        return {
          email: userEmail,
          name: user.profile?.name || userEmail,
          photo: user.profile?.profilePhoto,
          score: userScore,
          level: levelFor(userScore).name,
          clubTotal: userClubTotal,
          achievementCount: getAchievements(userAnswers).length,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [users]);

  /* LOGIN */

  if (!currentEmail) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#f8fafc",
          position: "relative",
        }}
      >
        <Background />

        <div style={pageWrap}>
          <div style={{ textAlign: "center", paddingTop: 45 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 5,
                fontWeight: 900,
                color: "#ef4444",
              }}
            >
              PROVE IT
            </div>

            <h1
              style={{
                fontSize: 48,
                margin: "8px 0 5px",
                fontWeight: 950,
                letterSpacing: -2,
              }}
            >
              ALPHA STATUS
            </h1>

            <div style={{ color: "#cbd5e1", fontSize: 14 }}>
              Strength. Capability. Presence.
            </div>
          </div>

          <div
            style={{
              ...card,
              maxWidth: 430,
              margin: "45px auto 0",
            }}
          >
            <h2 style={{ margin: "0 0 5px", fontSize: 23 }}>
              {loginMode ? "Enter the Den" : "Create Your Profile"}
            </h2>

            <div
              style={{
                color: "#94a3b8",
                fontSize: 12,
                marginBottom: 18,
              }}
            >
              Build your score. Earn your status.
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <button
                style={loginMode ? primaryButton : lightButton}
                onClick={() => setLoginMode(true)}
              >
                Login
              </button>

              <button
                style={!loginMode ? primaryButton : lightButton}
                onClick={() => setLoginMode(false)}
              >
                Create Account
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <label>
                <div style={labelStyle}>Email</div>

                <input
                  type="email"
                  value={email}
                  style={inputStyle}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label>
                <div style={labelStyle}>Password</div>

                <input
                  type="password"
                  value={password}
                  style={inputStyle}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      authenticate();
                    }
                  }}
                />
              </label>

              <button style={primaryButton} onClick={authenticate}>
                {loginMode ? "Sign In" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* LEADERBOARD */

  if (view === "leaderboard") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#f8fafc",
          position: "relative",
        }}
      >
        <Background />

        <div style={pageWrap}>
          <Header
            email={currentEmail}
            view={view}
            setView={setView}
            exportCSV={exportCSV}
            logout={logout}
          />

          <section style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ ...sectionTitle, fontSize: 28 }}>
                  LEADERBOARD
                </h2>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    marginTop: 5,
                  }}
                >
                  Alpha Status rankings on this browser.
                </div>
              </div>

              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                {leaderboard.length} competitors
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {leaderboard.map((person, index) => (
                <div
                  key={person.email}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,.10)",
                    borderRadius: 12,
                    background:
                      index === 0
                        ? "rgba(127,29,29,.35)"
                        : "rgba(15,23,42,.72)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 950,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#020617",
                      border: "1px solid rgba(255,255,255,.15)",
                      flexShrink: 0,
                    }}
                  >
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={person.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          color: "#64748b",
                          fontSize: 10,
                        }}
                      >
                        NO PHOTO
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {person.name}
                    </div>

                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      {person.level} • {person.clubTotal} LB Total • {person.achievementCount} Achievements
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 26, fontWeight: 950 }}>
                      {person.score}
                    </div>

                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                      /1000
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* PROFILE */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        position: "relative",
      }}
    >
      <Background />

      <div style={pageWrap}>
        <Header
          email={currentEmail}
          view={view}
          setView={setView}
          exportCSV={exportCSV}
          logout={logout}
        />

        <div style={{ display: "grid", gap: 18 }}>
          {/* SCORE */}

          <section
            style={{
              ...card,
              textAlign: "center",
              padding: "30px 20px",
            }}
          >
            <div
              style={{
                color: "#ef4444",
                letterSpacing: 4,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              ALPHA STATUS
            </div>

            <div
              style={{
                fontSize: 78,
                lineHeight: 1,
                fontWeight: 950,
                marginTop: 9,
                letterSpacing: -4,
              }}
            >
              {score}
            </div>

            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 3 }}>
              OUT OF 1000
            </div>

            <div style={{ fontSize: 24, fontWeight: 950, marginTop: 13 }}>
              {level.name}
            </div>

            <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>
              {level.description}
            </div>
          </section>

          {/* ALPHA PROFILE CARD */}

          <section
            style={{
              ...card,
              background:
                "linear-gradient(135deg, rgba(69,10,10,.92), rgba(8,12,18,.96) 55%, rgba(15,23,42,.94))",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 18,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#020617",
                  border: "1px solid rgba(255,255,255,.18)",
                }}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={name || "Profile"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      color: "#64748b",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    NO PHOTO
                  </div>
                )}
              </div>

              <div>
                <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 900, letterSpacing: 3 }}>
                  ALPHA PROFILE
                </div>
                <div style={{ fontSize: 30, fontWeight: 950, marginTop: 4 }}>
                  {(name || "UNNAMED").toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, marginTop: 3 }}>
                  {level.name} • {score}/1000
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
                  {clubNumber} LB Total • {activityCount} Activities • {achievements.length} Achievements
                </div>
                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                  Bench {answers.max_bench || 0} • Squat {answers.max_squat || 0} • Deadlift {answers.max_deadlift || 0}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800 }}>
                <span>PROFILE COMPLETION</span>
                <span>{completion}%</span>
              </div>
              <div
                style={{
                  height: 8,
                  background: "#111827",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginTop: 7,
                }}
              >
                <div
                  style={{
                    width: `${completion}%`,
                    height: "100%",
                    background: "#dc2626",
                  }}
                />
              </div>
            </div>
          </section>

          {/* PROFILE */}

          <section style={card}>
            <h2 style={sectionTitle}>Profile</h2>

            <div style={sectionDescription}>
              Your Alpha Status identity.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                gap: 20,
              }}
            >
              <div>
                <div style={labelStyle}>Display Name</div>

                <input
                  value={name}
                  style={inputStyle}
                  placeholder="Your name"
                  onChange={(event) => setName(event.target.value)}
                />

                {adminMode && (
                  <div
                    style={{
                      marginTop: 8,
                      color: "#fca5a5",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    ADMIN ACCOUNT
                  </div>
                )}
              </div>

              <div>
                <div style={labelStyle}>Profile Photo</div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    uploadProfilePhoto(event.target.files?.[0])
                  }
                />

                {profilePhoto && (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      style={{
                        width: 125,
                        height: 125,
                        objectFit: "cover",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,.2)",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* PHYSIQUE */}

          <section style={card}>
            <h2 style={sectionTitle}>Physique Assessment</h2>

            <div style={sectionDescription}>
              Add an optional non-explicit physique photo.
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                uploadAssessmentPhoto(event.target.files?.[0])
              }
            />

            {assessmentPhoto && (
              <div style={{ marginTop: 15 }}>
                <img
                  src={assessmentPhoto}
                  alt="Physique"
                  style={{
                    width: "100%",
                    maxWidth: 350,
                    maxHeight: 450,
                    objectFit: "cover",
                    borderRadius: 14,
                  }}
                />
              </div>
            )}
          </section>

          {/* BONUS PHOTOS */}

          <section style={card}>
            <h2 style={sectionTitle}>Bonus Alpha Photos</h2>

            <div style={sectionDescription}>
              Fitness, competition, outdoors, action or lifestyle photos.
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => uploadBonusPhotos(event.target.files)}
            />

            {bonusPhotos.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill,minmax(145px,1fr))",
                  gap: 12,
                  marginTop: 17,
                }}
              >
                {bonusPhotos.map((photo, index) => (
                  <div key={index}>
                    <img
                      src={photo}
                      alt={`Bonus ${index + 1}`}
                      style={{
                        width: "100%",
                        height: 170,
                        objectFit: "cover",
                        borderRadius: 10,
                      }}
                    />

                    <button
                      style={{
                        ...dangerButton,
                        width: "100%",
                        marginTop: 6,
                        padding: "7px 8px",
                      }}
                      onClick={() => removeBonusPhoto(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* STRENGTH */}

          <FactorSection
            title="Strength"
            description="Enter your best one-rep max."
            factors={strength}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          {/* CLUB TOTAL */}

          <section
            style={{
              ...card,
              textAlign: "center",
              padding: "24px 20px",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 3,
              }}
            >
              STRENGTH CLUB
            </div>

            <div
              style={{
                fontSize: 48,
                fontWeight: 950,
                marginTop: 7,
              }}
            >
              {clubNumber} LB
            </div>

            <div
              style={{
                color: "#ef4444",
                fontSize: 20,
                fontWeight: 900,
                marginTop: 3,
              }}
            >
              {clubName}
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: 11,
                marginTop: 7,
              }}
            >
              Bench + Squat + Deadlift
            </div>
          </section>

          <FactorSection
            title="Member Measurements"
            description="Optional numerical measurements included in the Alpha Status formula."
            factors={member}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          <FactorSection
            title="Athletic Performance"
            description="Performance metrics affect Alpha Status. Enter mile, 5K and HYROX times as mm.ss."
            factors={athleticPerformance}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          <FactorSection
            title="Training"
            description="Training experience and weekly consistency."
            factors={conditioning}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          <FactorSection
            title="Body Stats"
            factors={bodyStats}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          <FactorSection
            title="Appearance"
            factors={appearance}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          <FactorSection
            title="Knowledge"
            description="Rate yourself from 1 to 10 in each category."
            factors={knowledge}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          {/* ACTIVITIES */}

          <section style={card}>
            <h2 style={sectionTitle}>Activities</h2>

            <div style={sectionDescription}>
              Check everything you've completed. Activity points are capped
              for scoring.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 8,
              }}
            >
              {activities.map((activity) => (
                <label
                  key={activity.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    border: "1px solid rgba(255,255,255,.09)",
                    borderRadius: 9,
                    padding: "10px 11px",
                    background: activityAnswers[activity.id]
                      ? "rgba(127,29,29,.30)"
                      : "rgba(2,6,23,.45)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!activityAnswers[activity.id]}
                    onChange={() => toggleActivity(activity.id)}
                  />

                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {activity.label}
                  </span>

                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: 11,
                    }}
                  >
                    +{activity.points}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section style={card}>
            <h2 style={sectionTitle}>Achievements</h2>
            <div style={sectionDescription}>
              Unlocked automatically from your stats and activities. Achievement bonuses can add up to 50 points to Alpha Status.
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 15,
                padding: 12,
                borderRadius: 10,
                background: "rgba(127,29,29,.24)",
                border: "1px solid rgba(239,68,68,.25)",
              }}
            >
              <strong>{achievements.length} Unlocked</strong>
              <strong style={{ color: "#fca5a5" }}>+{achievementPoints} / 50 Score Bonus</strong>
            </div>

            {achievements.length ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 10,
                }}
              >
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    style={{
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 11,
                      padding: 13,
                      background: "rgba(15,23,42,.7)",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 900 }}>{achievement.title}</div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
                      {achievement.description}
                    </div>
                    <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 900, marginTop: 7 }}>
                      +{achievement.bonus} bonus
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                Enter stats and complete activities to start unlocking achievements.
              </div>
            )}
          </section>

          <FactorSection
            title="Life & Family"
            factors={life}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          <FactorSection
            title="Admin-Assessed"
            description={
              adminMode
                ? "This test account has administrator access, so you can adjust these ratings."
                : "These ratings are locked for non-admin accounts."
            }
            factors={adminFactors}
            answers={answers}
            updateAnswer={updateAnswer}
            adminMode={adminMode}
          />

          {/* FINAL SCORE */}

          <section
            style={{
              ...card,
              textAlign: "center",
              padding: 28,
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                letterSpacing: 3,
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              CURRENT ALPHA STATUS
            </div>

            <div
              style={{
                fontSize: 58,
                fontWeight: 950,
                marginTop: 5,
              }}
            >
              {score}

              <span
                style={{
                  fontSize: 18,
                  color: "#94a3b8",
                  marginLeft: 4,
                }}
              >
                /1000
              </span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 900 }}>
              {level.name}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 9,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              <button style={primaryButton} onClick={saveProfile}>
                Save Profile
              </button>

              <button
                style={lightButton}
                onClick={() => setView("leaderboard")}
              >
                View Leaderboard
              </button>

              <button style={dangerButton} onClick={resetAnswers}>
                Reset Answers
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   BACKGROUND
   ========================================================= */

function Background() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/alpha-hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(2,6,23,.28), rgba(2,6,23,.96))",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </>
  );
}

/* =========================================================
   HEADER
   ========================================================= */

function Header({
  email,
  view,
  setView,
  exportCSV,
  logout,
}: {
  email: string;
  view: "profile" | "leaderboard";
  setView: (value: "profile" | "leaderboard") => void;
  exportCSV: () => void;
  logout: () => void;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 15,
        marginBottom: 22,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 31,
            fontWeight: 950,
            letterSpacing: -1,
          }}
        >
          ALPHA STATUS
        </h1>

        <div
          style={{
            color: "#cbd5e1",
            fontSize: 11,
            marginTop: 4,
          }}
        >
          Signed in as {email}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          style={view === "profile" ? primaryButton : lightButton}
          onClick={() => setView("profile")}
        >
          My Status
        </button>

        <button
          style={view === "leaderboard" ? primaryButton : lightButton}
          onClick={() => setView("leaderboard")}
        >
          Leaderboard
        </button>

        <button style={lightButton} onClick={exportCSV}>
          Export CSV
        </button>

        <button style={darkButton} onClick={logout}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
