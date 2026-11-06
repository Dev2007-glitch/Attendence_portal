import React, { useState, useMemo } from "react";
import { X, Check, Settings, ArrowRight, ChevronLeft, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import {
  DEFAULT_GOOGLE_PRESETS,
  getGoogleClientId,
  saveGoogleClientId,
  triggerRealGoogleOAuth
} from "./GoogleAuthService";
import { ALL_STUDENTS } from "../../../data.js";
import "./GoogleAccountPickerModal.css";

// Official Google G Colored SVG Logo
export function GoogleGLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

// Google User Outline Icon for "Use another account"
export function GoogleUserIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

// Check if string is a student email / roll
function isStudentAccount(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  if (s.startsWith("vu.")) return true;
  if (/\b(2[0-9]{2}[a-z0-9]{7})\b/i.test(s)) return true;
  if (/^[0-9]{2}[a-z0-9]{8}$/i.test(s) || /^[0-9]{10}$/i.test(s)) return true;
  const clean = s.split("@")[0].replace(/^vu\./, "").toUpperCase();
  return ALL_STUDENTS.some((st) => st.roll.toUpperCase() === clean || s.includes(st.roll.toLowerCase()));
}

// Extract roll number from input or email
function extractRoll(val) {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  const match = s.match(/\b(2[0-9]{2}[a-z0-9]{7})\b/i);
  if (match) return match[1].toUpperCase();
  if (s.startsWith("vu.")) {
    const raw = s.split("@")[0].replace(/^vu\./, "").toUpperCase();
    if (raw.length >= 8) return raw;
  }
  const clean = s.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (clean.length === 10) return clean;
  return null;
}

export default function GoogleAccountPickerModal({
  isOpen,
  onClose,
  onSelectUser,
  activeRole = "student", // "faculty" | "counsellor" | "student" | "admin"
  selectedSectionNum = 1,
  selectedFacultyName = "Dr. P. Siva Prasad"
}) {
  const isStudentRole = activeRole === "student";
  const [showCustomInput, setShowCustomInput] = useState(() => isStudentRole);
  const [customStep, setCustomStep] = useState(1); // 1: Email, 2: Confirmation
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => getGoogleClientId());
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [oauthError, setOauthError] = useState("");

  // Live match detection for "Use another account"
  const candidateStudent = useMemo(() => {
    if (!customEmail) return null;
    const roll = extractRoll(customEmail);
    if (!roll) return null;
    return ALL_STUDENTS.find((s) => s.roll.toUpperCase() === roll.toUpperCase()) || null;
  }, [customEmail]);

  if (!isOpen) return null;

  // Process account selection with STRICT student prevention
  const handleSelectAccount = (account) => {
    setOauthError("");
    const email = account.email.toLowerCase().trim();
    const isStudent = isStudentAccount(email) || Boolean(account.roll);

    // =======================================================================
    // STRICT SECURITY RULE: If a student tries to access Faculty or Admin, BLOCK!
    // =======================================================================
    if (isStudent && (activeRole === "faculty" || activeRole === "counsellor" || activeRole === "admin")) {
      setOauthError(
        `⛔ ACCESS DENIED: Student account (${email}) is strictly forbidden from logging into Faculty or Admin portals. Please switch to the Student Portal.`
      );
      return;
    }

    // Student Login
    if (isStudent || activeRole === "student") {
      let roll = account.roll || extractRoll(email) || "241FA04B57";
      let studentObj = ALL_STUDENTS.find((s) => s.roll.toUpperCase() === roll.toUpperCase());

      if (!studentObj && ALL_STUDENTS.length > 0) {
        studentObj = ALL_STUDENTS[0];
      }

      const rollLower = studentObj ? studentObj.roll.toLowerCase() : roll.toLowerCase();
      const userPayload = {
        role: "student",
        id: studentObj ? studentObj.roll : roll,
        roll: studentObj ? studentObj.roll : roll,
        name: studentObj ? studentObj.name : account.name || "Enrolled Student",
        email: `vu.${rollLower}@gmail.com`,
        googleEmail: email,
        avatar: account.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentObj ? studentObj.name : account.name)}&backgroundColor=000000&textColor=ffffff`,
        section: studentObj ? studentObj.section : `Section ${selectedSectionNum}`,
        sectionNum: studentObj ? studentObj.sectionNum : selectedSectionNum,
        counsellor: studentObj ? studentObj.counsellor : "Faculty Counsellor",
        authProvider: "google"
      };

      onSelectUser(userPayload);
      onClose();
      return;
    }

    // Admin Login
    if (activeRole === "admin" || email.includes("admin") || email.includes("hod")) {
      const userPayload = {
        role: "admin",
        id: `admin_${email.replace(/[^a-z0-9]/gi, "_")}`,
        name: account.name || "VFSTR University Administrator",
        email: email,
        avatar: account.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name)}&backgroundColor=000000&textColor=ffffff`,
        designation: "Head of the Department / Academic Administrator",
        department: "Computer Science & Engineering",
        isAdmin: true,
        authProvider: "google"
      };
      onSelectUser(userPayload);
      onClose();
      return;
    }

    // Faculty / Counsellor Login
    const isCounsellor = activeRole === "counsellor";
    const userPayload = {
      role: isCounsellor ? "counsellor" : "faculty",
      facultyMode: isCounsellor ? "counselling" : "attendance",
      id: `faculty_${email.replace(/[^a-z0-9]/gi, "_")}`,
      name: selectedFacultyName || account.name || "Faculty Member",
      email: email,
      avatar: account.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name)}&backgroundColor=000000&textColor=ffffff`,
      phone: "+919000443503",
      assignedSections: [selectedSectionNum],
      section: `Section ${selectedSectionNum}`,
      sectionNum: selectedSectionNum,
      studentCount: 72,
      department: "Computer Science & Engineering",
      authProvider: "google"
    };
    onSelectUser(userPayload);
    onClose();
  };

  // Handle "Use another account" submission (e.g. any vu.<roll>@gmail.com among all 1,511 students)
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;

    const email = customEmail.trim().toLowerCase();
    const isStudent = isStudentAccount(email);

    // Strict prevent rule
    if (isStudent && (activeRole === "faculty" || activeRole === "counsellor" || activeRole === "admin")) {
      setOauthError(
        `⛔ ACCESS DENIED: Student account (${email}) is strictly forbidden from logging into Faculty or Admin portals. Please switch to the Student Portal.`
      );
      return;
    }

    if (customStep === 1) {
      if (candidateStudent) {
        setCustomName(candidateStudent.name);
      } else {
        const defaultName = email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        setCustomName(defaultName);
      }
      setCustomStep(2);
      return;
    }

    const finalAccount = {
      name: customName.trim() || (candidateStudent ? candidateStudent.name : email.split("@")[0]),
      email: email.startsWith("vu.") || email.includes("@") ? email : `vu.${email}@gmail.com`,
      roll: candidateStudent ? candidateStudent.roll : extractRoll(email),
      picture: null
    };

    handleSelectAccount(finalAccount);
  };

  // Real Google Cloud OAuth trigger
  const handleLaunchLiveGoogleOAuth = () => {
    setOauthError("");
    const clientId = clientIdInput.trim() || getGoogleClientId();
    if (!clientId) {
      setOauthError("Please enter a Google Cloud Client ID to trigger native Google popup.");
      setShowSettings(true);
      return;
    }

    const started = triggerRealGoogleOAuth(
      clientId,
      (profile) => {
        handleSelectAccount(profile);
      },
      (err) => {
        setOauthError(typeof err === "string" ? err : "Google popup was blocked or closed.");
      }
    );

    if (!started) {
      setOauthError("Google Identity Services script is loading. Select an authorized account below.");
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveGoogleClientId(clientIdInput);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2400);
  };

  return (
    <div className="google-oauth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="google-oauth-dark-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google OAuth Top Header with G logo and close button */}
        <div className="google-oauth-bar">
          <div className="google-oauth-logo-group">
            <GoogleGLogo size={22} />
            <span className="google-oauth-title-text">Google</span>
          </div>
          <button className="google-oauth-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {!showCustomInput && !isStudentRole ? (
          <>
            {/* Header matching authentic Google Account Chooser */}
            <div className="google-oauth-heading-box">
              <h1 className="google-oauth-main-title">Choose an account</h1>
              <p className="google-oauth-app-subtitle">
                to continue to{" "}
                <span className="google-oauth-app-name">Attendance Portal</span>
              </p>
            </div>

            {/* Target Role Context Banner */}
            <div className="google-oauth-role-strip">
              <span>Signing in for Portal:</span>
              <strong>{activeRole.toUpperCase()}</strong>
            </div>

            {/* Error / Strict Block Notice */}
            {oauthError && (
              <div className="google-oauth-notice-bar">
                <span>{oauthError}</span>
              </div>
            )}

            {/* List of Real Accounts matching user's screenshot */}
            <div className="google-oauth-account-list">
              {DEFAULT_GOOGLE_PRESETS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="google-oauth-account-row"
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className="google-oauth-avatar-wrap">
                    {account.picture ? (
                      <img
                        src={account.picture}
                        alt={account.name}
                        className="google-oauth-avatar-photo"
                      />
                    ) : (
                      <div
                        className="google-oauth-avatar-initials"
                        style={{ backgroundColor: account.bg || "#5d3f34" }}
                      >
                        {account.initials || account.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="google-oauth-account-info">
                    <span className="google-oauth-account-name">{account.name}</span>
                    <span className="google-oauth-account-email">{account.email}</span>
                  </div>
                  {account.signedOut && (
                    <span className="google-oauth-signed-out">Signed out</span>
                  )}
                </button>
              ))}

              <div className="google-oauth-divider" />

              {/* "Use another account" Row matching Screenshot */}
              <button
                type="button"
                className="google-oauth-account-row google-oauth-another-row"
                onClick={() => {
                  setShowCustomInput(true);
                  setCustomStep(1);
                  setOauthError("");
                }}
              >
                <div className="google-oauth-avatar-wrap">
                  <div className="google-oauth-avatar-another">
                    <GoogleUserIcon size={20} />
                  </div>
                </div>
                <div className="google-oauth-account-info">
                  <span className="google-oauth-another-text">Use another account</span>
                </div>
              </button>
            </div>

            {/* Privacy & Terms matching Screenshot */}
            <div className="google-oauth-disclaimer">
              <span>
                Before using this app, you can review Attendance Portal's{" "}
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="google-link">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="#terms" onClick={(e) => e.preventDefault()} className="google-link">
                  Terms of Service
                </a>.
              </span>
            </div>
          </>
        ) : (
          /* "Use another account" - Google Dark Theme Sign In Form with Live 1,511 Student Detection */
          <div className="google-oauth-another-screen">
            <div className="google-oauth-heading-box">
              <h1 className="google-oauth-main-title">
                {customStep === 1 ? "Sign in" : "Welcome"}
              </h1>
              <p className="google-oauth-app-subtitle">
                {customStep === 1
                  ? "with your Google Account or VU Student Email (vu.<roll>@gmail.com)"
                  : customEmail}
              </p>
            </div>

            {oauthError && (
              <div className="google-oauth-notice-bar">
                <span>{oauthError}</span>
              </div>
            )}

            <form onSubmit={handleCustomSubmit} className="google-oauth-custom-form">
              {customStep === 1 ? (
                <div className="google-dark-input-wrap">
                  <input
                    type="text"
                    className="google-dark-input"
                    placeholder="Email (e.g. vu.241fa04b57@gmail.com or 241FA04035)"
                    value={customEmail}
                    onChange={(e) => {
                      setCustomEmail(e.target.value);
                      setOauthError("");
                    }}
                    required
                    autoFocus
                  />

                  {candidateStudent && (
                    <div className="google-student-match-badge">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <UserCheck size={14} color="#81c995" />
                        <strong>✓ Registered Student: {candidateStudent.name}</strong>
                      </div>
                      <div style={{ fontSize: "11px", color: "#c4c7c5" }}>
                        Roll: {candidateStudent.roll} &bull; {candidateStudent.section} &bull; Counsellor: {candidateStudent.counsellor}
                      </div>
                    </div>
                  )}

                  <div className="google-dark-input-help">
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      Strict Student Isolation: Enter your university roll or vu.&lt;roll&gt;@gmail.com.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="google-dark-input-wrap">
                  <input
                    type="text"
                    className="google-dark-input"
                    placeholder="Your Full Name (e.g. BONDILI DEVI RAGHUVEERA BAI)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="google-dark-field-note">
                    Official attendance records for all 1,511 enrolled students are linked to this email.
                  </p>
                </div>
              )}

              <div className="google-oauth-form-footer">
                <button
                  type="button"
                  className="google-oauth-back-btn"
                  onClick={() => {
                    if (customStep === 2) setCustomStep(1);
                    else if (!isStudentRole) setShowCustomInput(false);
                    else onClose();
                    setOauthError("");
                  }}
                >
                  <ChevronLeft size={16} /> {customStep === 2 ? "Back" : isStudentRole ? "Close" : "Back"}
                </button>

                <button type="submit" className="google-oauth-next-btn">
                  <span>{customStep === 1 ? "Next" : "Sign in"}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Google Cloud OAuth Drawer */}
        <div className="google-oauth-settings-panel">
          <div className="google-oauth-settings-header">
            <button
              type="button"
              className="google-oauth-settings-toggle"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={13} />
              <span>Connect Live Google Cloud Client ID (OAuth 2.0)</span>
            </button>
            <button
              type="button"
              className="google-oauth-live-popup-btn"
              onClick={handleLaunchLiveGoogleOAuth}
              title="Launch native Google popup window"
            >
              Launch Live Popup 🚀
            </button>
          </div>

          {showSettings && (
            <div className="google-oauth-settings-body">
              <p className="google-oauth-settings-desc">
                If you have an official Google Cloud OAuth Client ID, paste it below to enable Google's native popup:
              </p>
              <form onSubmit={handleSaveSettings} className="google-oauth-settings-form">
                <input
                  type="text"
                  placeholder="e.g. 703403828116-xxxxxx.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="google-oauth-settings-input"
                />
                <button type="submit" className="google-oauth-settings-save">
                  {settingsSaved ? (
                    <>
                      <Check size={14} /> Saved
                    </>
                  ) : (
                    "Save Client ID"
                  )}
                </button>
              </form>
              <div className="google-oauth-settings-tip">
                Tip: In Google Cloud Console, add under <strong>Authorized JavaScript origins</strong>:
                <div style={{ marginTop: "4px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span>Local: <code>{window.location.origin}</code></span>
                  <span>Deployed: <code>https://attendance-portal-pink-one.vercel.app</code></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
