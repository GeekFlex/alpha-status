"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabasePublishableKey);

/* =========================================================
   TYPES
   ========================================================= */

type UserRecord = {
  passwordHash?: string;
  createdAt: number;
  isAdmin?: boolean;
  profile?: {
    name?: string;
    profilePhoto?: string;
    assessmentPhoto?: string;
    measurementPhoto?: string;
    measurementPhotoRating?: number;
    assessmentPhotoRating?: number;
    bonusPhotoRatings?: number[];
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
   QUESTIONS

   ADD YOUR OWN QUESTIONS HERE.
   - Give every question a unique id.
   - Change the question text.
   - Add/remove answer choices inside options.
   - value is the score for that answer from 0 to 100.
   - weight controls how much that question affects Alpha Status.

    Copy one whole question object and paste it below the others
   whenever you want to add another question.
   ========================================================= */

const QUESTIONS: SelectFactor[] = [
  {
    kind: "select",
    id: "shirtless_confidence",
    label: "Do you feel confident going shirtless in public?",
    weight: 0.01,
    options: [
      { label: "Hell yeah, always shirtless!", value: 100 },
      { label: "Yes, but not always.", value: 70 },
      { label: "I don't feel very confident.", value: 30 },
      { label: "I don't take my shirt off in public", value: 10 },
    ],
  },
  {
    kind: "select",
    id: "taking_lead",
    label: "How comfortable are you taking the lead?",
    weight: 0.01,
    options: [
      { label: "I avoid it", value: 25 },
      { label: "Only when needed", value: 50 },
      { label: "Pretty comfortable", value: 75 },
      { label: "I naturally take the lead", value: 100 },
    ],
  },
];

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
    domain: { min: 0, max: 100, better: "higher" },
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
    unit: "HH.MM.SS",
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
    unit: "HH.MM.SS",
    weight: 0.045,
    domain: { min: 240, max: 900, better: "lower" },
  },

  {
    kind: "number",
    id: "five_k_time",
    label: "Fastest 5K",
    unit: "HH.MM.SS",
    weight: 0.03,
    domain: { min: 720, max: 3600, better: "lower" },
  },

  {
    kind: "number",
    id: "hyrox_time",
    label: "Best HYROX Time",
    unit: "HH.MM.SS",
    weight: 0.03,
    domain: { min: 2700, max: 9000, better: "lower" },
  },

  /* CONDITIONING */

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

  {
    kind: "number",
    id: "measurement_photo_rating",
    label: "Measurement Photo Rating",
    unit: "/100",
    weight: 0.01,
    domain: { min: 0, max: 100, better: "higher" },
    adminOnly: true,
  },
  {
    kind: "number",
    id: "physique_photo_rating",
    label: "Physique Assessment Rating",
    unit: "/100",
    weight: 0.01,
    domain: { min: 0, max: 100, better: "higher" },
    adminOnly: true,
  },
  {
    kind: "number",
    id: "bonus_photos_rating",
    label: "Bonus Alpha Photos Rating",
    unit: "/100",
    weight: 0.01,
    domain: { min: 0, max: 100, better: "higher" },
    adminOnly: true,
  },

  /* LIFESTYLE */

  {
    kind: "number",
    id: "income",
    label: "Annual Income",
    unit: "$",
    weight: 0.02,
    domain: { min: 0, max: 1000000, better: "higher" },
  },

  {
    kind: "number",
    id: "homes",
    label: "Homes",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "boats",
    label: "Boats",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "atvs",
    label: "ATVs",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "jetskis",
    label: "Jet Skis",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "motorcycles",
    label: "Motorcycles",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "rvs",
    label: "RVs",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "campers",
    label: "Campers",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "planes",
    label: "Planes",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

  {
    kind: "number",
    id: "dirt_bikes",
    label: "Dirt Bikes",
    unit: "#",
    weight: 0.01,
    domain: { min: 0, max: 10, better: "higher" },
  },

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
      { id: "axe_throwing", label: "Axe Throwing", points: 5 },
      { id: "sledge_hammer", label: "Used a Sledge Hammer", points: 5 },

      { id: "poured_concrete", label: "Poured Concrete", points: 10 },
      { id: "built_deck", label: "Built a Deck", points: 15 },
      { id: "hung_drywall", label: "Hung Drywall", points: 10 },
      { id: "electrical", label: "Electrical Work", points: 15 },
      { id: "plumbing", label: "Plumbing", points: 15 },
      { id: "carpentry", label: "Carpentry", points: 15 },
      { id: "engineering", label: "Engineering", points: 15 },
      { id: "roofing", label: "Roofing", points: 15 },
      { id: "brick_laying", label: "Brick Laying", points: 15 },
      { id: "ironworking", label: "Ironworking", points: 15 },
      { id: "welding", label: "Welding", points: 15 },

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
  ...QUESTIONS,
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
  fontFamily: "'Arial Narrow', 'Roboto Condensed', Arial, sans-serif",
};

const card: React.CSSProperties = {
  background: "linear-gradient(150deg, rgba(24,28,32,.90), rgba(8,10,12,.94) 62%, rgba(18,21,24,.90))",
  border: "1px solid rgba(168,176,184,.20)",
  borderTop: "1px solid rgba(230,234,238,.28)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 18px 48px rgba(0,0,0,.44), inset 0 1px 0 rgba(255,255,255,.045)",
  backdropFilter: "blur(8px)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "linear-gradient(180deg,#15191d,#090b0d)",
  color: "#f8fafc",
  border: "1px solid #555d64",
  borderRadius: 5,
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
  fontWeight: 950,
  letterSpacing: ".7px",
  textTransform: "uppercase",
  color: "#f1f5f9",
  textShadow: "0 2px 12px rgba(0,0,0,.45)",
};

const sectionDescription: React.CSSProperties = {
  marginTop: 5,
  marginBottom: 17,
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.5,
};

/* =========================================================
   SUPABASE HELPERS
   ========================================================= */

function publicPhotoUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return supabase.storage.from("alpha-photos").getPublicUrl(path).data.publicUrl;
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

async function uploadToBucket(bucket: string, userId: string, folder: string, file: File) {
  const path = `${userId}/${folder}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/* =========================================================
   SCORING
   ========================================================= */

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function parseMile(value: any) {
  // Timed events are entered as HH.MM.SS, e.g. 00.08.58 or 01.11.20.
  if (typeof value === "string") {
    const text = value.trim();
    const parts = text.split(".");

    if (parts.length === 3) {
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      const seconds = Number(parts[2]);

      if (
        Number.isInteger(hours) &&
        Number.isInteger(minutes) &&
        Number.isInteger(seconds) &&
        hours >= 0 &&
        minutes >= 0 && minutes < 60 &&
        seconds >= 0 && seconds < 60
      ) {
        return hours * 3600 + minutes * 60 + seconds;
      }
      return NaN;
    }
  }

  // Preserve previously saved numeric-second values.
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function TimeInput({
  value,
  onChange,
  disabled = false,
}: {
  value: any;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        value={value ?? ""}
        placeholder="00.00.00"
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value.replace(/[^0-9.]/g, "").slice(0, 8);
          onChange(next);
        }}
        style={{
          ...inputStyle,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      <div style={helperStyle}>HH.MM.SS • Example: 00.08.58 = 8 min 58 sec</div>
    </div>
  );
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

  const timeFields = ["sprint_100m", "mile_time", "five_k_time", "hyrox_time"];

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
    factor.id === "income" ||
    ["homes", "boats", "atvs", "jetskis", "motorcycles", "rvs", "campers", "planes", "dirt_bikes"].includes(factor.id) ||
    factor.id === "alpha_look" ||
    factor.id === "alpha_bonus" ||
    factor.id.startsWith("knowledge_")
  ) {
    step = 1;
  }

  if (["mile_time", "five_k_time", "hyrox_time"].includes(factor.id)) step = 0.01;

  const disabled = !!factor.adminOnly && !adminMode;
  const isTimedEvent = ["sprint_100m", "mile_time", "five_k_time", "hyrox_time"].includes(factor.id);

  if (isTimedEvent) {
    return (
      <div>
        <div style={labelStyle}>
          {factor.label}
          {factor.adminOnly && !adminMode && " • Admin rated"}
        </div>
        <TimeInput
          value={answers[factor.id] ?? ""}
          onChange={(value) => updateAnswer(factor.id, value)}
          disabled={disabled}
        />
      </div>
    );
  }

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
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState(true);
  const [view, setView] = useState<"profile" | "leaderboard" | "admin">("profile");
  const [selectedLeaderboardEmail, setSelectedLeaderboardEmail] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminSelectedId, setAdminSelectedId] = useState("");
  const [adminSelectedProfile, setAdminSelectedProfile] = useState<any>(null);
  const [adminScores, setAdminScores] = useState({ alpha_look: 0, alpha_bonus: 0, measurement_photo_rating: 0, physique_photo_rating: 0, bonus_photo_ratings: [] as number[] });
  const [adminMeasurementUrl, setAdminMeasurementUrl] = useState<string>();
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string>();
  const [profilePhotoPath, setProfilePhotoPath] = useState<string>();
  const [profileCropFile, setProfileCropFile] = useState<File | null>(null);
  const [profileCropSource, setProfileCropSource] = useState<string>();
  const [profileCropZoom, setProfileCropZoom] = useState(1);
  const [profileCropX, setProfileCropX] = useState(0);
  const [profileCropY, setProfileCropY] = useState(0);
  const [assessmentPhoto, setAssessmentPhoto] = useState<string>();
  const [assessmentPhotoPath, setAssessmentPhotoPath] = useState<string>();
  const [measurementPhoto, setMeasurementPhoto] = useState<string>();
  const [measurementPhotoPath, setMeasurementPhotoPath] = useState<string>();
  const [measurementPhotoRating, setMeasurementPhotoRating] = useState(0);
  const [assessmentPhotoRating, setAssessmentPhotoRating] = useState(0);
  const [bonusPhotoRatings, setBonusPhotoRatings] = useState<number[]>([]);
  const [bonusPhotos, setBonusPhotos] = useState<string[]>([]);
  const [bonusPhotoPaths, setBonusPhotoPaths] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const currentUser = currentEmail ? users[currentEmail] : undefined;
  // Admin status comes from the secure Supabase public.is_admin() RPC.
  // We intentionally do not trust profiles.is_admin in the browser.
  const adminMode = isAdmin;

  async function loadAdminStatus() {
    const { data, error } = await supabase.rpc("is_admin");
    if (error) {
      console.error("Could not check admin status:", error);
      setIsAdmin(false);
      return false;
    }
    const allowed = data === true;
    setIsAdmin(allowed);
    return allowed;
  }

  async function loadLeaderboard() {
    // Load the public profile data used by the leaderboard.
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name, answers, profile_photo_url, created_at");

    if (profileError) {
      console.error("Could not load leaderboard profiles:", profileError);
      return;
    }

    // Admin ratings are stored separately from profiles. Every authenticated
    // member may read these numeric ratings for leaderboard scoring, while
    // only admins may create/update them through RLS.
    const { data: adminScoreRows, error: adminScoreError } = await supabase
      .from("admin_scores")
      .select("user_id, alpha_look, alpha_bonus, measurement_photo_rating, physique_photo_rating, bonus_photo_ratings");

    if (adminScoreError) {
      console.error("Could not load leaderboard admin ratings:", adminScoreError);
    }

    const adminScoresByUser = new Map(
      (adminScoreRows || []).map((row) => [row.user_id, row])
    );

    const mapped: Record<string, UserRecord> = {};

    for (const row of profileRows || []) {
      if (!row.email) continue;

      const secureAdminScores = adminScoresByUser.get(row.id);
      const secureBonusRatings = Array.isArray(secureAdminScores?.bonus_photo_ratings)
        ? secureAdminScores.bonus_photo_ratings.map(Number)
        : [];
      const secureBonusAverage = secureBonusRatings.length
        ? secureBonusRatings.reduce((sum: number, value: number) => sum + value, 0) / secureBonusRatings.length
        : 0;

      const mergedAnswers = {
        ...(row.answers || {}),
        alpha_look: Number(secureAdminScores?.alpha_look) || 0,
        alpha_bonus: Number(secureAdminScores?.alpha_bonus) || 0,
        measurement_photo_rating: Number(secureAdminScores?.measurement_photo_rating) || 0,
        physique_photo_rating: Number(secureAdminScores?.physique_photo_rating) || 0,
        bonus_photos_rating: secureBonusAverage,
      };

      mapped[row.email] = {
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        answers: mergedAnswers,
        profile: {
          name: row.display_name || "",
          profilePhoto: publicPhotoUrl(row.profile_photo_url),
        },
      };
    }

    setUsers(mapped);
  }

  async function loadCurrentProfile(user: User) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) { console.error(error); alert(`Could not load profile: ${error.message}`); return; }

    // Admin-only ratings live in the protected admin_scores table.
    // Every authenticated user may read their OWN row, but only admins may write it.
    const { data: secureAdminScores, error: adminScoreError } = await supabase
      .from("admin_scores")
      .select("alpha_look, alpha_bonus, measurement_photo_rating, physique_photo_rating, bonus_photo_ratings")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminScoreError) {
      console.error("Could not load secure admin ratings:", adminScoreError);
    }

    const secureBonusRatings = Array.isArray(secureAdminScores?.bonus_photo_ratings)
      ? secureAdminScores.bonus_photo_ratings.map(Number)
      : [];
    const secureBonusAverage = secureBonusRatings.length
      ? secureBonusRatings.reduce((sum: number, value: number) => sum + value, 0) / secureBonusRatings.length
      : 0;

    // Merge protected admin ratings into the scoring answers in memory.
    // They are deliberately stripped back out in saveProfile(), so members cannot write them.
    const mergedAnswers = {
      ...(data.answers || {}),
      alpha_look: Number(secureAdminScores?.alpha_look) || 0,
      alpha_bonus: Number(secureAdminScores?.alpha_bonus) || 0,
      measurement_photo_rating: Number(secureAdminScores?.measurement_photo_rating) || 0,
      physique_photo_rating: Number(secureAdminScores?.physique_photo_rating) || 0,
      bonus_photos_rating: secureBonusAverage,
    };

    setName(data.display_name || "");
    setAnswers(mergedAnswers);
    setProfilePhotoPath(data.profile_photo_url || undefined);
    setProfilePhoto(publicPhotoUrl(data.profile_photo_url));
    setAssessmentPhotoPath(data.physique_photo_url || undefined);
    setAssessmentPhoto(publicPhotoUrl(data.physique_photo_url));
    setMeasurementPhotoPath(data.measurement_photo_url || undefined);
    setMeasurementPhoto(undefined);
    if (data.measurement_photo_url) {
      const signed = await supabase.storage.from("measurement-photos").createSignedUrl(data.measurement_photo_url, 3600);
      if (!signed.error) setMeasurementPhoto(signed.data.signedUrl);
    }
    const paths = Array.isArray(data.bonus_photo_urls) ? data.bonus_photo_urls : [];
    setBonusPhotoPaths(paths);
    setBonusPhotos(paths.map((path: string) => publicPhotoUrl(path) || "").filter(Boolean));
    setMeasurementPhotoRating(Number(secureAdminScores?.measurement_photo_rating) || 0);
    setAssessmentPhotoRating(Number(secureAdminScores?.physique_photo_rating) || 0);
    setBonusPhotoRatings(secureBonusRatings);
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user || null;
      setAuthUser(user);
      setCurrentEmail(user?.email?.toLowerCase() || null);
      setAuthLoaded(true);
      if (user) { loadAdminStatus(); loadCurrentProfile(user); loadLeaderboard(); }
      else setIsAdmin(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      setCurrentEmail(user?.email?.toLowerCase() || null);
      setAuthLoaded(true);
      if (user) { loadAdminStatus(); loadCurrentProfile(user); loadLeaderboard(); }
      else setIsAdmin(false);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const rated = bonusPhotoRatings.slice(0, bonusPhotos.length);
    const bonusAverage = rated.length
      ? rated.reduce((sum, value) => sum + (Number(value) || 0), 0) / rated.length
      : 0;
    setAnswers((previous) => ({
      ...previous,
      measurement_photo_rating: measurementPhotoPath ? measurementPhotoRating : 0,
      physique_photo_rating: assessmentPhotoPath ? assessmentPhotoRating : 0,
      bonus_photos_rating: bonusPhotoPaths.length ? bonusAverage : 0,
    }));
  }, [measurementPhotoPath, measurementPhotoRating, assessmentPhotoPath, assessmentPhotoRating, bonusPhotoPaths, bonusPhotos.length, bonusPhotoRatings]);

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

  const questions = getFactors(QUESTIONS.map((question) => question.id));

  const lifestyle = getFactors([
    "income",
    "homes",
    "boats",
    "atvs",
    "jetskis",
    "motorcycles",
    "rvs",
    "campers",
    "planes",
    "dirt_bikes",
    "children_count",
    "hit_number",
  ]);

  const adminFactors = getFactors([
    "alpha_look",
    "alpha_bonus",
    "measurement_photo_rating",
    "physique_photo_rating",
    "bonus_photos_rating",
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

  async function loadAdminReviewUsers() {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, answers, profile_photo_url, physique_photo_url, measurement_photo_url, bonus_photo_urls, created_at")
      .order("created_at", { ascending: true });
    if (error) { alert(`Could not load members: ${error.message}`); return; }
    setAdminUsers(data || []);
  }

  async function openAdminReview(userId: string) {
    setAdminSelectedId(userId);
    setAdminMeasurementUrl(undefined);
    const profile = adminUsers.find((item) => item.id === userId) || null;
    setAdminSelectedProfile(profile);
    if (!userId || !profile) return;

    const { data: scoreRow, error: scoreError } = await supabase
      .from("admin_scores")
      .select("alpha_look, alpha_bonus, measurement_photo_rating, physique_photo_rating, bonus_photo_ratings")
      .eq("user_id", userId)
      .maybeSingle();
    if (scoreError) { alert(`Could not load admin ratings: ${scoreError.message}`); return; }
    setAdminScores({
      alpha_look: Number(scoreRow?.alpha_look) || 0,
      alpha_bonus: Number(scoreRow?.alpha_bonus) || 0,
      measurement_photo_rating: Number(scoreRow?.measurement_photo_rating) || 0,
      physique_photo_rating: Number(scoreRow?.physique_photo_rating) || 0,
      bonus_photo_ratings: Array.isArray(scoreRow?.bonus_photo_ratings) ? scoreRow.bonus_photo_ratings.map(Number) : [],
    });

    if (profile.measurement_photo_url) {
      const signed = await supabase.storage.from("measurement-photos").createSignedUrl(profile.measurement_photo_url, 3600);
      if (!signed.error) setAdminMeasurementUrl(signed.data.signedUrl);
    }
  }

  async function saveAdminScores() {
    if (!isAdmin || !adminSelectedId) return;
    const { error } = await supabase.from("admin_scores").upsert({
      user_id: adminSelectedId,
      ...adminScores,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) { alert(`Could not save admin ratings: ${error.message}`); return; }
    alert("Admin ratings saved.");
    if (authUser?.id === adminSelectedId) await loadCurrentProfile(authUser);
  }

  async function authenticate() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) { alert("Enter an email and password."); return; }

    if (loginMode) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) { alert(error.message); return; }
      setAuthUser(data.user);
      setCurrentEmail(data.user.email?.toLowerCase() || cleanEmail);
      setPassword("");
      setView("profile");
      await loadCurrentProfile(data.user);
      await loadLeaderboard();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
    if (error) { alert(error.message); return; }
    setPassword("");
    if (!data.session) {
      alert("Account created. Check your email for the confirmation link, then come back and sign in.");
      setLoginMode(true);
      return;
    }
    if (data.user) {
      setAuthUser(data.user);
      setCurrentEmail(data.user.email?.toLowerCase() || cleanEmail);
      setView("profile");
      await loadCurrentProfile(data.user);
      await loadLeaderboard();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAuthUser(null);
    setCurrentEmail(null);
    setEmail("");
    setPassword("");
    setName("");
    setProfilePhoto(undefined);
    setProfilePhotoPath(undefined);
    setAssessmentPhoto(undefined);
    setAssessmentPhotoPath(undefined);
    setMeasurementPhoto(undefined);
    setMeasurementPhotoPath(undefined);
    setBonusPhotos([]);
    setBonusPhotoPaths([]);
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

  function startProfileCrop(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileCropFile(file);
      setProfileCropSource(String(reader.result || ""));
      setProfileCropZoom(1);
      setProfileCropX(0);
      setProfileCropY(0);
    };
    reader.readAsDataURL(file);
  }

  async function applyProfileCrop() {
    if (!profileCropFile || !profileCropSource || !authUser) return;
    try {
      const image = new Image();
      image.src = profileCropSource;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not read image."));
      });

      const size = 900;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create crop.");

      const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const scale = coverScale * profileCropZoom;
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const overflowX = Math.max(0, (drawWidth - size) / 2);
      const overflowY = Math.max(0, (drawHeight - size) / 2);
      const drawX = (size - drawWidth) / 2 + (profileCropX / 100) * overflowX;
      const drawY = (size - drawHeight) / 2 + (profileCropY / 100) * overflowY;
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not create crop.")), "image/jpeg", 0.92)
      );
      const croppedFile = new File([blob], `profile-${Date.now()}.jpg`, { type: "image/jpeg" });
      const path = await uploadToBucket("alpha-photos", authUser.id, "profile", croppedFile);
      setProfilePhotoPath(path);
      setProfilePhoto(publicPhotoUrl(path));
      setProfileCropFile(null);
      setProfileCropSource(undefined);
    } catch (error: any) { alert(`Photo upload failed: ${error.message || error}`); }
  }

  async function uploadAssessmentPhoto(file?: File) {
    if (!file || !authUser) return;
    try {
      const path = await uploadToBucket("alpha-photos", authUser.id, "physique", file);
      setAssessmentPhotoPath(path);
      setAssessmentPhoto(publicPhotoUrl(path));
    } catch (error: any) { alert(`Photo upload failed: ${error.message || error}`); }
  }

  async function uploadMeasurementPhoto(file?: File) {
    if (!file || !authUser) return;
    try {
      const path = await uploadToBucket("measurement-photos", authUser.id, "submission", file);
      setMeasurementPhotoPath(path);
      const signed = await supabase.storage.from("measurement-photos").createSignedUrl(path, 3600);
      setMeasurementPhoto(signed.error ? undefined : signed.data.signedUrl);
    } catch (error: any) { alert(`Photo upload failed: ${error.message || error}`); }
  }

  async function uploadBonusPhotos(files: FileList | null) {
    if (!files?.length || !authUser) return;
    try {
      const newPaths: string[] = [];
      for (const file of Array.from(files)) newPaths.push(await uploadToBucket("alpha-photos", authUser.id, "bonus", file));
      setBonusPhotoPaths((previous) => [...previous, ...newPaths]);
      setBonusPhotos((previous) => [...previous, ...newPaths.map((path) => publicPhotoUrl(path) || "")]);
      setBonusPhotoRatings((previous) => [...previous, ...newPaths.map(() => 0)]);
    } catch (error: any) { alert(`Photo upload failed: ${error.message || error}`); }
  }

  async function removeBonusPhoto(index: number) {
    const path = bonusPhotoPaths[index];
    if (path) await supabase.storage.from("alpha-photos").remove([path]);
    setBonusPhotoPaths((previous) => previous.filter((_, i) => i !== index));
    setBonusPhotos((previous) => previous.filter((_, i) => i !== index));
    setBonusPhotoRatings((previous) => previous.filter((_, i) => i !== index));
  }

  async function saveProfile() {
    if (!authUser) return;
    const safeAnswers = { ...answers };
    delete safeAnswers.measurement_photo_rating;
    delete safeAnswers.physique_photo_rating;
    delete safeAnswers.bonus_photos_rating;
    delete safeAnswers.alpha_look;
    delete safeAnswers.alpha_bonus;

    const { error } = await supabase.from("profiles").update({
      display_name: name.trim(),
      answers: safeAnswers,
      profile_photo_url: profilePhotoPath || null,
      physique_photo_url: assessmentPhotoPath || null,
      measurement_photo_url: measurementPhotoPath || null,
      bonus_photo_urls: bonusPhotoPaths,
      updated_at: new Date().toISOString(),
    }).eq("id", authUser.id);

    if (error) { alert(`Could not save profile: ${error.message}`); return; }
    alert("Profile saved to the server.");
    await loadCurrentProfile(authUser);
    await loadLeaderboard();
  }

  function resetAnswers() {
    const confirmed = window.confirm(
      "Reset all Alpha Status answers? Your account and photos will remain."
    );

    if (!confirmed) return;

    setAnswers({});
  }

  async function downloadShareCard() {
    // Mobile Safari/Chrome can block downloads or the Web Share API after the
    // async canvas work finishes because the original tap is no longer treated
    // as an active user gesture. Open the preview immediately from the tap, then
    // fill it with the finished card once generation completes.
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);

    const mobilePreview = isMobile ? window.open("", "_blank") : null;
    if (mobilePreview) {
      mobilePreview.document.write(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alpha Status Card</title></head><body style="margin:0;background:#030507;color:white;font-family:Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center"><div id="status" style="padding:24px;font-weight:800">Generating Alpha Card…</div></body></html>`);
      mobilePreview.document.close();
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const roundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    };

    const fitText = (
      text: string,
      maxWidth: number,
      startSize: number,
      weight = 900
    ) => {
      let size = startSize;
      while (size > 28) {
        ctx.font = `${weight} ${size}px Arial`;
        if (ctx.measureText(text).width <= maxWidth) break;
        size -= 2;
      }
      return size;
    };

    const drawPhoto = async (src: string) => {
      const img = new Image();
      // Required for Supabase-hosted images drawn onto a canvas. Without CORS,
      // some mobile browsers can silently block exporting the finished card.
      img.crossOrigin = "anonymous";
      img.src = src;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });

      const x = 70;
      const y = 250;
      const w = 400;
      const h = 480;

      const imageRatio = img.width / img.height;
      const boxRatio = w / h;

      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;

      if (imageRatio > boxRatio) {
        sw = img.height * boxRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / boxRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.save();
      roundRect(x, y, w, h, 26);
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,.28)";
      ctx.lineWidth = 3;
      roundRect(x, y, w, h, 26);
      ctx.stroke();
    };

    const background = ctx.createLinearGradient(0, 0, W, H);
    background.addColorStop(0, "#030507");
    background.addColorStop(0.55, "#111827");
    background.addColorStop(1, "#240606");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);

    // Industrial diagonal texture.
    ctx.strokeStyle = "rgba(255,255,255,.025)";
    ctx.lineWidth = 2;
    for (let x = -H; x < W; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }

    // Red top rail.
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(0, 0, W, 14);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ef4444";
    ctx.font = "900 27px Arial";
    ctx.fillText("ALPHA STATUS", 70, 82);

    ctx.fillStyle = "#64748b";
    ctx.fillRect(70, 125, 940, 2);

    if (profilePhoto) {
      try {
        await drawPhoto(profilePhoto);
      } catch {
        ctx.fillStyle = "#0f172a";
        roundRect(70, 250, 400, 480, 26);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#0f172a";
      roundRect(70, 250, 400, 480, 26);
      ctx.fill();
      ctx.fillStyle = "#64748b";
      ctx.font = "800 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("PROFILE PHOTO", 270, 500);
      ctx.textAlign = "left";
    }

    const displayName = (name || "UNNAMED").toUpperCase();
    const nameSize = fitText(displayName, 500, 68, 950);
    ctx.fillStyle = "#f8fafc";
    ctx.font = `950 ${nameSize}px Arial`;
    ctx.fillText(displayName, 520, 310);

    ctx.fillStyle = "#ef4444";
    ctx.font = "900 30px Arial";
    ctx.fillText(level.name, 520, 360);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "950 138px Arial";
    ctx.fillText(String(score), 520, 505);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "800 27px Arial";
    ctx.fillText("/ 1000 ALPHA STATUS", 525, 548);

    ctx.fillStyle = "#111827";
    roundRect(520, 590, 490, 140, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(239,68,68,.55)";
    ctx.lineWidth = 2;
    roundRect(520, 590, 490, 140, 20);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "900 22px Arial";
    ctx.fillText("STRENGTH CLUB", 550, 630);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "950 54px Arial";
    ctx.fillText(`${clubNumber} LB`, 550, 692);
    ctx.fillStyle = "#ef4444";
    ctx.font = "900 23px Arial";
    ctx.fillText(clubName, 790, 692);

    const statY = 790;
    const statW = 290;
    const gap = 35;
    const stats = [
      ["BENCH", `${answers.max_bench || 0} LB`],
      ["SQUAT", `${answers.max_squat || 0} LB`],
      ["DEADLIFT", `${answers.max_deadlift || 0} LB`],
    ];

    stats.forEach(([label, value], index) => {
      const x = 70 + index * (statW + gap);
      ctx.fillStyle = "rgba(2,6,23,.78)";
      roundRect(x, statY, statW, 145, 18);
      ctx.fill();
      ctx.strokeStyle = "rgba(148,163,184,.22)";
      roundRect(x, statY, statW, 145, 18);
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "900 20px Arial";
      ctx.fillText(label, x + 24, statY + 40);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "950 42px Arial";
      ctx.fillText(value, x + 24, statY + 98);
    });

    const mileText = answers.mile_time ? String(answers.mile_time) : "—";
    const yearsLiftingText = answers.years_lifting ? String(answers.years_lifting) : "—";
    const heightInches = Number(answers.height || 0);
    const heightText = heightInches > 0
      ? `${Math.floor(heightInches / 12)}'${Math.round(heightInches % 12)}"`
      : null;
    const bodyText = [
      heightText,
      answers.weight ? `${answers.weight} LB` : null,
      answers.body_fat ? `${answers.body_fat}% BF` : null,
    ].filter(Boolean).join(" • ") || "BODY STATS NOT ENTERED";

    ctx.fillStyle = "#94a3b8";
    ctx.font = "900 20px Arial";
    ctx.fillText("BODY", 70, 1000);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 31px Arial";
    ctx.fillText(bodyText, 70, 1040);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "900 20px Arial";
    ctx.fillText("PERFORMANCE", 70, 1095);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 30px Arial";
    ctx.fillText(
      `${mileText} MILE  •  ${yearsLiftingText} YEARS LIFTING`,
      70,
      1136
    );

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(70, 1245, 940, 3);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "800 18px Arial";
    ctx.fillText(
      `${activityCount} ACTIVITIES  •  ${achievements.length} ACHIEVEMENTS`,
      70,
      1288
    );

    const safeName = (name || "alpha-status")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const fileName = `${safeName || "alpha-status"}-share-card.png`;

    let blob: Blob;
    try {
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => value ? resolve(value) : reject(new Error("Could not create Alpha Card.")),
          "image/png"
        );
      });
    } catch (error) {
      if (mobilePreview && !mobilePreview.closed) {
        mobilePreview.document.body.innerHTML =
          '<div style="padding:24px;color:white;font-family:Arial,sans-serif;text-align:center"><h2>Could not create the card</h2><p>Close this window and try again.</p></div>';
      }
      console.error("Alpha Card generation failed:", error);
      alert("Could not create the Alpha Card. Please try again.");
      return;
    }

    const file = new File([blob], fileName, { type: "image/png" });
    const url = URL.createObjectURL(blob);

    if (isMobile) {
      // The preview window was opened synchronously by the original tap, so it
      // isn't blocked by mobile popup/download restrictions. Users can long-press
      // the finished image to Save to Photos, or use the Share button below it.
      if (mobilePreview && !mobilePreview.closed) {
        mobilePreview.document.body.innerHTML = `
          <div style="width:100%;max-width:720px;margin:0 auto;padding:16px;box-sizing:border-box">
            <img id="alpha-card-image" alt="Alpha Status Card" style="display:block;width:100%;height:auto;border-radius:14px" />
            <button id="alpha-card-share" style="width:100%;margin-top:14px;padding:14px 18px;border:0;border-radius:10px;background:#dc2626;color:white;font-size:16px;font-weight:900">Share / Save Alpha Card</button>
            <div style="color:#94a3b8;font-size:13px;line-height:1.5;margin-top:12px">You can also press and hold the image to save it.</div>
          </div>`;
        const imageEl = mobilePreview.document.getElementById("alpha-card-image") as HTMLImageElement | null;
        if (imageEl) imageEl.src = url;

        const shareButton = mobilePreview.document.getElementById("alpha-card-share");
        if (shareButton) {
          shareButton.onclick = async () => {
            try {
              if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
                await navigator.share({ files: [file], title: "Alpha Status Card" });
                return;
              }
            } catch (error: any) {
              if (error?.name === "AbortError") return;
            }

            const link = mobilePreview.document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.click();
          };
        }

        // Keep the object URL alive long enough for saving/sharing from the preview.
        setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
        return;
      }

      // If the browser blocked the preview despite the direct tap, show the image
      // in the current tab rather than failing silently.
      window.location.href = url;
      return;
    }

    // Desktop: keep the normal direct PNG download behavior.
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
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
          answers: userAnswers,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [users]);

  /* LOGIN */

  if (!authLoaded) {
    return <main style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", display: "grid", placeItems: "center" }}><div>Loading Alpha Status...</div></main>;
  }

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

  /* ADMIN REVIEW */

  if (view === "admin" && isAdmin) {
    const bonusPaths = Array.isArray(adminSelectedProfile?.bonus_photo_urls) ? adminSelectedProfile.bonus_photo_urls : [];
    const adminField = (label: string, key: "alpha_look" | "alpha_bonus" | "measurement_photo_rating" | "physique_photo_rating") => (
      <label>
        <div style={labelStyle}>{label}</div>
        <NumberInput value={adminScores[key]} min={0} max={100} step={1} unit="/100" onChange={(value) => setAdminScores((p) => ({ ...p, [key]: Math.max(0, Math.min(100, Number(value) || 0)) }))} />
      </label>
    );

    return (
      <main style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", position: "relative" }}>
        <Background />
        <div style={pageWrap}>
          <Header email={currentEmail!} view={view} setView={setView} exportCSV={exportCSV} logout={logout} isAdmin={isAdmin} onAdminOpen={() => { setView("admin"); loadAdminReviewUsers(); }} />
          <section style={card}>
            <h2 style={sectionTitle}>Admin Review</h2>
            <div style={sectionDescription}>Select a member, review their submitted photos, assign the protected admin ratings, and save.</div>
            <label>
              <div style={labelStyle}>Member</div>
              <select style={inputStyle} value={adminSelectedId} onChange={(e) => openAdminReview(e.target.value)}>
                <option value="">Select a member...</option>
                {adminUsers.map((member) => <option key={member.id} value={member.id}>{member.display_name || member.email || member.id}</option>)}
              </select>
            </label>
          </section>

          {adminSelectedProfile && (
            <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
              <section style={card}>
                <h2 style={sectionTitle}>{adminSelectedProfile.display_name || "Member"}</h2>
                <div style={sectionDescription}>{adminSelectedProfile.email}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  {adminSelectedProfile.profile_photo_url && <div><div style={labelStyle}>Profile Photo</div><img src={publicPhotoUrl(adminSelectedProfile.profile_photo_url)} alt="Profile" style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 10 }} /></div>}
                  {adminSelectedProfile.physique_photo_url && <div><div style={labelStyle}>Physique Assessment</div><img src={publicPhotoUrl(adminSelectedProfile.physique_photo_url)} alt="Physique assessment" style={{ display: "block", width: "100%", height: "auto", borderRadius: 10 }} /><div style={{ marginTop: 10 }}><div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Physique Assessment Rating: {adminScores.physique_photo_rating}/100</div><input type="range" min={0} max={100} step={1} value={adminScores.physique_photo_rating} onChange={(e) => setAdminScores((p) => ({ ...p, physique_photo_rating: Number(e.target.value) }))} style={{ width: "100%" }} /></div></div>}
                  <div><div style={labelStyle}>Measurement Submission</div>{adminMeasurementUrl ? <><img src={adminMeasurementUrl} alt="Measurement submission" style={{ display: "block", width: "100%", height: "auto", borderRadius: 10 }} /><div style={{ marginTop: 10 }}><div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Measurement Submission Rating: {adminScores.measurement_photo_rating}/100</div><input type="range" min={0} max={100} step={1} value={adminScores.measurement_photo_rating} onChange={(e) => setAdminScores((p) => ({ ...p, measurement_photo_rating: Number(e.target.value) }))} style={{ width: "100%" }} /></div></> : <div style={{ color: "#94a3b8", fontSize: 12 }}>Not submitted</div>}</div>
                </div>
              </section>

              <section style={card}>
                <h2 style={sectionTitle}>Admin Ratings</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))", gap: 15, marginTop: 18 }}>
                  {adminField("Alpha Look", "alpha_look")}
                  {adminField("Bonus Alpha Rating", "alpha_bonus")}

                </div>
              </section>

              {bonusPaths.length > 0 && <section style={card}>
                <h2 style={sectionTitle}>Bonus Alpha Photos</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 18 }}>
                  {bonusPaths.map((path: string, index: number) => <div key={path}>
                    <img src={publicPhotoUrl(path)} alt={`Bonus ${index + 1}`} style={{ display: "block", width: "100%", height: "auto", borderRadius: 10 }} />
                    <div style={{ marginTop: 8 }}><NumberInput value={adminScores.bonus_photo_ratings[index] ?? 0} min={0} max={100} step={1} unit="/100" onChange={(value) => setAdminScores((p) => { const ratings = [...p.bonus_photo_ratings]; ratings[index] = Math.max(0, Math.min(100, Number(value) || 0)); return { ...p, bonus_photo_ratings: ratings }; })} /></div>
                  </div>)}
                </div>
              </section>}

              <button style={primaryButton} onClick={saveAdminScores}>Save Admin Ratings</button>
            </div>
          )}
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
            isAdmin={isAdmin}
            onAdminOpen={() => { setView("admin"); loadAdminReviewUsers(); }}
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
                  Shared Alpha Status rankings.
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
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLeaderboardEmail(person.email)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedLeaderboardEmail(person.email); }}
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
                    cursor: "pointer",
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

            {selectedLeaderboardEmail && (() => {
              const person = leaderboard.find((entry) => entry.email === selectedLeaderboardEmail);
              if (!person) return null;
              const publicAnswers = person.answers || {};
              const activitiesMap = publicAnswers.activities && typeof publicAnswers.activities === "object" ? publicAnswers.activities : {};
              const publicActivityCount = Object.values(activitiesMap).filter(Boolean).length;
              const mileSeconds = parseMile(publicAnswers.mile_time) || 0;
              const mileLabel = mileSeconds ? `${Math.floor(mileSeconds / 60)}:${String(Math.round(mileSeconds % 60)).padStart(2, "0")}` : "—";
              return (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.82)", padding: 16, overflowY: "auto" }} onClick={() => setSelectedLeaderboardEmail(null)}>
                  <div style={{ ...card, maxWidth: 620, margin: "40px auto", background: "linear-gradient(135deg, rgba(69,10,10,.98), rgba(8,12,18,.99) 55%, rgba(15,23,42,.98))", border: "1px solid rgba(239,68,68,.35)" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 20 }}>
                      <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 900, letterSpacing: 3 }}>ALPHA PROFILE</div>
                      <button style={darkButton} onClick={() => setSelectedLeaderboardEmail(null)}>Close</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 18, alignItems: "center" }}>
                      <div style={{ width: 110, height: 110, borderRadius: 16, overflow: "hidden", background: "#020617", border: "1px solid rgba(255,255,255,.18)" }}>
                        {person.photo ? <img src={person.photo} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#64748b", fontSize: 10 }}>NO PHOTO</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 30, fontWeight: 950 }}>{person.name.toUpperCase()}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>{person.level} • {person.score}/1000</div>
                        <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 8 }}>{person.clubTotal} LB Total • {publicActivityCount} Activities • {person.achievementCount} Achievements</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 10, marginTop: 22 }}>
                      {[
                        ["BENCH", publicAnswers.max_bench ? `${publicAnswers.max_bench} LB` : "—"],
                        ["SQUAT", publicAnswers.max_squat ? `${publicAnswers.max_squat} LB` : "—"],
                        ["DEADLIFT", publicAnswers.max_deadlift ? `${publicAnswers.max_deadlift} LB` : "—"],
                        ["MILE", mileLabel],
                        ["YEARS LIFTING", publicAnswers.years_lifting ?? "—"],
                      ].map(([label, value]) => <div key={String(label)} style={{ padding: 12, borderRadius: 10, background: "rgba(2,6,23,.65)", border: "1px solid rgba(255,255,255,.09)" }}><div style={{ color: "#94a3b8", fontSize: 9, fontWeight: 900, letterSpacing: 1 }}>{label}</div><div style={{ fontSize: 18, fontWeight: 950, marginTop: 4 }}>{value}</div></div>)}
                    </div>
                  </div>
                </div>
              );
            })()}
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
        background: "#07090b",
        color: "#f8fafc",
        position: "relative",
      }}
    >
      <Background />
      <style>{`
        .alphaHero{position:relative;overflow:hidden;padding:34px 34px 28px;border-top:1px solid rgba(255,255,255,.16);border-bottom:1px solid rgba(255,255,255,.13);background:linear-gradient(115deg,rgba(5,7,9,.92),rgba(17,20,23,.72) 48%,rgba(5,7,9,.94));box-shadow:0 28px 80px rgba(0,0,0,.38)}
        .alphaHero:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(112deg,rgba(255,255,255,.018) 0 1px,transparent 1px 8px),radial-gradient(circle at 70% 38%,rgba(185,28,28,.16),transparent 28%)}
        .alphaHero:after{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#7f1d1d 20%,#ef4444 50%,#7f1d1d 80%,transparent);opacity:.7}
        .alphaHeroBrand{position:relative;z-index:2;margin-bottom:26px}.alphaEyebrow{font-size:9px;letter-spacing:5px;font-weight:900;color:#9ca3af;margin-bottom:5px}.alphaWordmark{font-family:Impact,"Arial Narrow",sans-serif;font-size:clamp(44px,8vw,78px);line-height:.88;letter-spacing:-1px;color:#e8eaed;text-shadow:0 3px 0 #000,0 8px 22px rgba(0,0,0,.7)}.alphaWordmark span{color:#c9cdd1}.alphaRule{height:5px;margin-top:13px;background:linear-gradient(90deg,#b91c1c 0 28%,rgba(255,255,255,.18) 28% 72%,transparent 72%);transform:skewX(-24deg);max-width:650px}.alphaRule i{display:block;width:18%;height:100%;margin-left:31%;background:#ef4444;box-shadow:0 0 18px rgba(239,68,68,.65)}
        .alphaHeroGrid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(230px,.8fr) minmax(320px,1.25fr);gap:36px;align-items:stretch}.alphaPortraitShell{height:360px;position:relative;overflow:hidden;background:#050607;clip-path:polygon(0 0,94% 0,100% 7%,100% 100%,0 100%);border-left:2px solid #991b1b}.alphaPortrait{width:100%;height:100%;object-fit:cover;filter:contrast(1.08) saturate(.82)}.alphaNoPhoto{height:100%;display:grid;place-items:center;color:#525960;font-weight:900;letter-spacing:3px}.alphaPortraitFade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 42%,rgba(3,4,5,.2) 62%,rgba(3,4,5,.96) 100%)}.alphaIdentityCopy{position:absolute;left:22px;right:18px;bottom:19px}.alphaName{font-family:Impact,"Arial Narrow",sans-serif;font-size:30px;letter-spacing:.8px}.alphaRank{font-size:11px;color:#ef4444;font-weight:950;letter-spacing:3px;margin-top:3px}
        .alphaScoreStage{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:360px}.alphaScoreLabel{font-size:10px;font-weight:950;letter-spacing:5px;color:#a6adb4;margin-bottom:4px}.alphaScoreRing{width:250px;height:250px;position:relative;display:grid;place-items:center;border-radius:50%;background:conic-gradient(from 215deg,#ef4444 0deg,rgba(185,28,28,.85) calc(var(--scoreArc, 250deg)),rgba(100,108,116,.22) 0deg 290deg,transparent 290deg);filter:drop-shadow(0 12px 24px rgba(0,0,0,.55))}.alphaScoreRing:before{content:"";position:absolute;inset:7px;border-radius:50%;background:radial-gradient(circle,#171a1d 0,#080a0c 65%,#020304 100%);border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 0 35px #000}.alphaScoreRing:after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(255,255,255,.12);border-bottom-color:transparent}.alphaScoreTicks{position:absolute;inset:15px;border-radius:50%;border:1px dashed rgba(255,255,255,.22);z-index:1}.alphaScoreInner{position:relative;z-index:2;text-align:center}.alphaScoreNumber{font-family:Impact,"Arial Narrow",sans-serif;font-size:92px;line-height:.8;letter-spacing:-2px;color:#f1f3f4;text-shadow:0 4px 0 #000,0 0 24px rgba(255,255,255,.08)}.alphaScoreOutOf{font-size:10px;letter-spacing:3px;color:#8e969d;font-weight:900;margin-top:13px}.alphaScoreTrack{width:min(100%,420px);height:5px;margin-top:17px;background:#24282c;transform:skewX(-22deg);overflow:hidden}.alphaScoreFill{height:100%;background:linear-gradient(90deg,#7f1d1d,#ef4444);box-shadow:0 0 14px #dc2626}.alphaScoreDescription{font-size:12px;color:#9ca3af;margin-top:11px;text-align:center;max-width:430px}
        .alphaVitals{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);margin-top:26px;border-top:1px solid rgba(255,255,255,.15);border-bottom:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.2)}.alphaVital{padding:15px 18px;border-right:1px solid rgba(255,255,255,.12)}.alphaVital:last-child{border-right:0}.alphaVitalLabel{font-size:9px;color:#858d95;font-weight:950;letter-spacing:2.5px}.alphaVitalValue{font-family:Impact,"Arial Narrow",sans-serif;font-size:30px;line-height:1;margin-top:5px}.alphaVitalValue small{font-family:Arial,sans-serif;font-size:9px;color:#8b939a;margin-left:5px;letter-spacing:1px}
        .alphaLiftDeck{position:relative;z-index:2;margin-top:22px}.alphaDeckTitle{font-size:10px;color:#8e969d;font-weight:950;letter-spacing:3px;margin-bottom:8px}.alphaDeckTitle span{color:#ef4444;margin-left:8px}.alphaLiftGrid{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid rgba(255,255,255,.12)}.alphaLift{padding:13px 12px 9px;border-right:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(255,255,255,.035),transparent)}.alphaLift:last-child{border-right:0}.alphaLift div{font-size:9px;letter-spacing:2px;color:#858d95;font-weight:900}.alphaLift strong{font-family:Impact,"Arial Narrow",sans-serif;font-size:29px;margin-right:4px}.alphaLift small{font-size:8px;color:#777f87}.alphaLiftMeta strong{color:#d1d5db}.alphaHeroActions{position:relative;z-index:2;display:flex;gap:9px;flex-wrap:wrap;margin-top:22px}
        @media(max-width:760px){.alphaHero{padding:26px 17px 22px}.alphaHeroGrid{grid-template-columns:1fr;gap:18px}.alphaPortraitShell{height:300px}.alphaScoreStage{min-height:auto;padding:8px 0}.alphaScoreRing{width:220px;height:220px}.alphaScoreNumber{font-size:80px}.alphaVitals{grid-template-columns:repeat(2,1fr)}.alphaVital:nth-child(2){border-right:0}.alphaVital:nth-child(-n+2){border-bottom:1px solid rgba(255,255,255,.12)}.alphaLiftGrid{grid-template-columns:repeat(3,1fr)}.alphaLift:nth-child(3){border-right:0}.alphaLift:nth-child(n+4){border-top:1px solid rgba(255,255,255,.1)}.alphaWordmark{font-size:50px}}
      `}</style>

      <div style={pageWrap}>
        <Header
          email={currentEmail}
          view={view}
          setView={setView}
          exportCSV={exportCSV}
          logout={logout}
          isAdmin={isAdmin}
          onAdminOpen={() => { setView("admin"); loadAdminReviewUsers(); }}
        />

        <div style={{ display: "grid", gap: 18 }}>
          {/* MOCKUP-STYLE PERFORMANCE HERO */}
          <section className="alphaHero">
            <div className="alphaHeroBrand">
              <div className="alphaEyebrow">THE MEASURE OF THE MAN</div>
              <div className="alphaWordmark">ALPHA <span>STATUS</span></div>
              <div className="alphaRule"><i /></div>
            </div>

            <div className="alphaHeroGrid">
              <div className="alphaIdentity">
                <div className="alphaPortraitShell">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={name || "Profile"} className="alphaPortrait" />
                  ) : (
                    <div className="alphaNoPhoto">NO PHOTO</div>
                  )}
                  <div className="alphaPortraitFade" />
                  <div className="alphaIdentityCopy">
                    <div className="alphaName">{(name || "UNNAMED").toUpperCase()}</div>
                    <div className="alphaRank">{level.name}</div>
                  </div>
                </div>
              </div>

              <div className="alphaScoreStage">
                <div className="alphaScoreLabel">ALPHA SCORE</div>
                <div className="alphaScoreRing">
                  <div className="alphaScoreTicks" />
                  <div className="alphaScoreInner">
                    <div className="alphaScoreNumber">{score}</div>
                    <div className="alphaScoreOutOf">/ 1000</div>
                  </div>
                </div>
                <div className="alphaScoreTrack">
                  <div className="alphaScoreFill" style={{ width: `${Math.max(0, Math.min(100, score / 10))}%` }} />
                </div>
                <div className="alphaScoreDescription">{level.description}</div>
              </div>
            </div>

            <div className="alphaVitals">
              {[
                ["AGE", answers.age || "—", "YRS"],
                ["HEIGHT", Number(answers.height || 0) > 0 ? `${Math.floor(Number(answers.height) / 12)}\'${Math.round(Number(answers.height) % 12)}\"` : "—", ""],
                ["WEIGHT", answers.weight || "—", "LB"],
                ["BODY FAT", answers.body_fat || "—", "%"],
              ].map(([label, value, unit]) => (
                <div className="alphaVital" key={String(label)}>
                  <div className="alphaVitalLabel">{label}</div>
                  <div className="alphaVitalValue">{value}<small>{unit}</small></div>
                </div>
              ))}
            </div>

            <div className="alphaLiftDeck">
              <div className="alphaDeckTitle">STRENGTH TOTAL <span>{clubNumber} LB</span></div>
              <div className="alphaLiftGrid">
                {[
                  ["BENCH", answers.max_bench || 0],
                  ["SQUAT", answers.max_squat || 0],
                  ["DEADLIFT", answers.max_deadlift || 0],
                ].map(([label, value]) => (
                  <div className="alphaLift" key={String(label)}>
                    <div>{label}</div><strong>{value}</strong><small>LB</small>
                  </div>
                ))}
                <div className="alphaLift alphaLiftMeta"><div>ACTIVITIES</div><strong>{activityCount}</strong></div>
                <div className="alphaLift alphaLiftMeta"><div>ACHIEVEMENTS</div><strong>{achievements.length}</strong></div>
              </div>
            </div>

            <div className="alphaHeroActions">
              <button style={primaryButton} onClick={saveProfile}>Save Profile</button>
              <button style={darkButton} onClick={downloadShareCard}>Download Alpha Card</button>
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
                    startProfileCrop(event.target.files?.[0])
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
                    display: "block",
                    maxWidth: "100%",
                    width: "auto",
                    height: "auto",
                    borderRadius: 14,
                  }}
                />
                {adminMode && (
                  <div style={{ marginTop: 12, maxWidth: 260 }}>
                    <label style={{ fontSize: 12, fontWeight: 900 }}>
                      Admin Rating: {assessmentPhotoRating}/100
                    </label>
                    <input type="range" min={0} max={100} step={1} value={assessmentPhotoRating}
                      onChange={(event) => setAssessmentPhotoRating(Number(event.target.value))}
                      style={{ width: "100%", marginTop: 8 }} />
                  </div>
                )}
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
                        display: "block",
                        width: "100%",
                        height: "auto",
                        borderRadius: 10,
                      }}
                    />

                    {adminMode && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 900 }}>
                          Admin Rating: {bonusPhotoRatings[index] || 0}/100
                        </div>
                        <input type="range" min={0} max={100} step={1}
                          value={bonusPhotoRatings[index] || 0}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setBonusPhotoRatings((previous) => {
                              const next = [...previous];
                              next[index] = value;
                              return next;
                            });
                          }}
                          style={{ width: "100%", marginTop: 5 }} />
                      </div>
                    )}

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

          {/* STRENGTH STAT PLATES */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 12,
            }}
          >
            {[
              ["BENCH PRESS", answers.max_bench || 0],
              ["BACK SQUAT", answers.max_squat || 0],
              ["DEADLIFT", answers.max_deadlift || 0],
            ].map(([lift, value]) => (
              <div
                key={String(lift)}
                style={{
                  ...card,
                  textAlign: "center",
                  padding: "22px 14px",
                  position: "relative",
                  overflow: "hidden",
                  background:
                    "radial-gradient(circle at 50% 110%, rgba(127,29,29,.45), transparent 52%), linear-gradient(180deg, rgba(17,24,39,.96), rgba(3,5,8,.98))",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -18,
                    right: -18,
                    top: "50%",
                    height: 5,
                    background: "rgba(148,163,184,.16)",
                    boxShadow: "0 -4px 0 rgba(2,6,23,.9), 0 4px 0 rgba(2,6,23,.9)",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    color: "#94a3b8",
                    fontSize: 11,
                    fontWeight: 950,
                    letterSpacing: 2.5,
                  }}
                >
                  {lift}
                </div>
                <div
                  style={{
                    position: "relative",
                    fontSize: 43,
                    fontWeight: 950,
                    marginTop: 8,
                    textShadow: "0 3px 18px rgba(0,0,0,.8)",
                  }}
                >
                  {value}
                  <span style={{ fontSize: 15, color: "#94a3b8", marginLeft: 5 }}>
                    LB
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CLUB TOTAL */}

          <section
            style={{
              ...card,
              textAlign: "center",
              padding: "30px 20px",
              border: "2px solid rgba(239,68,68,.34)",
              background:
                "radial-gradient(circle, rgba(127,29,29,.32), transparent 52%), linear-gradient(145deg, rgba(3,5,8,.98), rgba(17,24,39,.96))",
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

          <section style={card}>
            <h2 style={sectionTitle}>Optional Measurement Photo</h2>
            <div style={sectionDescription}>
              Status: {measurementPhoto ? "Submitted" : "Not Submitted"}
            </div>

            {!measurementPhoto && (
              <input
                type="file"
                accept="image/*"
                onChange={(event) => uploadMeasurementPhoto(event.target.files?.[0])}
              />
            )}

            {measurementPhoto && !adminMode && (
              <button
                style={darkButton}
                onClick={() => {
                  setMeasurementPhoto(undefined);
                  setMeasurementPhotoRating(0);
                }}
              >
                Remove Submission
              </button>
            )}

            {adminMode && measurementPhoto && (
              <div style={{ marginTop: 15 }}>
                <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 900, marginBottom: 8 }}>
                  ADMIN REVIEW
                </div>
                <img
                  src={measurementPhoto}
                  alt="Measurement submission"
                  style={{ width: "100%", maxWidth: 350, maxHeight: 450, objectFit: "cover", borderRadius: 14 }}
                />
                <div style={{ marginTop: 12, maxWidth: 260 }}>
                  <label style={{ fontSize: 12, fontWeight: 900 }}>
                    Measurement Photo Rating: {measurementPhotoRating}/100
                  </label>
                  <input type="range" min={0} max={100} step={1} value={measurementPhotoRating}
                    onChange={(event) => setMeasurementPhotoRating(Number(event.target.value))}
                    style={{ width: "100%", marginTop: 8 }} />
                </div>
              </div>
            )}
          </section>

          <FactorSection
            title="Athletic Performance"
            description="Performance metrics affect Alpha Status. Enter 100m, mile, 5K and HYROX times as HH.MM.SS."
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

          <FactorSection
            title="Questions"
            description="Choose the answer that fits you best. These questions affect Alpha Status."
            factors={questions}
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
                      border:
                        achievement.bonus >= 5
                          ? "1px solid rgba(239,68,68,.62)"
                          : achievement.bonus >= 3
                          ? "1px solid rgba(203,213,225,.34)"
                          : "1px solid rgba(148,163,184,.20)",
                      borderRadius: 14,
                      padding: 15,
                      background:
                        achievement.bonus >= 5
                          ? "radial-gradient(circle at 50% 0%, rgba(127,29,29,.50), rgba(15,23,42,.88) 62%)"
                          : "linear-gradient(145deg, rgba(30,41,59,.82), rgba(2,6,23,.88))",
                      boxShadow:
                        achievement.bonus >= 5
                          ? "inset 0 0 25px rgba(220,38,38,.08)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        marginBottom: 10,
                        background:
                          achievement.bonus >= 5
                            ? "rgba(185,28,28,.38)"
                            : "rgba(71,85,105,.30)",
                        border: "1px solid rgba(255,255,255,.12)",
                        fontSize: 20,
                      }}
                    >
                      ★
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: ".3px" }}>
                      {achievement.title}
                    </div>
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
            title="Lifestyle"
            factors={lifestyle}
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

              <button style={darkButton} onClick={downloadShareCard}>
                Download Alpha Card
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

      {profileCropSource && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.88)", display: "grid", placeItems: "center", padding: 18 }}>
          <div style={{ ...card, width: "min(94vw, 520px)", margin: 0 }}>
            <h2 style={sectionTitle}>Crop Profile Picture</h2>
            <div style={sectionDescription}>Move and zoom the photo until the square shows exactly what you want.</div>
            <div style={{ width: "min(78vw, 360px)", aspectRatio: "1 / 1", margin: "0 auto", overflow: "hidden", borderRadius: 14, border: "2px solid rgba(255,255,255,.35)", background: "#000", position: "relative" }}>
              <img src={profileCropSource} alt="Crop preview" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${profileCropX * 0.35}%, ${profileCropY * 0.35}%) scale(${profileCropZoom})`, transformOrigin: "center", userSelect: "none" }} />
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              <label><div style={labelStyle}>Zoom</div><input type="range" min={1} max={3} step={0.01} value={profileCropZoom} onChange={(e) => setProfileCropZoom(Number(e.target.value))} style={{ width: "100%" }} /></label>
              <label><div style={labelStyle}>Move Left / Right</div><input type="range" min={-100} max={100} step={1} value={profileCropX} onChange={(e) => setProfileCropX(Number(e.target.value))} style={{ width: "100%" }} /></label>
              <label><div style={labelStyle}>Move Up / Down</div><input type="range" min={-100} max={100} step={1} value={profileCropY} onChange={(e) => setProfileCropY(Number(e.target.value))} style={{ width: "100%" }} /></label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button style={primaryButton} onClick={applyProfileCrop}>Use This Crop</button>
              <button style={darkButton} onClick={() => { setProfileCropFile(null); setProfileCropSource(undefined); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
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
          opacity: 0.18,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 0%, rgba(72,78,84,.28), transparent 38%), linear-gradient(to bottom, rgba(5,7,9,.42), rgba(4,5,6,.98))",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 50% 10%, rgba(255,255,255,.035), transparent 30%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background:
            "linear-gradient(to bottom, transparent, rgba(185,28,28,.72) 25%, rgba(185,28,28,.72) 75%, transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background:
            "linear-gradient(to bottom, transparent, rgba(185,28,28,.72) 25%, rgba(185,28,28,.72) 75%, transparent)",
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
  isAdmin,
  onAdminOpen,
}: {
  email: string;
  view: "profile" | "leaderboard" | "admin";
  setView: (value: "profile" | "leaderboard" | "admin") => void;
  exportCSV: () => void;
  logout: () => void;
  isAdmin: boolean;
  onAdminOpen: () => void;
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

        {isAdmin && (
          <div
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "4px 9px",
              borderRadius: 999,
              background: "#7f1d1d",
              border: "1px solid #ef4444",
              color: "#fee2e2",
              fontSize: 10,
              fontWeight: 950,
              letterSpacing: 1.2,
            }}
          >
            ADMIN
          </div>
        )}
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

        {isAdmin && (
          <button style={view === "admin" ? primaryButton : lightButton} onClick={onAdminOpen}>
            Admin Review
          </button>
        )}

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
