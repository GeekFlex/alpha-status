/* =========================================
   ALPHA STATUS
   Shared types, scoring rules and utilities
   ========================================= */

export type UserRecord = {
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

export type Domain = {
  min: number;
  max: number;
  better: "higher" | "lower";
};

export type SelectOption = {
  label: string;
  value: number;
};

export type Activity = {
  id: string;
  label: string;
  points: number;
};

export type Factor =
  | {
      kind: "number";
      id: string;
      label: string;
      unit: string;
      weight: number;
      domain: Domain;
      readOnly?: boolean;
    }
  | {
      kind: "select";
      id: string;
      label: string;
      weight: number;
      options: SelectOption[];
    }
  | {
      kind: "checklist";
      id: string;
      label: string;
      weight: number;
      cap: number;
      items: Activity[];
    };

/* =========================================
   Storage
   ========================================= */

export const USERS_KEY = "alpha_status_users_v4";

/* =========================================
   Scoring configuration
   ========================================= */

export const FACTORS: Factor[] = [
  /* ---------- Appearance ---------- */

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

  {
    kind: "number",
    id: "shoe_size",
    label: "Shoe Size",
    unit: "US",
    weight: 0.02,
    domain: { min: 0, max: 20, better: "higher" },
  },

  /* ---------- Body Measurements ---------- */

  {
    kind: "number",
    id: "chest_size",
    label: "Chest Size",
    unit: "in",
    weight: 0.03,
    domain: { min: 0, max: 70, better: "higher" },
  },

  {
    kind: "number",
    id: "arm_size",
    label: "Arm Size",
    unit: "in",
    weight: 0.03,
    domain: { min: 0, max: 30, better: "higher" },
  },

  {
    kind: "number",
    id: "quad_size",
    label: "Quad Size",
    unit: "in",
    weight: 0.03,
    domain: { min: 0, max: 40, better: "higher" },
  },

  {
    kind: "number",
    id: "shoulder_size",
    label: "Shoulder Size",
    unit: "in",
    weight: 0.03,
    domain: { min: 0, max: 80, better: "higher" },
  },

  {
    kind: "number",
    id: "height",
    label: "Height",
    unit: "in",
    weight: 0.02,
    domain: { min: 0, max: 100, better: "higher" },
  },

  {
    kind: "number",
    id: "body_fat",
    label: "Body Fat",
    unit: "%",
    weight: 0.03,
    domain: { min: 0, max: 60, better: "lower" },
  },

  /* ---------- Strength ---------- */

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

  /* ---------- Conditioning ---------- */

  {
    kind: "number",
    id: "mile_time",
    label: "Fastest 1 Mile",
    unit: "min:sec",
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

  /* ---------- Member Measurements ---------- */

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

  /* ---------- Admin Ratings ---------- */

  {
    kind: "number",
    id: "alpha_look",
    label: "Alpha Look",
    unit: "/100",
    weight: 0.07,
    domain: { min: 0, max: 100, better: "higher" },
    readOnly: true,
  },

  {
    kind: "number",
    id: "alpha_bonus",
    label: "Bonus Alpha Rating",
    unit: "/100",
    weight: 0.05,
    domain: { min: 0, max: 100, better: "higher" },
    readOnly: true,
  },

  /* ---------- Life ---------- */

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

  /* ---------- Knowledge ---------- */

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
    ([id, label]): Factor => ({
      kind: "number",
      id,
      label: `Knowledge — ${label}`,
      unit: "/10",
      weight: 0.006,
      domain: { min: 1, max: 10, better: "higher" },
    })
  ),

  /* ---------- Activities ---------- */

  {
    kind: "checklist",
    id: "activities",
    label: "Activities Completed",
    weight: 0.1,
    cap: 100,

    items: [
      { id: "hyrox", label: "HYROX", points: 20 },
      { id: "spartan", label: "Spartan", points: 15 },
      { id: "marathon", label: "Marathon", points: 20 },
      { id: "triathlon", label: "Triathlon", points: 20 },
      { id: "murph", label: "Murph", points: 15 },
      { id: "tough_mudder", label: "Tough Mudder", points: 15 },

      { id: "rock_climb", label: "Rock Climbing", points: 10 },
      { id: "hiking", label: "Hiking", points: 5 },

      { id: "surfing", label: "Surfing", points: 10 },
      { id: "skiing", label: "Skiing", points: 10 },
      { id: "snowboarding", label: "Snowboarding", points: 10 },
      { id: "wakeboarding", label: "Wakeboarding", points: 10 },
      { id: "waterskiing", label: "Water Skiing", points: 10 },

      { id: "snowmobiling", label: "Driving a Snowmobile", points: 5 },
      { id: "jetski", label: "Driving a Jet Ski", points: 5 },
      { id: "drive_atv", label: "Driving an ATV", points: 10 },
      {
        id: "drive_motorcycle",
        label: "Driving a Motorcycle",
        points: 15,
      },
      { id: "drive_dirtbike", label: "Driving a Dirt Bike", points: 10 },

      { id: "fire_building", label: "Building a Fire", points: 10 },
      { id: "fishing", label: "Fishing", points: 5 },
      { id: "chopwood", label: "Chopping Wood", points: 5 },

      { id: "bjj", label: "Brazilian Jiu-Jitsu", points: 15 },
      { id: "wrestling", label: "Wrestling", points: 15 },
      { id: "boxing", label: "Boxing", points: 15 },
      { id: "winfight", label: "Winning a Fight", points: 20 },

      { id: "shootgun", label: "Shooting a Gun", points: 10 },
      { id: "shootbow", label: "Shooting a Bow and Arrow", points: 10 },

      { id: "golfing", label: "Golfing", points: 5 },
      { id: "hockey", label: "Hockey", points: 10 },
      { id: "lacrosse", label: "Lacrosse", points: 10 },
      { id: "rugby", label: "Rugby", points: 15 },
      { id: "volleyball", label: "Volleyball", points: 5 },
      { id: "football", label: "Football", points: 15 },

      { id: "powerlifting_meet", label: "Powerlifting Meet", points: 20 },
      { id: "motocross", label: "Motocross", points: 15 },

      { id: "shotgun", label: "Shotgun a Beer", points: 5 },
      { id: "baby_making", label: "Baby Making", points: 15 },
    ],
  },
];

/* =========================================
   Helpers
   ========================================= */

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function pctHigher(v: number, min: number, max: number) {
  return Math.round(clamp01((v - min) / (max - min)) * 100);
}

function pctLower(v: number, min: number, max: number) {
  return Math.round(
    (1 - clamp01((v - min) / (max - min))) * 100
  );
}

export function parseMileToSeconds(v: any): number {
  if (typeof v === "string" && v.includes(".")) {
    const [mm, ss] = v
      .split(".")
      .map((x) => parseInt(x || "0", 10));

    if (
      Number.isFinite(mm) &&
      Number.isFinite(ss)
    ) {
      return mm * 60 + ss;
    }
  }

  const asNum = parseFloat(v);

  return Number.isFinite(asNum) ? asNum : NaN;
}

/* =========================================
   Calculate individual factor score
   Returns 0–100
   ========================================= */

export function factorScore(
  factor: Factor,
  answers: Record<string, any>
): number {
  const value = answers?.[factor.id];

  if (factor.kind === "select") {
    const option = factor.options.find(
      (o) => String(o.value) === String(value)
    );

    if (option) return option.value;

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  if (factor.kind === "checklist") {
    const selected =
      value && typeof value === "object" ? value : {};

    const points = factor.items.reduce((sum, item) => {
      return sum + (selected[item.id] ? item.points : 0);
    }, 0);

    return Math.round(
      clamp01(points / factor.cap) * 100
    );
  }

  let numericValue: number;

  if (factor.id === "mile_time") {
    numericValue = parseMileToSeconds(value);
  } else {
    numericValue = Number(value);
  }

  if (!Number.isFinite(numericValue)) return 0;

  const { min, max, better } = factor.domain;

  return better === "higher"
    ? pctHigher(numericValue, min, max)
    : pctLower(numericValue, min, max);
}

/* =========================================
   Calculate Alpha Status
   Returns 0–1000
   ========================================= */

export function calculateAlphaScore(
  answers: Record<string, any> = {}
): number {
  const totalWeight = FACTORS.reduce(
    (sum, factor) => sum + factor.weight,
    0
  );

  const weightedScore = FACTORS.reduce(
    (sum, factor) => {
      const score = factorScore(factor, answers);

      return sum + score * factor.weight;
    },
    0
  );

  if (!totalWeight) return 0;

  return Math.round(
    (weightedScore / totalWeight) * 10
  );
}

/* =========================================
   Status level
   ========================================= */

export function levelFor(score: number) {
  if (score >= 900) {
    return {
      name: "Apex",
      blurb: "Elite presence.",
    };
  }

  if (score >= 750) {
    return {
      name: "Alpha",
      blurb: "High performer.",
    };
  }

  if (score >= 500) {
    return {
      name: "Contender",
      blurb: "Solid foundation.",
    };
  }

  if (score >= 250) {
    return {
      name: "Rising",
      blurb: "Early gains.",
    };
  }

  return {
    name: "Getting Started",
    blurb: "Stack small wins.",
  };
}
