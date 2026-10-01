"use client";
// Alpha Status production deployment
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  FACTORS,
  USERS_KEY,
  calculateAlphaScore,
  levelFor,
  type Factor,
  type UserRecord,
} from "./lib/alpha";

/* =========================================
   STYLES
   ========================================= */

const pageWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "24px 18px 60px",
  position: "relative",
  zIndex: 1,
  fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
};

const box: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  background: "rgba(2,6,23,0.82)",
  padding: 18,
  color: "#f8fafc",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "9px 11px",
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
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const buttonPrimary: React.CSSProperties = {
  ...buttonStyle,
  background: "#dc2626",
  color: "#fff",
  border: "1px solid #ef4444",
};

const buttonGhost: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#020617",
};

const buttonDanger: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #7f1d1d",
  background: "#450a0a",
  color: "#fecaca",
};

const labelText: React.CSSProperties = {
  fontSize: 12,
  color: "#f1f5f9",
  fontWeight: 700,
  marginBottom: 5,
};

const helperText: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  margin: "0 0 4px",
  color: "#f8fafc",
};

const sectionDescription: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 16,
};

/* =========================================
   STORAGE
   ========================================= */

function loadUsers(): Record<string, UserRecord> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, UserRecord>) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error(error);
    alert(
      "The browser could not save your data. Large uploaded photos can exceed browser storage."
    );
  }
}

/* =========================================
   HELPERS
   ========================================= */

async function sha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function getFactor(id: string) {
  return FACTORS.find((f) => f.id === id);
}

function getFactors(ids: string[]) {
  return ids
    .map((id) => getFactor(id))
    .filter(Boolean) as Factor[];
}

/* =========================================
   NUMBER INPUT

   Defined outside Page so React doesn't
   remount the input every time you type.
   ========================================= */

