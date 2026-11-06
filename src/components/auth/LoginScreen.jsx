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
  ShieldAlert,
  Pause,
  Play,
  Building2,
  ChevronRight
} from "lucide-react";
import { SECTION_1_FACULTIES } from "../../data/timetable";
import { SECTIONS, COUNSELLORS, ALL_STUDENTS } from "../../../data.js";
import GoogleAccountPickerModal from "./GoogleAccountPickerModal";

// Official Vignan University Campus Imagery from https://www.vignan.ac.in/
export const VIGNAN_CAMPUS_GALLERY = [
  {
    id: "vignan-main-1",
    title: "Vignan's Foundation Deemed to be University",
    subtitle: "Central Administrative & Academic Main Building",
    local: "/images/vignan/vignan_university_main.png",
    remote: "/images/vignan/hero_slide_1.webp"
  },
  {
    id: "vignan-main-2",
    title: "Vignan University Grand Columns & Entrance",
    subtitle: "Department of Computer Science & Engineering",
    local: "/images/vignan/vignan_university_main.png",
    remote: "/images/vignan/hero_slide_1.webp"
  },
  {
    id: "hero-3",
    title: "A-Block Administrative & Academic Complex",
    subtitle: "Dean & University Leadership Wing",
    local: "/images/vignan/hero_slide_3.webp",
    remote: "https://www.vignan.ac.in/assets/images/home/image-13.webp"
  },
  {
    id: "ablock",
    title: "A-Block Iconic Facade",
    subtitle: "Central Academic Hub",
    local: "/images/vignan/ablock.webp",
    remote: "https://www.vignan.ac.in/assets/images/Ablock.webp"
  },
  {
    id: "whychooseus",
    title: "Lush Green Eco-Friendly Campus Lawns",
    subtitle: "Vignan University Vadlamudi",
    local: "/images/vignan/whychooseus.webp",
    remote: "https://www.vignan.ac.in/assets/images/whychooseus.webp"
  },
  {
    id: "departments",
    title: "School of Engineering & Technology Blocks",
    subtitle: "State-of-the-art Infrastructure",
    local: "/images/vignan/departments.webp",
    remote: "https://www.vignan.ac.in/assets/images/departments.webp"
  },
  {
    id: "cseslide",
    title: "Department of Computer Science & Engineering",
    subtitle: "Coding & AI Centers of Excellence",
    local: "/images/vignan/cseslide.webp",
    remote: "https://www.vignan.ac.in/assets/images/homeschoolstest/cseslide.webp"
  },
  {
    id: "gall-1",
    title: "University Grand Arch & Clock Tower",
    subtitle: "Historic Campus Entrance",
    local: "/images/vignan/gallery_01.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img01.webp"
  },
  {
    id: "gall-2",
    title: "NTR Central Knowledge Resource Center & Library",
    subtitle: "Over 100,000 Academic Volumes & Journals",
    local: "/images/vignan/gallery_02.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img02.webp"
  },
  {
    id: "gall-3",
    title: "Open-Air Amphitheatre & Cultural Stage",
    subtitle: "Mahotsav & Annual Celebrations Venue",
    local: "/images/vignan/gallery_03.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img03.webp"
  },
  {
    id: "gall-4",
    title: "CSE Innovation & Cloud Computing Labs",
    subtitle: "Active Smart Classrooms & Servers",
    local: "/images/vignan/gallery_04.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img04.webp"
  },
  {
    id: "gall-5",
    title: "Lara Convention Center & Seminar Auditoriums",
    subtitle: "International Symposiums & Conferences",
    local: "/images/vignan/gallery_05.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img05.webp"
  },
  {
    id: "gall-6",
    title: "Sports Complex & Athletic Stadium",
    subtitle: "Multi-court Indoor & Outdoor Facilities",
    local: "/images/vignan/gallery_06.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img06.webp"
  },
  {
    id: "gall-7",
    title: "Central Green Campus Boulevards",
    subtitle: "Tree-Canopied Pedestrian Walkways",
    local: "/images/vignan/gallery_07.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img07.webp"
  },
  {
    id: "gall-8",
    title: "Robotics & Advanced Engineering Workshops",
    subtitle: "Hands-on Practical Training Centers",
    local: "/images/vignan/gallery_08.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img08.webp"
  },
  {
    id: "gall-9",
    title: "Illuminated University Campus by Night",
    subtitle: "24/7 Secure & Vibrant Campus Living",
    local: "/images/vignan/gallery_09.webp",
    remote: "https://www.vignan.ac.in/assets/images/gallerytest/pic_gall_img09.webp"
  }
];

