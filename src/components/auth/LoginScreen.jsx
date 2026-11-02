import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  User,
  UserCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Globe,
  X,
  ExternalLink,
  Camera,
  MapPin,
  Users,
  ShieldAlert
} from "lucide-react";
import { SECTION_1_FACULTIES } from "../../data/timetable";
import { SECTIONS, COUNSELLORS, ALL_STUDENTS } from "../../../data.js";

// Helper to strictly identify student rolls/emails
function isStudentIdentifier(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  if (s.startsWith("vu.")) return true;
  if (/\b(2[0-9]{2}[a-z0-9]{7})\b/i.test(s)) return true;
  if (/^[0-9]{2}[a-z0-9]{8}$/i.test(s) || /^[0-9]{10}$/i.test(s)) return true;
  const clean = s.split("@")[0].replace(/^vu\./, "").toUpperCase();
  return ALL_STUDENTS.some((st) => st.roll.toUpperCase() === clean || s.includes(st.roll.toLowerCase()));
}

export default function LoginScreen({ onLogin, students = [] }) {
  const [activeRole, setActiveRole] = useState("faculty"); // "faculty" | "counsellor" | "student" | "admin"
  const [username, setUsername] = useState("faculty");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [selectedSectionNum, setSelectedSectionNum] = useState(1);
  const [selectedStudentRoll, setSelectedStudentRoll] = useState("241FA04035");
  const [selectedFacultyName, setSelectedFacultyName] = useState("Mr. Gujjula Murali");
  const [cinematicAngle, setCinematicAngle] = useState(1); // 1 = Walkway, 2 = Tech Center

  // Google OAuth State
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleConfig, setGoogleConfig] = useState({ clientId: "", configured: false });

  // Fetch Google OAuth Config from backend (/api/auth/google/config)
  useEffect(() => {
    let isMounted = true;
    async function checkGoogleConfig() {
      try {
        const res = await fetch("/api/auth/google/config");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setGoogleConfig({
              clientId: data.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
              configured: Boolean(data.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID)
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          const clientEnvId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
          setGoogleConfig({
            clientId: clientEnvId,
            configured: Boolean(clientEnvId)
          });
        }
      }
    }
    checkGoogleConfig();
    return () => { isMounted = false; };
  }, []);

  // Initialize Google Identity Services if client ID is available
  useEffect(() => {
    if (!googleConfig.clientId) return;

    if (!window.google && !document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        try {
          window.google.accounts.id.initialize({
            client_id: googleConfig.clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });
        } catch (e) {}
      };
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleConfig.clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });
      } catch (e) {}
    }
  }, [googleConfig.clientId, activeRole, selectedStudentRoll, selectedFacultyName, selectedSectionNum]);

  // Handle Google Token Credential response with Strict Student Block Rule
  const handleGoogleCredentialResponse = async (response, requestedRole = null) => {
    setGoogleLoading(true);
    setError("");
    const roleToVerify = requestedRole || activeRole;

    try {
      const verifyRes = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          code: response.code,
          redirectUri: window.location.origin + window.location.pathname,
          requestedRole: roleToVerify,
          selectedStudentRoll,
          selectedFacultyName,
          selectedSectionNum
        })
      });
      const data = await verifyRes.json();
      if (data.success && data.user) {
        // Double check: if user is student and trying to access faculty/admin, block strictly
        if (data.user.role === "student" && (roleToVerify === "faculty" || roleToVerify === "counsellor" || roleToVerify === "admin")) {
          setError(`⛔ ACCESS DENIED: Student accounts (${data.user.email}) are strictly forbidden from logging into Faculty or Admin portals. Please switch to the Student Portal.`);
          return;
        }
        onLogin(data.user);
      } else {
        setError(data.error || "Google authentication failed. Please verify authorization.");
      }
    } catch (err) {
      setError(`Google Auth Error: ${err.message}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google OAuth URL callback listener
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const errorParam = urlParams.get("error");
    const errorDesc = urlParams.get("error_description");

    let hashCredential = null;
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      hashCredential = hashParams.get("id_token") || hashParams.get("credential");
    }

    if (errorParam) {
      setError(`Google Sign-In Error: ${errorDesc || errorParam}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code || hashCredential) {
      setGoogleLoading(true);
      setError("");
      window.history.replaceState({}, document.title, window.location.pathname);

      handleGoogleCredentialResponse(
        code ? { code } : { credential: hashCredential },
        activeRole
      );
    }
  }, [activeRole, selectedStudentRoll, selectedFacultyName, selectedSectionNum]);

  // Google Sign-In button click handler
  const handleGoogleSignIn = (roleHint = null) => {
    setError("");
    const role = roleHint || activeRole;

    if (googleConfig.configured && window.google?.accounts?.id) {
      setGoogleLoading(true);
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGoogleLoading(false);
            setShowGoogleModal(true);
          }
        });
      } catch (err) {
        setGoogleLoading(false);
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  // Demo Google Sign-In helper with Strict Student Prevention
  const handleGoogleDemoSelect = async (accountType, customRoll = null, customFaculty = null, customSec = null) => {
    // STRICT PREVENT RULE: If student tries to login into faculty/counsellor/admin
    const targetRoll = customRoll || selectedStudentRoll;
    if (targetRoll && isStudentIdentifier(targetRoll) && (accountType === "faculty" || accountType === "counsellor" || accountType === "admin")) {
      setError(`⛔ ACCESS DENIED: Student accounts (${targetRoll}) are strictly forbidden from logging into Faculty or Admin portals. Please switch to the Student Portal.`);
      setShowGoogleModal(false);
      return;
    }

    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google/mock-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          studentRoll: targetRoll,
          facultyName: customFaculty || selectedFacultyName,
          sectionNum: customSec || selectedSectionNum
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setShowGoogleModal(false);
        onLogin(data.user);
      } else {
        setShowGoogleModal(false);
        setError(data.error || "Access Denied: Account is not authorized.");
      }
    } catch (e) {
      setShowGoogleModal(false);
      setError(`Authentication Error: ${e.message}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setError("");
    setPassword("");
    if (role === "faculty") {
      setUsername("faculty");
    } else if (role === "counsellor") {
      setUsername("counsellor");
    } else if (role === "student") {
      setUsername(selectedStudentRoll);
    } else if (role === "admin") {
      setUsername("admin");
    }
  };

  // Handle Form Submit with Strict Student Block Condition
  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your identifier / roll number");
      return;
    }

    // STRICT STUDENT PREVENT CHECK:
    // If student attempts to log in as Faculty, Counsellor, or Admin with their roll or email
    if (activeRole === "faculty" || activeRole === "counsellor" || activeRole === "admin") {
      if (isStudentIdentifier(username)) {
        setError(`⛔ ACCESS DENIED: Student account "${username}" is strictly forbidden from logging into the Faculty or Admin portal. Please switch to the Student Portal.`);
        return;
      }
    }

    if (activeRole === "faculty") {
      onLogin({
        role: "faculty",
        facultyMode: "attendance",
        id: selectedFacultyName.replace(/\s+/g, "_").toLowerCase(),
        name: selectedFacultyName,
        phone: "+919000443503",
        section: `Section ${selectedSectionNum}`,
        sectionNum: selectedSectionNum,
        email: "faculty@vignan.ac.in",
        department: "Computer Science & Engineering"
      });
    } else if (activeRole === "counsellor") {
      const matchedCounsellor =
        COUNSELLORS.find((c) => c.name === selectedFacultyName) || COUNSELLORS[0];
      onLogin({
        role: "counsellor",
        facultyMode: "counselling",
        id: selectedFacultyName.replace(/\s+/g, "_").toLowerCase(),
        name: selectedFacultyName,
        counsellorName: selectedFacultyName,
        phone: "+919000443503",
        assignedSections: matchedCounsellor.sections,
        section: `Section ${matchedCounsellor.sections[0] || 1}`,
        sectionNum: matchedCounsellor.sections[0] || 1,
        studentCount: matchedCounsellor.studentCount,
        email: "counsellor@vignan.ac.in",
        department: "Computer Science & Engineering"
      });
    } else if (activeRole === "student") {
      const trimmedRoll = username.trim().toUpperCase();
      const student =
        students.find((s) => s.roll.toUpperCase() === trimmedRoll) ||
        ALL_STUDENTS.find((s) => s.roll.toUpperCase() === trimmedRoll) || {
          roll: trimmedRoll,
          name: "Student Candidate",
          section: `Section ${selectedSectionNum}`,
          sectionNum: selectedSectionNum,
          counsellor: selectedFacultyName
        };

      const rollLower = student.roll.toLowerCase();
      onLogin({
        role: "student",
        id: student.roll,
        roll: student.roll,
        name: student.name,
        email: `vu.${rollLower}@gmail.com`,
        section: student.section || `Section ${selectedSectionNum}`,
        sectionNum: student.sectionNum || selectedSectionNum,
        counsellor: student.counsellor || selectedFacultyName,
        room: `Room N-40${(student.sectionNum || 1) % 10 + 1}`,
        semester: "III Year - 5th Semester",
        department: "Computer Science & Engineering"
      });
    } else if (activeRole === "admin") {
      if (password && password !== "admin123" && password !== "admin") {
        setError("Invalid admin password. Default demo password is 'admin123'");
        return;
      }
      onLogin({
        role: "admin",
        id: "admin_root",
        name: "Dr. K. Ramanjaneyulu (HOD CSE)",
        designation: "Head of the Department & Dean Academics",
        email: "hod_cse@vignan.ac.in",
        department: "Computer Science & Engineering"
      });
    }
  };

  // Find student registered name for live badge
  const matchedStudentObj =
    activeRole === "student"
      ? ALL_STUDENTS.find((s) => s.roll.toUpperCase() === username.trim().toUpperCase()) ||
        ALL_STUDENTS.find((s) => s.roll === selectedStudentRoll)
      : null;

  return (
    <div className="login-page-split">
      {/* =========================================================================
          LEFT SIDE: 3D REAL CINEMATIC VIEW OF STUDENTS WALKING IN UNIVERSITY
          ========================================================================= */}
      <div className="login-cinematic-side">
        <div className="cinematic-bg-container">
          <img
            src={cinematicAngle === 1 ? "/images/campus_cinematic_walk.jpg" : "/images/campus_students_tech.jpg"}
            alt="University Campus Life 3D View"
            className="cinematic-bg-image"
          />
          <div className="cinematic-vignette" />
        </div>

        {/* Top Floating Badge */}
        <div className="cinematic-top-bar" style={{ position: "relative", zIndex: 2 }}>
          <div className="cinematic-chip">
            <span className="cinematic-pulse" />
            <span style={{ fontWeight: 700, letterSpacing: "0.5px" }}>VFSTR UNIVERSITY</span>
            <span style={{ opacity: 0.7 }}>&bull; Department of CSE</span>
          </div>
          <button
            type="button"
            className="cinematic-angle-btn"
            onClick={() => setCinematicAngle((prev) => (prev === 1 ? 2 : 1))}
            title="Switch 3D Campus Cinematic Camera Angle"
          >
            <Camera size={14} />
            <span>Angle {cinematicAngle === 1 ? "1: Walkway" : "2: Tech Center"}</span>
          </button>
        </div>

        {/* Center 3D Atmosphere Info */}
        <div className="cinematic-center-content" style={{ position: "relative", zIndex: 2 }}>
          <div className="cinematic-tag">
            <Sparkles size={14} style={{ color: "#818cf8" }} />
            <span>3D Cinematic Campus Atmosphere</span>
          </div>
          <h2 className="cinematic-title">
            Vignan's Foundation for Science, Technology & Research
          </h2>
          <p className="cinematic-description">
            Experience next-generation automated attendance tracking across 22 Computer Science & Engineering sections with instant email dispatch to all 1,511 student inboxes.
          </p>

          <div className="cinematic-stats-row">
            <div className="cinematic-stat">
              <span className="stat-num">1,511</span>
              <span className="stat-desc">Active Students</span>
            </div>
            <div className="cinematic-stat">
              <span className="stat-num">22</span>
              <span className="stat-desc">CSE Sections</span>
            </div>
            <div className="cinematic-stat">
              <span className="stat-num">53</span>
              <span className="stat-desc">Faculty Counsellors</span>
            </div>
            <div className="cinematic-stat">
              <span className="stat-num">0ms</span>
              <span className="stat-desc">Sync Latency</span>
            </div>
          </div>
        </div>

        {/* Bottom Telemetry Bar */}
        <div className="cinematic-bottom-bar" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#e4e4e7" }}>
            <MapPin size={15} style={{ color: "#ffffff" }} />
            <span>Vadlamudi Green Campus &bull; Guntur, AP</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#a1a1aa" }}>
            <ShieldCheck size={14} style={{ color: "#ffffff" }} />
            <span>RBAC 2.0 &bull; Google OAuth Verified</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: NON-SCROLLING SQUARE CARD (IMAGE 3 OBSIDIAN SLATE PALETTE)
          ========================================================================= */}
      <div className="login-card-side">
        <div className="login-square-card">
          {/* Card Header */}
          <div className="square-card-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="square-brand-badge">
                <span className="brand-dot" />
                <span className="brand-title">VFSTR &bull; CSE</span>
              </div>
              <span className="square-version-tag">Portal v2.4</span>
            </div>
            <h1 className="square-login-title">Attendance Portal</h1>
            <p className="square-login-sub">
              Sign in to access your designated role &bull; 1,511 Synced Inboxes
            </p>
          </div>

          {/* 4 Role Selector Tabs (Image 3 Pill Style) */}
          <div className="square-role-tabs">
            <button
              type="button"
              className={`square-role-tab ${activeRole === "faculty" ? "active" : ""}`}
              onClick={() => handleRoleChange("faculty")}
              title="Faculty Class Attendance Marker"
            >
              <BookOpen size={14} />
              <span>Attendance</span>
            </button>
            <button
              type="button"
              className={`square-role-tab ${activeRole === "counsellor" ? "active" : ""}`}
              onClick={() => handleRoleChange("counsellor")}
              title="Faculty Student Mentorship & Counselling"
            >
              <UserCheck size={14} />
              <span>Counsellor</span>
            </button>
            <button
              type="button"
              className={`square-role-tab ${activeRole === "student" ? "active" : ""}`}
              onClick={() => handleRoleChange("student")}
              title="Individual Student Portal"
            >
              <GraduationCap size={14} />
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`square-role-tab ${activeRole === "admin" ? "active" : ""}`}
              onClick={() => handleRoleChange("admin")}
              title="Department Administration"
            >
              <ShieldCheck size={14} />
              <span>Admin</span>
            </button>
          </div>

          {/* Security Alert Banner */}
          {error && (
            <div className="square-alert-banner" role="alert">
              <ShieldAlert size={16} className="square-alert-icon" />
              <div className="square-alert-text">{error}</div>
              <button
                type="button"
                className="square-alert-close"
                onClick={() => setError("")}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Google 1-Click Sign-In Button */}
          <div className="square-oauth-section">
            <button
              type="button"
              className="square-google-btn"
              onClick={() => handleGoogleSignIn(activeRole)}
              disabled={googleLoading}
              title={`Sign in with Google for ${activeRole}`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{googleLoading ? "Connecting..." : `Sign in with Google (${activeRole.toUpperCase()})`}</span>
            </button>
          </div>

          <div className="square-divider">
            <span>OR LOGIN WITH PORTAL CREDENTIALS</span>
          </div>

          {/* Dynamic Compact Inputs for Selected Role */}
          <form onSubmit={handleSubmit} className="square-form-body">
            {activeRole === "student" && (
              <div className="square-field-group">
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="square-field-label">Student Roll Number</label>
                    <input
                      type="text"
                      className="square-input"
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setUsername(val);
                        setSelectedStudentRoll(val);
                      }}
                      placeholder="e.g. 241FA04035 or 241FA04B57"
                      required
                    />
                  </div>
                  <div style={{ width: "120px" }}>
                    <label className="square-field-label">Section</label>
                    <select
                      className="square-select"
                      value={selectedSectionNum}
                      onChange={(e) => setSelectedSectionNum(Number(e.target.value))}
                    >
                      {SECTIONS.map((sec) => (
                        <option key={sec.num} value={sec.num}>
                          Sec {sec.num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {matchedStudentObj && (
                  <div className="square-student-match-chip">
                    <span>✓ Enrolled: <strong>{matchedStudentObj.name}</strong></span>
                    <span style={{ color: "#6366f1" }}>&bull; vu.{matchedStudentObj.roll.toLowerCase()}@gmail.com</span>
                  </div>
                )}
              </div>
            )}

            {activeRole === "faculty" && (
              <div className="square-field-group">
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="square-field-label">Faculty Member</label>
                    <select
                      className="square-select"
                      value={selectedFacultyName}
                      onChange={(e) => setSelectedFacultyName(e.target.value)}
                    >
                      {SECTION_1_FACULTIES.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name} ({f.subject})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: "120px" }}>
                    <label className="square-field-label">Class Section</label>
                    <select
                      className="square-select"
                      value={selectedSectionNum}
                      onChange={(e) => setSelectedSectionNum(Number(e.target.value))}
                    >
                      {SECTIONS.map((sec) => (
                        <option key={sec.num} value={sec.num}>
                          Sec {sec.num} ({sec.totalStudents} st.)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeRole === "counsellor" && (
              <div className="square-field-group">
                <label className="square-field-label">Select Faculty Counsellor</label>
                <select
                  className="square-select"
                  value={selectedFacultyName}
                  onChange={(e) => {
                    const fName = e.target.value;
                    setSelectedFacultyName(fName);
                    const matched = COUNSELLORS.find((c) => c.name === fName);
                    if (matched && matched.sections) {
                      setSelectedSectionNum(matched.sections[0] || 1);
                    }
                  }}
                >
                  {COUNSELLORS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} &bull; {c.studentCount} Students ({c.sections.map((s) => `Sec ${s}`).join(", ")})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeRole === "admin" && (
              <div className="square-field-group">
                <label className="square-field-label">Administrator Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="square-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Admin Password (admin123)"
                  />
                  <button
                    type="button"
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="square-submit-btn">
              <span>Sign In to {activeRole === "faculty" ? "Attendance" : activeRole === "counsellor" ? "Counselling" : activeRole === "student" ? "Student" : "Admin"} Portal</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Access Bar (Image 3 Pills) */}
          <div className="square-quick-bar">
            <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quick Demo Logins:
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
              <button
                type="button"
                className="square-demo-pill"
                onClick={() => handleGoogleDemoSelect("faculty", null, "Dr. P. Siva Prasad", 1)}
              >
                👨‍🏫 Faculty
              </button>
              <button
                type="button"
                className="square-demo-pill"
                onClick={() => handleGoogleDemoSelect("counsellor", null, "Mr. Gujjula Murali", 1)}
              >
                🤝 Counsellor
              </button>
              <button
                type="button"
                className="square-demo-pill"
                onClick={() => {
                  setSelectedSectionNum(18);
                  setSelectedStudentRoll("241FA04B57");
                  setUsername("241FA04B57");
                  handleGoogleDemoSelect("student", "241FA04B57");
                }}
              >
                🎓 Student (241FA04B57)
              </button>
              <button
                type="button"
                className="square-demo-pill"
                onClick={() => handleGoogleDemoSelect("admin")}
              >
                🛡️ Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google Account Selector Modal Fallback */}
      {showGoogleModal && (
        <div className="google-modal-backdrop" onClick={() => setShowGoogleModal(false)}>
          <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span style={{ fontWeight: 600, fontSize: "1rem", color: "#f8fafc" }}>
                  Sign in with Google
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowGoogleModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "16px" }}>
              Choose an authorized Google account for role: <strong>{activeRole.toUpperCase()}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeRole === "admin" && (
                <button
                  type="button"
                  className="google-account-item"
                  onClick={() => handleGoogleDemoSelect("admin")}
                >
                  <div className="google-avatar" style={{ background: "#dc2626", color: "#fff" }}>A</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "#f8fafc" }}>Administrator &bull; HOD CSE</div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>hod_cse@vignan.ac.in (Authorized Admin)</div>
                  </div>
                </button>
              )}

              {(activeRole === "faculty" || activeRole === "counsellor") && (
                <>
                  <button
                    type="button"
                    className="google-account-item"
                    onClick={() => handleGoogleDemoSelect("faculty", null, "Dr. P. Siva Prasad", 1)}
                  >
                    <div className="google-avatar" style={{ background: "#2563eb", color: "#fff" }}>P</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>Dr. P. Siva Prasad (Faculty Attendance)</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>psivaprasad@vignan.ac.in</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="google-account-item"
                    onClick={() => handleGoogleDemoSelect("counsellor", null, "Mr. Gujjula Murali", 1)}
                  >
                    <div className="google-avatar" style={{ background: "#059669", color: "#fff" }}>M</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>Mr. Gujjula Murali (Faculty Counsellor)</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>gmurali@vignan.ac.in</div>
                    </div>
                  </button>
                </>
              )}

              {activeRole === "student" && (
                <>
                  <button
                    type="button"
                    className="google-account-item"
                    onClick={() => {
                      setSelectedSectionNum(18);
                      setSelectedStudentRoll("241FA04B57");
                      setUsername("241FA04B57");
                      handleGoogleDemoSelect("student", "241FA04B57");
                    }}
                  >
                    <div className="google-avatar" style={{ background: "#6366f1", color: "#fff" }}>B</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>BONDILI DEVI RAGHUVEERA BAI (Sec 18)</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>vu.241fa04b57@gmail.com</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="google-account-item"
                    onClick={() => {
                      setSelectedSectionNum(1);
                      setSelectedStudentRoll("241FA04152");
                      setUsername("241FA04152");
                      handleGoogleDemoSelect("student", "241FA04152");
                    }}
                  >
                    <div className="google-avatar" style={{ background: "#0ea5e9", color: "#fff" }}>B</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>BODAPATI LASYA (Sec 1)</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>vu.241fa04152@gmail.com</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