function NumberInput(props: {
  value: any;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const {
    value,
    onChange,
    min,
    max,
    step = 0.5,
    unit,
    disabled = false,
  } = props;

  return (
    <div>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        style={{
          ...inputStyle,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />

      {unit && (
        <div style={{ ...helperText, marginTop: 4 }}>
          {unit} • Range {min}–{max}
        </div>
      )}
    </div>
  );
}

/* =========================================
   FIELD COMPONENT
   ========================================= */

function FactorField(props: {
  factor: Factor;
  answers: Record<string, any>;
  updateAnswer: (id: string, value: any) => void;
  isAdmin: boolean;
}) {
  const { factor, answers, updateAnswer, isAdmin } = props;

  if (factor.kind === "checklist") {
    return null;
  }

  if (factor.kind === "select") {
    return (
      <div>
        <div style={labelText}>{factor.label}</div>

        <select
          style={inputStyle}
          value={answers[factor.id] ?? ""}
          onChange={(e) => updateAnswer(factor.id, e.target.value)}
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

  const disabled = !!factor.readOnly && !isAdmin;

  let step = 0.5;

  if (
    factor.id === "workout_days" ||
    factor.id === "children_count" ||
    factor.id === "hit_number" ||
    factor.id.startsWith("knowledge_") ||
    factor.id === "alpha_look" ||
    factor.id === "alpha_bonus"
  ) {
    step = 1;
  }

  if (factor.id === "mile_time") {
    step = 0.01;
  }

  return (
    <div>
      <div style={labelText}>
        {factor.label}
        {factor.readOnly && !isAdmin ? " • Admin rated" : ""}
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

/* =========================================
   SECTION
   ========================================= */

function FactorSection(props: {
  title: string;
  description?: string;
  factors: Factor[];
  answers: Record<string, any>;
  updateAnswer: (id: string, value: any) => void;
  isAdmin: boolean;
}) {
  const {
    title,
    description,
    factors,
    answers,
    updateAnswer,
    isAdmin,
  } = props;

  return (
    <section style={box}>
      <h2 style={sectionTitle}>{title}</h2>

      {description && (
        <div style={sectionDescription}>{description}</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
        }}
      >
        {factors.map((factor) => (
          <FactorField
            key={factor.id}
            factor={factor}
            answers={answers}
            updateAnswer={updateAnswer}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </section>
  );
}

/* =========================================
   MAIN PAGE
   ========================================= */

export default function Page() {
  const [users, setUsers] = useState<Record<string, UserRecord>>({});

  const [loaded, setLoaded] = useState(false);

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [assessmentPhoto, setAssessmentPhoto] =
    useState<string | undefined>();

  const [extraAlphaPhotos, setExtraAlphaPhotos] = useState<string[]>([]);

  const [answers, setAnswers] = useState<Record<string, any>>({});

  /* ---------- Load browser storage ---------- */

  useEffect(() => {
    setUsers(loadUsers());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveUsers(users);
  }, [users, loaded]);

  const currentUser = currentEmail
    ? users[currentEmail]
    : undefined;

  const isAdmin = !!currentUser?.isAdmin;

  /* ---------- Load selected account ---------- */

  useEffect(() => {
    if (!currentEmail) {
      setName("");
      setProfilePhoto(undefined);
      setAssessmentPhoto(undefined);
      setExtraAlphaPhotos([]);
      setAnswers({});
      return;
    }

    const user = users[currentEmail];

    if (!user) return;

    setName(user.profile?.name || "");
    setProfilePhoto(user.profile?.profilePhoto);
    setAssessmentPhoto(user.profile?.assessmentPhoto);
    setExtraAlphaPhotos(user.profile?.extraAlphaPhotos || []);
    setAnswers(user.answers || {});
  }, [currentEmail]);

  /* ---------- Score ---------- */

  const score = useMemo(
    () => calculateAlphaScore(answers),
    [answers]
  );

  const level = levelFor(score);

  /* ---------- Authentication ---------- */

  async function handleAuth() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pwd) {
      alert("Enter an email and password.");
      return;
    }

    const passwordHash = await sha256(pwd);

    if (isLoginMode) {
      const user = users[cleanEmail];

      if (!user) {
        alert("No account found. Create one instead.");
        return;
      }

      if (user.passwordHash !== passwordHash) {
        alert("Wrong password.");
        return;
      }

      setCurrentEmail(cleanEmail);
      setPwd("");
      return;
    }

    if (users[cleanEmail]) {
      alert("That account already exists. Try logging in.");
      return;
    }

    const newUser: UserRecord = {
      passwordHash,
      createdAt: Date.now(),
      profile: {},
      answers: {},
    };

    setUsers((previous) => ({
      ...previous,
      [cleanEmail]: newUser,
    }));

    setCurrentEmail(cleanEmail);
    setPwd("");
  }

  function handleLogout() {
    setCurrentEmail(null);
    setEmail("");
    setPwd("");
    setName("");
    setProfilePhoto(undefined);
    setAssessmentPhoto(undefined);
    setExtraAlphaPhotos([]);
    setAnswers({});
  }

  /* ---------- Answers ---------- */

  function updateAnswer(id: string, value: any) {
    setAnswers((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  /* ---------- Save ---------- */

  function handleSave() {
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
            extraAlphaPhotos,
          },

          answers,

          isAdmin: existing?.isAdmin,
        },
      };
    });

    alert("Profile saved.");
  }

  /* ---------- Reset answers ---------- */

  function handleReset() {
    const confirmed = window.confirm(
      "Reset all of your Alpha Status answers? Your account will remain."
    );

    if (!confirmed) return;

    setAnswers({});
  }

  /* ---------- Photos ---------- */

  async function handleProfilePhoto(file?: File) {
    if (!file) return;

    const data = await fileToDataURL(file);
    setProfilePhoto(data);
  }

  async function handleAssessmentPhoto(file?: File) {
    if (!file) return;

    const data = await fileToDataURL(file);
    setAssessmentPhoto(data);
  }

  async function handleBonusPhotos(files: FileList | null) {
    if (!files?.length) return;

    const converted: string[] = [];

    for (const file of Array.from(files)) {
      converted.push(await fileToDataURL(file));
    }

    setExtraAlphaPhotos((previous) => [
      ...previous,
      ...converted,
    ]);
  }

  function removeBonusPhoto(index: number) {
    setExtraAlphaPhotos((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  /* ---------- CSV ---------- */

  function exportCSV() {
    const factorIds = FACTORS.map((factor) => factor.id);

    const header = [
      "email",
      "name",
      "admin",
      "created",
      "score1000",
      "level",
      ...factorIds,
    ];

    const rows: string[][] = [header];

    Object.entries(users).forEach(([userEmail, user]) => {
      const userAnswers = user.answers || {};
      const userScore = calculateAlphaScore(userAnswers);

      const values = factorIds.map((id) => {
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
        new Date(user.createdAt).toISOString(),
        String(userScore),
        levelFor(userScore).name,
        ...values,
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

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `alpha_status_${Date.now()}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  /* ---------- Activities ---------- */

  const activityFactor = FACTORS.find(
    (factor) => factor.kind === "checklist" && factor.id === "activities"
  );

  const activities =
    activityFactor?.kind === "checklist"
      ? activityFactor.items
      : [];

  const activityAnswers =
    answers.activities &&
    typeof answers.activities === "object"
      ? answers.activities
      : {};

  function toggleActivity(id: string) {
    updateAnswer("activities", {
      ...activityAnswers,
      [id]: !activityAnswers[id],
    });
  }

  /* ---------- Groups ---------- */

  const strength = getFactors([
    "max_bench",
    "max_deadlift",
    "max_squat",
  ]);

  const member = getFactors([
    "member_length",
    "member_girth",
  ]);

  const conditioning = getFactors([
    "mile_time",
    "workout_days",
  ]);

  const body = getFactors([
    "chest_size",
    "arm_size",
    "quad_size",
    "shoulder_size",
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

  /* =========================================
     PAGE
     ========================================= */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        position: "relative",
      }}
    >
      {/* BACKGROUND */}

      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/alpha-hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.28,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(2,6,23,.25), rgba(2,6,23,.92))",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div style={pageWrap}>
        {/* HEADER */}

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 950,
                margin: 0,
                letterSpacing: -1,
              }}
            >
              ALPHA STATUS
            </h1>

            <div
              style={{
                color: "#cbd5e1",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {currentEmail
                ? `Signed in as ${currentEmail}`
                : "Build your Alpha Status."}
            </div>
          </div>

          {currentEmail && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Link href="/leaderboard" style={buttonGhost}>
                Leaderboard
              </Link>

              <button
                onClick={exportCSV}
                style={buttonGhost}
              >
                Export CSV
              </button>

              <button
                onClick={handleLogout}
                style={buttonGhost}
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        {/* LOGIN */}

        {!currentEmail ? (
          <div
            style={{
              ...box,
              maxWidth: 430,
              margin: "70px auto 0",
            }}
          >
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: 24,
              }}
            >
              {isLoginMode
                ? "Enter the Den"
                : "Create Your Profile"}
            </h2>

            <div
              style={{
                color: "#94a3b8",
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              Track your stats and build your Alpha Status.
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <button
                onClick={() => setIsLoginMode(true)}
                style={
                  isLoginMode
                    ? buttonPrimary
                    : buttonGhost
                }
              >
                Login
              </button>

              <button
                onClick={() => setIsLoginMode(false)}
                style={
                  !isLoginMode
                    ? buttonPrimary
                    : buttonGhost
                }
              >
                Create Account
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <label>
                <div style={labelText}>Email</div>

                <input
                  type="email"
                  style={inputStyle}
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAuth();
                    }
                  }}
                />
              </label>

              <label>
                <div style={labelText}>Password</div>

                <input
                  type="password"
                  style={inputStyle}
                  value={pwd}
                  onChange={(e) =>
                    setPwd(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAuth();
                    }
                  }}
                />
              </label>

              <button
                onClick={handleAuth}
                style={buttonPrimary}
              >
                {isLoginMode
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </div>
          </div>
        ) : (
          /* =========================================
             LOGGED-IN APP
             ========================================= */

          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            {/* SCORE HERO */}

            <section
              style={{
                ...box,
                textAlign: "center",
                padding: "28px 18px",
              }}
            >
              <div
                style={{
                  textTransform: "uppercase",
                  letterSpacing: 3,
                  color: "#94a3b8",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                Alpha Status
              </div>

              <div
                style={{
                  fontSize: 72,
                  fontWeight: 950,
                  lineHeight: 1,
                  marginTop: 8,
                }}
              >
                {score}
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                / 1000
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: 12,
                }}
              >
                {level.name}
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: 13,
                  marginTop: 3,
                }}
              >
                {level.blurb}
              </div>
            </section>

            {/* PROFILE */}

            <section style={box}>
              <h2 style={sectionTitle}>
                Profile
              </h2>

              <div style={sectionDescription}>
                Your public Alpha Status identity.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(240px,1fr))",
                  gap: 18,
                }}
              >
                <div>
                  <div style={labelText}>
                    Display Name
                  </div>

                  <input
                    style={inputStyle}
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <div style={labelText}>
                    Profile Photo
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleProfilePhoto(
                        e.target.files?.[0]
                      )
                    }
                  />

                  {profilePhoto && (
                    <div
                      style={{
                        marginTop: 10,
                      }}
                    >
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        style={{
                          width: 110,
                          height: 110,
                          objectFit: "cover",
                          borderRadius: 12,
                          border:
                            "1px solid rgba(255,255,255,.2)",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ASSESSMENT PHOTO */}

            <section style={box}>
              <h2 style={sectionTitle}>
                Physique Assessment
              </h2>

              <div style={sectionDescription}>
                Add a non-explicit physique photo for
                your profile assessment.
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleAssessmentPhoto(
                    e.target.files?.[0]
                  )
                }
              />

              {assessmentPhoto && (
                <div style={{ marginTop: 14 }}>
                  <img
                    src={assessmentPhoto}
                    alt="Physique assessment"
                    style={{
                      width: "100%",
                      maxWidth: 340,
                      maxHeight: 420,
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />
                </div>
              )}
            </section>

            {/* BONUS PHOTOS */}

            <section style={box}>
              <h2 style={sectionTitle}>
                Bonus Alpha Photos
              </h2>

              <div style={sectionDescription}>
                Add optional fitness, outdoors,
                competition, action or lifestyle photos.
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  handleBonusPhotos(e.target.files)
                }
              />

              {extraAlphaPhotos.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill,minmax(140px,1fr))",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  {extraAlphaPhotos.map(
                    (photo, index) => (
                      <div key={index}>
                        <img
                          src={photo}
                          alt={`Bonus ${index + 1}`}
                          style={{
                            width: "100%",
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 10,
                          }}
                        />

                        <button
                          onClick={() =>
                            removeBonusPhoto(index)
                          }
                          style={{
                            ...buttonDanger,
                            width: "100%",
                            marginTop: 6,
                            padding: "7px 8px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* STRENGTH */}

            <FactorSection
              title="Strength"
              description="Enter your best one-rep max lifts."
              factors={strength}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* MEMBER */}

            <FactorSection
              title="Member Measurements"
              description="Optional numerical measurements used in your Alpha Status score."
              factors={member}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* CONDITIONING */}

            <FactorSection
              title="Conditioning"
              description="For mile time, enter a value such as 7.30 for 7 minutes 30 seconds."
              factors={conditioning}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* BODY */}

            <FactorSection
              title="Anthropometrics"
              factors={body}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* APPEARANCE */}

            <FactorSection
              title="Appearance"
              factors={appearance}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* KNOWLEDGE */}

            <FactorSection
              title="Knowledge"
              description="Rate each category from 1 to 10."
              factors={knowledge}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* ACTIVITIES */}

            <section style={box}>
              <h2 style={sectionTitle}>
                Activities
              </h2>

              <div style={sectionDescription}>
                Check the activities you've completed.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
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
                      padding: "9px 10px",
                      border:
                        "1px solid rgba(255,255,255,.08)",
                      borderRadius: 9,
                      background:
                        "rgba(15,23,42,.65)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        !!activityAnswers[
                          activity.id
                        ]
                      }
                      onChange={() =>
                        toggleActivity(
                          activity.id
                        )
                      }
                    />

                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
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

            {/* LIFE */}

            <FactorSection
              title="Life & Family"
              factors={life}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* ADMIN */}

            <FactorSection
              title="Admin-Assessed"
              description={
                isAdmin
                  ? "You are signed in as an administrator."
                  : "These ratings can only be changed by an administrator."
              }
              factors={adminFactors}
              answers={answers}
              updateAnswer={updateAnswer}
              isAdmin={isAdmin}
            />

            {/* FINAL SCORE */}

            <section
              style={{
                ...box,
                textAlign: "center",
                padding: 26,
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                Current Alpha Status
              </div>

              <div
                style={{
                  fontSize: 56,
                  fontWeight: 950,
                  marginTop: 4,
                }}
              >
                {score}
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: 20,
                  }}
                >
                  /1000
                </span>
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                {level.name}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 20,
                }}
              >
                <button
                  onClick={handleSave}
                  style={buttonPrimary}
                >
                  Save Profile
                </button>

                <Link
                  href="/leaderboard"
                  style={buttonGhost}
                >
                  View Leaderboard
                </Link>

                <button
                  onClick={handleReset}
                  style={buttonDanger}
                >
                  Reset Answers
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
