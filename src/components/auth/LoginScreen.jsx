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
  ExternalLink
} from "lucide-react";
import { SECTION_1_FACULTIES } from "../../data/timetable";
import { SECTIONS, COUNSELLORS, ALL_STUDENTS } from "../../../data.js";

export default function LoginScreen({ onLogin, students = [] }) {
  const [activeRole, setActiveRole] = useState("faculty"); // "faculty" | "counsellor" | "student" | "admin"
  const [username, setUsername] = useState("faculty");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [selectedSectionNum, setSelectedSectionNum] = useState(1);
  const [selectedStudentRoll, setSelectedStudentRoll] = useState("241FA04035");
  const [selectedFacultyName, setSelectedFacultyName] = useState("Mr. Gujjula Murali");

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
        // Fallback to client-side env
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

    // Load Google Identity Services script if not already loaded
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
  }, [googleConfig.clientId]);

  // Handle Google Token Credential response from GIS or OAuth Callback
  const handleGoogleCredentialResponse = async (response, requestedRole = null) => {
    setGoogleLoading(true);
    setError("");
    try {
      const verifyRes = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          code: response.code,
          redirectUri: window.location.origin + window.location.pathname,
          requestedRole: requestedRole || activeRole,
          selectedStudentRoll,
          selectedFacultyName,
          selectedSectionNum
        })
      });
      const data = await verifyRes.json();
      if (data.success && data.user) {
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

  // Google OAuth URL callback listener (handles ?code=..., ?credential=..., #id_token=..., ?error=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const errorParam = urlParams.get("error");
    const errorDesc = urlParams.get("error_description");

    // Check hash for ID token
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
      // Show Google account modal
      setShowGoogleModal(true);
    }
  };

  // Quick Demo Google Sign-In helper (supports admin, faculty, counsellor, student, and unauthorized rejection test)
  const handleGoogleDemoSelect = async (accountType, customRoll = null, customFaculty = null, customSec = null) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google/mock-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          studentRoll: customRoll || selectedStudentRoll,
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

  const handleQuickStudentSelect = (e) => {
    const roll = e.target.value;
    setSelectedStudentRoll(roll);
    setUsername(roll);
  };

  const handleQuickFacultySelect = (e) => {
    const fName = e.target.value;
    setSelectedFacultyName(fName);
    const matchedCounsellor = COUNSELLORS.find((c) => c.name === fName);
    if (matchedCounsellor && matchedCounsellor.sections && matchedCounsellor.sections.length > 0) {
      setSelectedSectionNum(matchedCounsellor.sections[0]);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your identifier / roll number");
      return;
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
        name: student.name, // Exact registered name e.g. BONDILI DEVI RAGHUVEERA BAI / BODAPATI LASYA
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

  // Quick Demo Login helper
  const handleDemoLogin = (role) => {
    setError("");
    if (role === "faculty") {
      const faculty = SECTION_1_FACULTIES[0];
      onLogin({
        role: "faculty",
        facultyMode: "attendance",
        id: faculty.id,
        name: faculty.name,
        phone: faculty.phone,
        section: "Section 1",
        sectionNum: 1,
        email: "faculty.cse@vignan.ac.in",
        department: "Computer Science & Engineering"
      });
    } else if (role === "counsellor") {
      const counsellor = COUNSELLORS.find((c) => c.name.includes("Murali")) || COUNSELLORS[0];
      onLogin({
        role: "counsellor",
        facultyMode: "counselling",
        id: counsellor.name.replace(/\s+/g, "_").toLowerCase(),
        name: counsellor.name,
        counsellorName: counsellor.name,
        assignedSections: counsellor.sections,
        section: `Section ${counsellor.sections[0] || 1}`,
        sectionNum: counsellor.sections[0] || 1,
        studentCount: counsellor.studentCount,
        email: "counsellor.cse@vignan.ac.in",
        department: "Computer Science & Engineering"
      });
    } else if (role === "student") {
      const targetRoll = selectedStudentRoll || "241FA04B57";
      const student =
        ALL_STUDENTS.find((s) => s.roll === targetRoll) ||
        ALL_STUDENTS.find((s) => s.roll === "241FA04B57") ||
        students[0];
      const rollLower = student.roll.toLowerCase();
      onLogin({
        role: "student",
        id: student.roll,
        roll: student.roll,
        name: student.name,
        email: `vu.${rollLower}@gmail.com`,
        section: student.section,
        sectionNum: student.sectionNum,
        counsellor: student.counsellor,
        semester: "III Year - 5th Semester",
        department: "Computer Science & Engineering"
      });
    } else if (role === "admin") {
      onLogin({
        role: "admin",
        id: "admin_root",
        name: "Administrator (HOD CSE)",
        designation: "Academic Dean & Head of Department",
        email: "admin@vignan.ac.in",
        department: "Computer Science & Engineering"
      });
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-background-decorations">
        <div className="decor-blob decor-blob-1" />
        <div className="decor-blob decor-blob-2" />
        <div className="decor-blob decor-blob-3" />
      </div>

      <div className="login-card-wrapper">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-logo-badge">
            <span className="login-logo-text">VFSTR</span>
            <span className="login-logo-sub">CSE</span>
          </div>
          <h1 className="login-title">Attendance Portal</h1>
          <p className="login-subtitle">
            Vignan's Foundation for Science, Technology & Research &bull; CSE Department &bull; 22 Sections (1,511 Students)
          </p>
        </div>

        {/* Highlight 2 Faculty Logins Indicator Tag */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div className="faculty-login-mode-tag">
            <Sparkles size={13} style={{ color: "#6366f1" }} />
            <span>2 Faculty Modes: Class Attendance &bull; Student Counselling</span>
          </div>
        </div>

        {/* Role Selector Tabs (2 Dedicated Faculty Logins + Student + Admin) */}
        <div className="role-tabs-container">
          <button
            type="button"
            className={`role-tab-btn ${activeRole === "faculty" ? "active" : ""}`}
            onClick={() => handleRoleChange("faculty")}
            id="roleTabFaculty"
            title="Faculty Class Attendance Marker"
          >
            <BookOpen className="role-icon" size={17} />
            <span className="role-tab-title">Faculty: Attendance</span>
            <span className="role-tab-desc">Mark Classes</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn ${activeRole === "counsellor" ? "active" : ""}`}
            onClick={() => handleRoleChange("counsellor")}
            id="roleTabCounsellor"
            title="Faculty Student Mentorship & Counselling"
          >
            <UserCheck className="role-icon" size={17} />
            <span className="role-tab-title">Faculty: Counsellor</span>
            <span className="role-tab-desc">Allotted Students</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn ${activeRole === "student" ? "active" : ""}`}
            onClick={() => handleRoleChange("student")}
            id="roleTabStudent"
            title="Individual Student Portal"
          >
            <GraduationCap className="role-icon" size={17} />
            <span className="role-tab-title">Student Portal</span>
            <span className="role-tab-desc">My Records</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn ${activeRole === "admin" ? "active" : ""}`}
            onClick={() => handleRoleChange("admin")}
            id="roleTabAdmin"
            title="Department Administration"
          >
            <ShieldCheck className="role-icon" size={17} />
            <span className="role-tab-title">Admin Portal</span>
            <span className="role-tab-desc">HOD Audit</span>
          </button>
        </div>

        {/* Role Description Banner */}
        <div className="role-banner">
          {activeRole === "faculty" && (
            <p>
              👨‍🏫 <strong>Faculty Class Attendance:</strong> Take & mark period attendance for Sections 1 to 22, sync timetable, and submit attendance logs.
            </p>
          )}
          {activeRole === "counsellor" && (
            <p>
              🤝 <strong>Faculty Student Counselling:</strong> Dedicated mentorship portal for your allotted students, monitor attendance deficits (&lt;75%), log counselling remarks & send WhatsApp parent alerts.
            </p>
          )}
          {activeRole === "student" && (
            <p>
              🎓 <strong>Student Portal:</strong> Check individual attendance %, 75% target calculator, subject-wise breakdown & timetable.
            </p>
          )}
          {activeRole === "admin" && (
            <p>
              🛡️ <strong>Admin Portal:</strong> Overall analytics, shortage defaulters list across 22 sections, manage student roster & session audit.
            </p>
          )}
        </div>

        {/* Enhanced Error / Security Alert */}
        {error && (
          <div className="login-error-alert" role="alert">
            <div className="login-error-content">
              <AlertCircle size={20} className="error-icon" style={{ flexShrink: 0, color: "#dc2626" }} />
              <div className="error-text-container">
                <span className="error-title">Authentication & Access Alert</span>
                <span className="error-message">{error}</span>
              </div>
            </div>
            <button
              type="button"
              className="error-dismiss-btn"
              onClick={() => setError("")}
              title="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Dedicated Google OAuth Access Point for Admin */}
          {activeRole === "admin" && (
            <div className="role-oauth-box admin-oauth-box">
              <div className="role-oauth-header">
                <div className="role-oauth-badge admin-badge">
                  <ShieldCheck size={14} />
                  <span>High-Priority Administrator Login</span>
                </div>
                <span className="role-oauth-secure-tag">RBAC Verified</span>
              </div>
              <p className="role-oauth-sub">
                Protected administrative access. Sign in with an authorized Google account (verified against <code>ADMIN_EMAILS</code>).
              </p>
              <button
                type="button"
                className="google-role-btn admin-theme"
                onClick={() => handleGoogleSignIn("admin")}
                disabled={googleLoading}
                id="googleAdminRoleSignInBtn"
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? "Verifying Administrator Credentials..." : "Sign in as Administrator with Google"}</span>
              </button>
              <div className="role-oauth-divider">
                <span>OR SIGN IN WITH ADMIN CREDENTIALS</span>
              </div>
            </div>
          )}

          {/* Dedicated Google OAuth Access Point for Faculty & Counsellor */}
          {(activeRole === "faculty" || activeRole === "counsellor") && (
            <div className="role-oauth-box faculty-oauth-box">
              <div className="role-oauth-header">
                <div className="role-oauth-badge faculty-badge">
                  <BookOpen size={14} />
                  <span>Authorized Faculty Google Sign-In</span>
                </div>
                <span className="role-oauth-secure-tag">Faculty Portal</span>
              </div>
              <p className="role-oauth-sub">
                Mark class attendance, manage section timetables, and record counselling notes with your institutional Google account.
              </p>
              <button
                type="button"
                className="google-role-btn faculty-theme"
                onClick={() => handleGoogleSignIn(activeRole)}
                disabled={googleLoading}
                id="googleFacultyRoleSignInBtn"
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? "Connecting to Faculty Portal..." : `Sign in as ${activeRole === "faculty" ? "Faculty" : "Counsellor"} with Google`}</span>
              </button>
              <div className="role-oauth-divider">
                <span>OR SELECT SECTION & SIGN IN MANUALLY</span>
              </div>
            </div>
          )}

          {/* Dedicated Google OAuth Access Point for Student */}
          {activeRole === "student" && (
            <div className="role-oauth-box student-oauth-box">
              <div className="role-oauth-header">
                <div className="role-oauth-badge student-badge">
                  <GraduationCap size={14} />
                  <span>Official Student Google Sign-In</span>
                </div>
                <span className="role-oauth-secure-tag">vu.&lt;roll&gt;@gmail.com</span>
              </div>
              <p className="role-oauth-sub">
                Sign in with your registered student Gmail account. Your enrolled profile, section records, and academic calendar will be authenticated automatically.
              </p>
              <button
                type="button"
                className="google-role-btn student-theme"
                onClick={() => handleGoogleSignIn("student")}
                disabled={googleLoading}
                id="googleStudentRoleSignInBtn"
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? "Connecting to Student Portal..." : `Sign in as Student with Google (${selectedStudentRoll})`}</span>
              </button>
              <div className="role-oauth-divider">
                <span>OR SELECT REGISTER NUMBER & SIGN IN MANUALLY</span>
              </div>
            </div>
          )}

          {/* Quick Picker for Student role */}
          {activeRole === "student" && (
            <>
              {/* Quick Preset Selector Buttons */}
              <div style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  🎯 Quick Student Selectors:
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    style={{ fontSize: "11px", padding: "4px 10px", borderColor: "#6366f1", color: "#6366f1" }}
                    onClick={() => {
                      setSelectedSectionNum(18);
                      setSelectedStudentRoll("241FA04B57");
                      setUsername("241FA04B57");
                    }}
                  >
                    ⭐ 241FA04B57 &bull; BONDILI DEVI RAGHUVEERA BAI (Sec 18)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    style={{ fontSize: "11px", padding: "4px 10px", borderColor: "#0ea5e9", color: "#0ea5e9" }}
                    onClick={() => {
                      setSelectedSectionNum(1);
                      setSelectedStudentRoll("241FA04152");
                      setUsername("241FA04152");
                    }}
                  >
                    ⭐ 241FA04152 &bull; BODAPATI LASYA (Sec 1)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="studentSecFilterSelect">
                  Filter by Section (22 Sections Available)
                </label>
                <select
                  id="studentSecFilterSelect"
                  className="login-select"
                  value={selectedSectionNum}
                  onChange={(e) => {
                    const sec = Number(e.target.value);
                    setSelectedSectionNum(sec);
                    const secStudents = (students.length > 0 ? students : ALL_STUDENTS).filter((s) => s.sectionNum === sec);
                    if (secStudents.length > 0) {
                      setSelectedStudentRoll(secStudents[0].roll);
                      setUsername(secStudents[0].roll);
                    }
                  }}
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec.sectionNum} value={sec.sectionNum}>
                      {sec.section} &bull; {sec.studentCount} Students ({sec.room})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="studentPickerSelect">
                  Quick Select Student from Section {selectedSectionNum}
                </label>
                <select
                  id="studentPickerSelect"
                  className="login-select"
                  value={selectedStudentRoll}
                  onChange={handleQuickStudentSelect}
                >
                  {(students.length > 0 ? students : ALL_STUDENTS)
                    .filter((s) => s.sectionNum === selectedSectionNum)
                    .map((s) => (
                      <option key={s.roll} value={s.roll}>
                        {s.roll} - {s.name} ({s.counsellor ? s.counsellor : "Counsellor"})
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          {/* Quick Picker for Faculty Attendance role */}
          {activeRole === "faculty" && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="facultySecSelect">
                  Assigned Teaching Section (1 to 22)
                </label>
                <select
                  id="facultySecSelect"
                  className="login-select"
                  value={selectedSectionNum}
                  onChange={(e) => setSelectedSectionNum(Number(e.target.value))}
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec.sectionNum} value={sec.sectionNum}>
                      {sec.section} &bull; {sec.studentCount} Students &bull; {sec.room}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="facultyPickerSelect">
                  Designated Class Faculty Member
                </label>
                <select
                  id="facultyPickerSelect"
                  className="login-select"
                  value={selectedFacultyName}
                  onChange={handleQuickFacultySelect}
                >
                  {COUNSELLORS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} (Sec {c.sections.join(", ")} &bull; {c.studentCount} Mentees)
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Quick Picker for Faculty Counselling role */}
          {activeRole === "counsellor" && (
            <div className="form-group">
              <label className="form-label" htmlFor="counsellorPickerSelect">
                Select Your Name (53 Official Counsellors & Mentors)
              </label>
              <select
                id="counsellorPickerSelect"
                className="login-select"
                value={selectedFacultyName}
                onChange={handleQuickFacultySelect}
              >
                {COUNSELLORS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.studentCount} Allotted Mentees &bull; Sec {c.sections.join(", ")})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Primary ID Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="loginUsernameInput">
              {activeRole === "student"
                ? "Student Roll Number"
                : activeRole === "counsellor"
                ? "Counsellor ID / Name"
                : activeRole === "faculty"
                ? "Faculty Username / ID"
                : "Admin Username"}
            </label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                id="loginUsernameInput"
                type="text"
                className="login-input"
                placeholder={
                  activeRole === "student"
                    ? "e.g., 241FA04035"
                    : activeRole === "counsellor"
                    ? "counsellor"
                    : activeRole === "faculty"
                    ? "faculty"
                    : "admin"
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <div className="label-with-hint">
              <label className="form-label" htmlFor="loginPasswordInput">
                Password
              </label>
              <span className="password-hint">
                Demo: {activeRole === "faculty" ? "faculty123" : activeRole === "counsellor" ? "counsellor123" : activeRole === "student" ? "student123" : "admin123"}
              </span>
            </div>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                id="loginPasswordInput"
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" id="loginSubmitBtn">
            <span>
              {activeRole === "faculty"
                ? "Enter Faculty Attendance Portal"
                : activeRole === "counsellor"
                ? "Enter Faculty Counselling Portal"
                : activeRole === "student"
                ? "Enter Student Dashboard"
                : "Enter Admin Dashboard"}
            </span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Google OAuth 2.0 Sign In Button */}
        <div className="login-divider">
          <span>OR SIGN IN WITH GOOGLE</span>
        </div>

        <button
          type="button"
          className="google-signin-btn"
          id="googleSignInBtn"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          title="Sign in with your official Google / Vignan account"
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{googleLoading ? "Connecting to Google..." : "Sign in with Google"}</span>
        </button>

        <div className="google-oauth-hint-badge">
          <ShieldCheck size={13} style={{ color: "#16a34a" }} />
          <span>Configured with <code>GOOGLE_CLIENT_ID</code> &bull; <code>GOOGLE_CLIENT_SECRET</code></span>
        </div>

        {/* Instant One-Click Demo Access Bar */}
        <div className="demo-shortcuts-section">
          <div className="demo-shortcuts-title">
            <Sparkles size={14} />
            <span>Instant One-Click Demo Sign-in:</span>
          </div>
          <div className="demo-badges-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
            <button
              type="button"
              className="demo-badge-btn faculty"
              onClick={() => handleDemoLogin("faculty")}
              id="demoFacultyBtn"
              title="Demo Login: Faculty Class Attendance Marker"
            >
              <BookOpen size={14} />
              <span>Faculty (Attendance)</span>
            </button>
            <button
              type="button"
              className="demo-badge-btn"
              style={{ background: "#ede9fe", color: "#6d28d9", border: "1px solid #ddd6fe" }}
              onClick={() => handleDemoLogin("counsellor")}
              id="demoCounsellorBtn"
              title="Demo Login: Faculty Counsellor Mentorship"
            >
              <UserCheck size={14} />
              <span>Faculty (Counselling)</span>
            </button>
            <button
              type="button"
              className="demo-badge-btn student"
              onClick={() => handleDemoLogin("student")}
              id="demoStudentBtn"
            >
              <GraduationCap size={14} />
              <span>Student</span>
            </button>
            <button
              type="button"
              className="demo-badge-btn admin"
              onClick={() => handleDemoLogin("admin")}
              id="demoAdminBtn"
            >
              <ShieldCheck size={14} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="login-footer">
          <span>Protected Academic Attendance System &bull; Version 2.0</span>
        </div>
      </div>

      {/* Google OAuth Modal Dialog */}
      {showGoogleModal && (
        <div className="modal-overlay" onClick={() => setShowGoogleModal(false)}>
          <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <div className="google-modal-title">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google OAuth 2.0 Sign-In</span>
              </div>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => setShowGoogleModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="google-modal-desc">
              {googleConfig.configured ? (
                <>Google Identity Services is active with Client ID <code>{googleConfig.clientId.slice(0, 15)}...</code>. Select your institutional account to authenticate.</>
              ) : (
                <>Connected to backend OAuth endpoints. Select a Google account role below or configure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in your <code>.env</code> file for live Google Cloud Console credentials.</>
              )}
            </p>

            <div className="google-account-options-grid">
              {/* Administrator High-Priority Login */}
              <button
                type="button"
                className="google-account-option-btn admin-highlight-card"
                onClick={() => handleGoogleDemoSelect("admin")}
                title="Sign in with authorized Admin Google Account (ADMIN_EMAILS verified)"
              >
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80"
                  alt="Admin"
                  className="google-account-avatar"
                />
                <div className="google-account-info">
                  <span className="google-account-name">Dr. K. Ramanjaneyulu (HOD CSE &bull; Admin)</span>
                  <span className="google-account-email">hod_cse@vignan.ac.in &bull; Verified via ADMIN_EMAILS</span>
                </div>
                <div className="google-role-badge admin-badge-tag">ADMIN (HOD)</div>
              </button>

              {/* Faculty Class Attendance Login */}
              <button
                type="button"
                className="google-account-option-btn faculty-highlight-card"
                onClick={() => handleGoogleDemoSelect("faculty")}
                title="Sign in with verified Faculty Google Account"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                  alt="Faculty"
                  className="google-account-avatar"
                />
                <div className="google-account-info">
                  <span className="google-account-name">Dr. P. Siva Prasad (Faculty Attendance Marker)</span>
                  <span className="google-account-email">psivaprasad@vignan.ac.in &bull; Faculty Portal</span>
                </div>
                <div className="google-role-badge faculty-badge-tag">FACULTY</div>
              </button>

              {/* Faculty Counsellor Mentorship Login */}
              <button
                type="button"
                className="google-account-option-btn"
                onClick={() => handleGoogleDemoSelect("counsellor")}
                title="Sign in with verified Faculty Counsellor Google Account"
              >
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                  alt="Counsellor"
                  className="google-account-avatar"
                />
                <div className="google-account-info">
                  <span className="google-account-name">Mr. Gujjula Murali (Faculty Counsellor)</span>
                  <span className="google-account-email">gmurali@vignan.ac.in &bull; 28 Mentees</span>
                </div>
                <div className="google-role-badge counsellor-badge-tag">MENTOR</div>
              </button>

              {/* Enrolled Student: BONDILI DEVI RAGHUVEERA BAI (241FA04B57) */}
              <button
                type="button"
                className="google-account-option-btn"
                style={{ borderLeft: "4px solid #6366f1" }}
                onClick={() => handleGoogleDemoSelect("student", "241FA04B57", null, 18)}
                title="Sign in with BONDILI DEVI RAGHUVEERA BAI (241FA04B57)"
              >
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80"
                  alt="BONDILI DEVI"
                  className="google-account-avatar"
                />
                <div className="google-account-info">
                  <span className="google-account-name">BONDILI DEVI RAGHUVEERA BAI (241FA04B57)</span>
                  <span className="google-account-email">vu.241fa04b57@gmail.com &bull; Section 18 &bull; Counsellor: Mr. Kudupudi Raj Kiran</span>
                </div>
                <div className="google-role-badge student-badge-tag">SEC 18</div>
              </button>

              {/* Enrolled Student: BODAPATI LASYA (241FA04152) */}
              <button
                type="button"
                className="google-account-option-btn"
                style={{ borderLeft: "4px solid #0ea5e9" }}
                onClick={() => handleGoogleDemoSelect("student", "241FA04152", null, 1)}
                title="Sign in with BODAPATI LASYA (241FA04152)"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                  alt="BODAPATI LASYA"
                  className="google-account-avatar"
                />
                <div className="google-account-info">
                  <span className="google-account-name">BODAPATI LASYA (241FA04152)</span>
                  <span className="google-account-email">vu.241fa04152@gmail.com &bull; Section 1 &bull; Counsellor: Mr. Gujjula Murali</span>
                </div>
                <div className="google-role-badge student-badge-tag">SEC 1</div>
              </button>

              {/* Currently Selected Student in Form */}
              {selectedStudentRoll !== "241FA04B57" && selectedStudentRoll !== "241FA04152" && (
                <button
                  type="button"
                  className="google-account-option-btn"
                  onClick={() => handleGoogleDemoSelect("student", selectedStudentRoll, null, selectedSectionNum)}
                  title={`Sign in with selected student ${selectedStudentRoll}`}
                >
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                    alt="Student"
                    className="google-account-avatar"
                  />
                  <div className="google-account-info">
                    <span className="google-account-name">
                      {(ALL_STUDENTS.find((s) => s.roll === selectedStudentRoll) || {}).name || selectedStudentRoll} (Selected)
                    </span>
                    <span className="google-account-email">vu.{selectedStudentRoll.toLowerCase()}@gmail.com &bull; Section {selectedSectionNum}</span>
                  </div>
                  <div className="google-role-badge student-badge-tag">STUDENT</div>
                </button>
              )}

              {/* Unauthorized Account Rejection Test */}
              <button
                type="button"
                className="google-account-option-btn unauthorized-test-card"
                onClick={() => handleGoogleDemoSelect("unauthorized")}
                title="Test Unauthorized Google Account (Triggers 403 Access Denied)"
              >
                <div className="google-account-avatar-unauth">
                  <AlertCircle size={22} style={{ color: "#dc2626" }} />
                </div>
                <div className="google-account-info">
                  <span className="google-account-name text-danger">External Account (Test Rejection)</span>
                  <span className="google-account-email">unauthorized.guest@gmail.com &bull; Not in Whitelist</span>
                </div>
                <div className="google-role-badge unauthorized-badge-tag">REJECT 403</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