const VIGNAN_COL_A = VIGNAN_CAMPUS_GALLERY.filter((_, idx) => idx % 2 === 0);
const VIGNAN_COL_B = VIGNAN_CAMPUS_GALLERY.filter((_, idx) => idx % 2 !== 0);

// Resilient Image Loader with local & remote fallback
function VignanImage({ item, className, alt }) {
  const [imgSrc, setImgSrc] = useState(item.local);
  return (
    <img
      src={imgSrc}
      alt={alt || item.title}
      className={className}
      loading="lazy"
      onError={() => {
        if (imgSrc !== item.remote) {
          setImgSrc(item.remote);
        }
      }}
    />
  );
}


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
  const [selectedStudentRoll, setSelectedStudentRoll] = useState("241FA04B57");
  const [selectedFacultyName, setSelectedFacultyName] = useState(
    SECTION_1_FACULTIES[0]?.name || "Dr. P. Siva Prasad (Class Teacher & ML)"
  );

  // Sign In vs Sign Up Mode for Student
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"
  const [signupName, setSignupName] = useState("");
  const [signupRoll, setSignupRoll] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");



  // Local storage registry for registered student accounts with password
  const getRegisteredStudents = () => {
    try {
      const raw = localStorage.getItem("vfstr_registered_students");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveRegisteredStudent = (record) => {
    try {
      const list = getRegisteredStudents();
      const updated = [record, ...list.filter((u) => u.roll.toUpperCase() !== record.roll.toUpperCase())];
      localStorage.setItem("vfstr_registered_students", JSON.stringify(updated));
    } catch {}
  };

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
  const handleGoogleSignIn = () => {
    setError("");
    setShowGoogleModal(true);
  };

  // Process account selection from GoogleAccountPickerModal with Strict Role Guard
  const handleGoogleAccountSelected = (userPayload) => {
    // If student tries to login into faculty/counsellor/admin, strictly block!
    if (
      userPayload.role === "student" &&
      (activeRole === "faculty" || activeRole === "counsellor" || activeRole === "admin")
    ) {
      setError(
        `⛔ ACCESS DENIED: Student accounts (${userPayload.email || userPayload.roll}) are strictly forbidden from logging into Faculty or Admin portals. Please switch to the Student Portal.`
      );
      setShowGoogleModal(false);
      return;
    }
    setShowGoogleModal(false);
    onLogin(userPayload);
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
      setUsername(selectedStudentRoll || "");
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
      if (authMode === "signup") {
        if (!signupName.trim()) {
          setError("Please enter your full name as in university records.");
          return;
        }
        if (!signupRoll.trim()) {
          setError("Please enter your university roll number.");
          return;
        }
        if (!signupPassword) {
          setError("Please create an account password.");
          return;
        }
        if (signupPassword.length < 4) {
          setError("Password must be at least 4 characters long.");
          return;
        }
        if (signupPassword !== signupConfirmPassword) {
          setError("Passwords do not match. Please verify.");
          return;
        }

        const cleanRoll = signupRoll.toUpperCase().trim();
        const cleanEmail = signupEmail.trim().toLowerCase() || `vu.${cleanRoll.toLowerCase()}@gmail.com`;
        const matched = ALL_STUDENTS.find((s) => s.roll.toUpperCase() === cleanRoll);

        const newStudent = {
          role: "student",
          id: cleanRoll,
          roll: cleanRoll,
          name: signupName.trim(),
          email: cleanEmail,
          section: matched?.section || `Section ${selectedSectionNum}`,
          sectionNum: matched?.sectionNum || selectedSectionNum,
          counsellor: matched?.counsellor || selectedFacultyName,
          room: `Room N-40${((selectedSectionNum % 10) || 1) + 1}`,
          semester: "III Year - 5th Semester",
          department: "Computer Science & Engineering",
          password: signupPassword,
          registeredAt: new Date().toISOString()
        };

        saveRegisteredStudent(newStudent);
        setSuccessMessage(`✓ Account created successfully for ${newStudent.name}! Logging in...`);
        setTimeout(() => {
          onLogin(newStudent);
        }, 400);
        return;
      }

      // authMode === "signin"
      const trimmedInput = username.trim().toUpperCase();
      const cleanRoll = trimmedInput.startsWith("VU.")
        ? trimmedInput.split("@")[0].replace(/^VU\./, "")
        : trimmedInput;

      const registeredList = getRegisteredStudents();
      const registeredUser = registeredList.find(
        (u) =>
          u.roll.toUpperCase() === cleanRoll ||
          u.email.toLowerCase() === username.trim().toLowerCase()
      );

      // Verify password if registered with custom password
      if (registeredUser && registeredUser.password) {
        if (password && password !== registeredUser.password) {
          setError("Invalid password. Please enter the correct password for your account.");
          return;
        }
      }

      const student =
        registeredUser ||
        students.find((s) => s.roll.toUpperCase() === cleanRoll) ||
        ALL_STUDENTS.find((s) => s.roll.toUpperCase() === cleanRoll) || {
          roll: cleanRoll,
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
        email: student.email || `vu.${rollLower}@gmail.com`,
        section: student.section || `Section ${selectedSectionNum}`,
        sectionNum: student.sectionNum || selectedSectionNum,
        counsellor: student.counsellor || selectedFacultyName,
        room: `Room N-40${((student.sectionNum || selectedSectionNum) % 10) + 1}`,
        semester: "III Year - 5th Semester",
        department: "Computer Science & Engineering"
      });
      return;
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
          LEFT SIDE: VIGNAN UNIVERSITY BACKGROUND SHOWCASE (SECOND IMAGE)
          ========================================================================= */}
      <div className="login-showcase-side">
        {/* Background Image: Second Image (Replaces Background Scrolling) */}
        <div
          className="vignan-static-bg"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/images/vignan/vignan_university_main.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0
          }}
        />

        {/* Foreground Content (Minimal clean branding) */}
        <div className="vignan-showcase-fg">
          {/* Top Bar */}
          <div className="vignan-top-bar">
            <div className="vignan-brand-chip">
              <span className="vignan-pulse-dot" />
              <span style={{ fontWeight: 800, letterSpacing: "0.5px" }}>VFSTR DEEMED UNIVERSITY</span>
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="vignan-bottom-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#e2e8f0" }}>
              <MapPin size={15} style={{ color: "#ffffff" }} />
              <span>Vadlamudi Green Campus &bull; Guntur, AP 522213</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#94a3b8" }}>
              <ShieldCheck size={14} style={{ color: "#ffffff" }} />
              <span>RBAC 2.0 &bull; Google OAuth Verified &bull; vignan.ac.in</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: LOGIN CARD (NON-SCROLLING OBSIDIAN THEME)
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

          {/* Success Banner */}
          {successMessage && (
            <div className="square-alert-banner" style={{ background: "#f0fdf4", borderColor: "#000000", color: "#000000" }} role="status">
              <CheckCircle2 size={16} className="square-alert-icon" style={{ color: "#000000" }} />
              <div className="square-alert-text">{successMessage}</div>
            </div>
          )}

          {/* Google 1-Click Sign-In Button */}
          <div className="square-oauth-section">
            <button
              type="button"
              className="square-google-btn"
              onClick={() => handleGoogleSignIn()}
              disabled={googleLoading}
              title={activeRole === "student" && authMode === "signup" ? "Sign up with Google / VU Student Mail" : "Sign in with Google / VU Student Mail"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>
                {googleLoading
                  ? "Connecting..."
                  : activeRole === "student" && authMode === "signup"
                  ? "Sign up with Google / VU Mail"
                  : "Sign in with Google / VU Mail"}
              </span>
            </button>
          </div>

          <div className="square-divider">
            <span>OR {activeRole === "student" && authMode === "signup" ? "REGISTER INSTITUTIONAL ACCOUNT" : "LOGIN WITH PORTAL CREDENTIALS"}</span>
          </div>

          {/* Student Sign In vs Sign Up Sub-Tabs */}
          {activeRole === "student" && (
            <div className="square-sub-tabs">
              <button
                type="button"
                className={`square-sub-tab ${authMode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signin");
                  setError("");
                  setSuccessMessage("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`square-sub-tab ${authMode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                  setSuccessMessage("");
                }}
              >
                Sign Up / Register First
              </button>
            </div>
          )}

          {/* Dynamic Compact Inputs for Selected Role */}
          <form onSubmit={handleSubmit} className="square-form-body">
            {/* STUDENT SIGN IN FORM */}
            {activeRole === "student" && authMode === "signin" && (
              <div className="square-field-group">
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="square-field-label">Registered Email or Roll Number</label>
                    <input
                      type="text"
                      className="square-input"
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setUsername(val);
                        setSelectedStudentRoll(val);
                        const clean = val.startsWith("VU.") ? val.split("@")[0].replace(/^VU\./, "") : val;
                        const match = ALL_STUDENTS.find((s) => s.roll.toUpperCase() === clean);
                        if (match && match.sectionNum) {
                          setSelectedSectionNum(match.sectionNum);
                        }
                      }}
                      placeholder="e.g. 241FA04035 or vu.241fa04035@gmail.com"
                      required
                      autoFocus
                    />
                  </div>
                  <div style={{ width: "120px" }}>
                    <label className="square-field-label">Section</label>
                    <select
                      className="square-select"
                      value={selectedSectionNum}
                      onChange={(e) => setSelectedSectionNum(Number(e.target.value))}
                    >
                      {SECTIONS.map((sec) => {
                        const secNum = sec.num || sec.sectionNum || parseInt(String(sec.section).replace(/\D/g, ""), 10);
                        return (
                          <option key={secNum} value={secNum}>
                            Sec {secNum}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="square-field-label">Account Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="square-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#000000", cursor: "pointer" }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {matchedStudentObj ? (
                  <div className="square-student-match-chip">
                    <span>✓ Enrolled: <strong>{matchedStudentObj.name}</strong></span>
                    <span style={{ color: "#000000", fontWeight: 700 }}>&bull; ID: {matchedStudentObj.roll} ({matchedStudentObj.section})</span>
                    <span style={{ color: "#52525b" }}>&bull; vu.{matchedStudentObj.roll.toLowerCase()}@gmail.com</span>
                  </div>
                ) : (
                  username.trim() && (
                    <div className="square-student-match-chip" style={{ background: "#fef2f2", borderColor: "#f87171", color: "#991b1b" }}>
                      <span>⚠️ Only verified student roll numbers are permitted. No other IDs appear.</span>
                    </div>
                  )
                )}

                <div style={{ textAlign: "center", marginTop: "2px" }}>
                  <button
                    type="button"
                    className="square-toggle-link"
                    onClick={() => { setAuthMode("signup"); setError(""); setSuccessMessage(""); }}
                  >
                    Don't have an enrolled institutional identity? Register First
                  </button>
                </div>
              </div>
            )}

            {/* STUDENT SIGN UP / REGISTER FIRST FORM */}
            {activeRole === "student" && authMode === "signup" && (
              <div className="square-field-group">
                <div>
                  <label className="square-field-label">Full Name (as in College Records)</label>
                  <input
                    type="text"
                    className="square-input"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. SITA RAMA RAJU"
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="square-field-label">Student Roll Number / Regd No</label>
                    <input
                      type="text"
                      className="square-input"
                      value={signupRoll}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        setSignupRoll(val);
                        setSignupEmail(`vu.${val.toLowerCase()}@gmail.com`);
                        const match = ALL_STUDENTS.find((s) => s.roll.toUpperCase() === val);
                        if (match) {
                          if (match.name) setSignupName(match.name);
                          if (match.sectionNum) setSelectedSectionNum(match.sectionNum);
                        }
                      }}
                      placeholder="e.g. 241FA04035"
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
                      {SECTIONS.map((sec) => {
                        const secNum = sec.num || sec.sectionNum || parseInt(String(sec.section).replace(/\D/g, ""), 10);
                        return (
                          <option key={secNum} value={secNum}>
                            Sec {secNum}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="square-field-label">Official Student Email (VU Mail)</label>
                  <input
                    type="email"
                    className="square-input"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="vu.<roll>@gmail.com"
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="square-field-label">Create Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        className="square-input"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 4 chars"
                        required
                      />
                      <button
                        type="button"
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#000000", cursor: "pointer" }}
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="square-field-label">Confirm Password</label>
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      className="square-input"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "2px" }}>
                  <button
                    type="button"
                    className="square-toggle-link"
                    onClick={() => { setAuthMode("signin"); setError(""); setSuccessMessage(""); }}
                  >
                    Already have an enrolled identity? Sign In
                  </button>
                </div>
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
                      onChange={(e) => {
                        const fName = e.target.value;
                        setSelectedFacultyName(fName);
                        const matched = SECTION_1_FACULTIES.find((f) => f.name === fName || f.id === fName);
                        if (matched && matched.sectionNum) {
                          setSelectedSectionNum(matched.sectionNum);
                        }
                      }}
                    >
                      {SECTION_1_FACULTIES.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name}{f.subject ? ` (${f.subject})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: "135px" }}>
                    <label className="square-field-label">Class Section</label>
                    <select
                      className="square-select"
                      value={selectedSectionNum}
                      onChange={(e) => {
                        const secN = Number(e.target.value);
                        setSelectedSectionNum(secN);
                        if (secN === 18) {
                          const ky = SECTION_1_FACULTIES.find((f) => f.id === "fac_kareena_yasmin");
                          if (ky) setSelectedFacultyName(ky.name);
                        }
                      }}
                    >
                      {SECTIONS.map((sec) => {
                        const secNum = sec.num || sec.sectionNum || parseInt(String(sec.section).replace(/\D/g, ""), 10);
                        const count = sec.totalStudents || sec.studentCount || 0;
                        return (
                          <option key={secNum} value={secNum}>
                            Sec {secNum} ({count} st.)
                          </option>
                        );
                      })}
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
                  {COUNSELLORS.map((c, idx) => (
                    <option key={c.id || c.name || idx} value={c.name}>
                      {c.name} {c.name.includes("Kareena") ? "(Kareena Yasmin) " : ""}&bull; {c.studentCount} Students ({c.sections.map((s) => `Sec ${s}`).join(", ")})
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
              <span>
                {activeRole === "student" && authMode === "signup"
                  ? "Register Institutional Account & Sign In"
                  : `Sign In to ${
                      activeRole === "faculty"
                        ? "Attendance"
                        : activeRole === "counsellor"
                        ? "Counselling"
                        : activeRole === "student"
                        ? "Student"
                        : "Admin"
                    } Portal`}
              </span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          {activeRole !== "student" && (
            <div className="square-quick-bar">
              <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Quick Authentication Shortcuts:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                <button
                  type="button"
                  className="square-demo-pill"
                  onClick={() => handleGoogleSignIn()}
                >
                  🌐 Choose Account
                </button>
                <button
                  type="button"
                  className="square-demo-pill"
                  onClick={() =>
                    handleGoogleAccountSelected({
                      role: "admin",
                      name: "VFSTR University Admin",
                      email: "deviraghuveerabaib@gmail.com",
                      isAdmin: true
                    })
                  }
                >
                  🛡️ VFSTR University (Admin)
                </button>
              </div>
            </div>
          )}
          {activeRole === "student" && (
            <div className="square-quick-bar">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", color: "#000000", fontWeight: 600 }}>
                <ShieldCheck size={14} style={{ color: "#000000" }} />
                <span>Strict Student Isolation: Only your verified college ID generation is authorized.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentic Google Account Chooser Modal (matching screenshot) */}
      <GoogleAccountPickerModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectUser={handleGoogleAccountSelected}
        activeRole={activeRole}
        selectedSectionNum={selectedSectionNum}
        selectedFacultyName={selectedFacultyName}
      />
    </div>
  );
}

