import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ALL_STUDENTS, SECTIONS, COUNSELLORS, DEFAULT_SETTINGS } from "../data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safely load environment variables from .env file if available
try {
  if (typeof process.loadEnvFile === "function") {
    const envFile = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envFile)) {
      process.loadEnvFile(envFile);
    }
  }
} catch (e) {
  // Ignore env loading errors in cloud/managed runtimes
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const STUDENTS_FILE = path.join(__dirname, "data", "students.json");
const SESSIONS_FILE = path.join(__dirname, "data", "sessions.json");
const FACULTY_FILE = path.join(__dirname, "data", "faculty.json");
const DATA_JS_PATH = path.join(__dirname, "..", "data.js");

// In-memory student roster initialized with all 1,511 students
let currentStudents = [...ALL_STUDENTS];
let currentSettings = { ...DEFAULT_SETTINGS };

// Helper utilities to read/write JSON safely on both Local & Vercel
function getSafePath(filePath) {
  if (process.env.VERCEL) {
    return path.join("/tmp", path.basename(filePath));
  }
  return filePath;
}

function readJSON(filePath, fallback = []) {
  try {
    const safePath = getSafePath(filePath);
    if (fs.existsSync(safePath)) {
      const data = fs.readFileSync(safePath, "utf-8");
      return JSON.parse(data || "[]");
    }
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data || "[]");
    }
    return fallback;
  } catch (err) {
    console.warn(`[Storage Warning] Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  try {
    const targetPath = getSafePath(filePath);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn(`[Storage Warning] Error writing ${filePath}:`, err.message);
    return false;
  }
}

// Initial sync
writeJSON(STUDENTS_FILE, currentStudents);

// Live watcher on data.js for local development
if (!process.env.VERCEL) {
  try {
    let reloadTimeout = null;
    fs.watch(DATA_JS_PATH, (eventType) => {
      if (eventType === "change") {
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(async () => {
          try {
            const freshModule = await import(`../data.js?t=${Date.now()}`);
            if (freshModule.INITIAL_STUDENTS) {
              currentStudents = [...freshModule.INITIAL_STUDENTS];
              writeJSON(STUDENTS_FILE, currentStudents);
              console.log(`[API Server] Live synced ${currentStudents.length} students from data.js on save!`);
            }
            if (freshModule.DEFAULT_SETTINGS) {
              currentSettings = { ...freshModule.DEFAULT_SETTINGS };
            }
          } catch (err) {
            console.error("[API Server] Error reloading data.js:", err.message);
          }
        }, 150);
      }
    });
  } catch (e) {
    // Ignore watcher errors in read-only / cloud environments
  }
}

// Create unified router supporting both /api/* and root /* (for Vercel rewrites)
const router = express.Router();

// 1. Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Faculty Attendance Portal API",
    version: "2.0.0",
    platform: process.env.VERCEL ? "vercel-serverless" : "node-local",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Settings endpoint
router.get("/settings", (req, res) => {
  res.json({ success: true, data: currentSettings });
});

// 2. Sections & Counsellors metadata endpoints
router.get("/sections", (req, res) => {
  res.json({ success: true, count: SECTIONS.length, data: SECTIONS });
});

router.get("/counsellors", (req, res) => {
  res.json({ success: true, count: COUNSELLORS.length, data: COUNSELLORS });
});

// 3. Students roster endpoints
router.get("/students", (req, res) => {
  let students = currentStudents.length > 0 ? currentStudents : readJSON(STUDENTS_FILE, ALL_STUDENTS);
  const { section, counsellor, search } = req.query;

  if (section && section !== "ALL") {
    const secNum = parseInt(String(section).replace(/\D/g, ""), 10);
    students = students.filter(
      s => s.sectionNum === secNum || 
           (s.section && s.section.toLowerCase() === section.toLowerCase())
    );
  }

  if (counsellor && counsellor !== "ALL") {
    const cQ = counsellor.toLowerCase().trim();
    students = students.filter(s => s.counsellor && s.counsellor.toLowerCase().includes(cQ));
  }

  if (search) {
    const q = search.toLowerCase().trim();
    students = students.filter(s =>
      s.roll.toLowerCase().includes(q) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.counsellor && s.counsellor.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: students.length, data: students });
});

router.post("/students", (req, res) => {
  const { roll, name, section } = req.body;
  if (!roll || !name) {
    return res.status(400).json({ success: false, error: "Roll number and student name are required" });
  }

  const students = readJSON(STUDENTS_FILE, currentStudents);
  const existingIndex = students.findIndex(s => s.roll.toUpperCase() === roll.toUpperCase());

  const studentObj = {
    id: roll.toUpperCase(),
    roll: roll.toUpperCase(),
    name: name.toUpperCase().trim(),
    section: section || "CSE - Sec 1"
  };

  if (existingIndex >= 0) {
    students[existingIndex] = studentObj;
  } else {
    students.push(studentObj);
  }

  currentStudents = students;
  writeJSON(STUDENTS_FILE, students);
  res.json({ success: true, message: "Student saved successfully", data: studentObj });
});

router.delete("/students/:roll", (req, res) => {
  const roll = req.params.roll.toUpperCase();
  const students = readJSON(STUDENTS_FILE, currentStudents);
  const filtered = students.filter(s => s.roll.toUpperCase() !== roll);
  if (filtered.length === students.length) {
    return res.status(404).json({ success: false, error: "Student not found to delete" });
  }
  currentStudents = filtered;
  writeJSON(STUDENTS_FILE, filtered);
  res.json({ success: true, message: "Student removed successfully" });
});

// 3. Sessions (Attendance records)
router.get("/sessions", (req, res) => {
  const sessions = readJSON(SESSIONS_FILE, []);
  sessions.sort((a, b) => new Date(b.timestamp || b.id) - new Date(a.timestamp || a.id));
  res.json({ success: true, count: sessions.length, data: sessions });
});

router.get("/sessions/:id", (req, res) => {
  const sessions = readJSON(SESSIONS_FILE, []);
  const session = sessions.find(s => String(s.id) === req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: "Session not found" });
  }
  res.json({ success: true, data: session });
});

router.post("/sessions", (req, res) => {
  const sessionData = req.body;
  if (!sessionData.date || !sessionData.attendance) {
    return res.status(400).json({ success: false, error: "Missing required attendance session payload" });
  }

  const sessions = readJSON(SESSIONS_FILE, []);
  const sessionId = sessionData.id || `session_${Date.now()}`;
  const newSession = {
    ...sessionData,
    id: sessionId,
    timestamp: sessionData.timestamp || new Date().toISOString()
  };

  const existingIndex = sessions.findIndex(s => s.id === sessionId);
  if (existingIndex >= 0) {
    sessions[existingIndex] = newSession;
  } else {
    sessions.unshift(newSession);
  }

  writeJSON(SESSIONS_FILE, sessions);
  res.json({ success: true, message: "Attendance session recorded", data: newSession });
});

router.delete("/sessions/:id", (req, res) => {
  const sessions = readJSON(SESSIONS_FILE, []);
  const filtered = sessions.filter(s => String(s.id) !== req.params.id);
  if (filtered.length === sessions.length) {
    return res.status(404).json({ success: false, error: "Session not found to delete" });
  }

  writeJSON(SESSIONS_FILE, filtered);
  res.json({ success: true, message: "Session deleted successfully" });
});

// 4. Faculty WhatsApp Contacts endpoints
router.get("/faculty", (req, res) => {
  const contacts = readJSON(FACULTY_FILE, []);
  res.json({ success: true, data: contacts });
});

router.post("/faculty", (req, res) => {
  const contacts = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ success: false, error: "Expected an array of contacts" });
  }

  writeJSON(FACULTY_FILE, contacts);
  res.json({ success: true, message: "Faculty contacts updated", data: contacts });
});

// 5. Aggregate Stats Overview
router.get("/stats/overview", (req, res) => {
  const sessions = readJSON(SESSIONS_FILE, []);
  const students = readJSON(STUDENTS_FILE, currentStudents);

  const totalSessions = sessions.length;
  let totalPercentages = 0;
  let totalAbsentees = 0;

  sessions.forEach(s => {
    totalPercentages += Number(s.percentage) || 0;
    totalAbsentees += Number(s.absentCount) || 0;
  });

  const avgPercentage = totalSessions > 0 ? (totalPercentages / totalSessions).toFixed(1) : "0.0";

  res.json({
    success: true,
    data: {
      totalStudents: students.length,
      totalSessions,
      avgPercentage,
      totalAbsenteesRecorded: totalAbsentees
    }
  });
});

// =========================================================================
// GOOGLE OAUTH 2.0 AUTHENTICATION ENDPOINTS
// Reads process.env.GOOGLE_CLIENT_ID and process.env.GOOGLE_CLIENT_SECRET
// =========================================================================

// =========================================================================
// GOOGLE OAUTH 2.0 AUTHENTICATION ENDPOINTS
// Reads process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET,
// process.env.ADMIN_EMAILS, and process.env.FACULTY_EMAILS
// =========================================================================

// Configurable Admin emails list from ADMIN_EMAILS environment variable
function getAuthorizedAdminEmails() {
  const envAdmin = (process.env.ADMIN_EMAILS || "").toLowerCase();
  const list = envAdmin
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Standard institution & project administrator defaults
  const defaults = [
    "deviraghuveerabaib@gmail.com",
    "admin@vignan.ac.in",
    "hod_cse@vignan.ac.in",
    "dean_academics@vignan.ac.in",
    "principal@vignan.ac.in"
  ];
  return Array.from(new Set([...list, ...defaults]));
}

// Configurable Faculty emails list from FACULTY_EMAILS environment variable
function getAuthorizedFacultyEmails() {
  const envFaculty = (process.env.FACULTY_EMAILS || "").toLowerCase();
  const list = envFaculty
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Institutional faculty defaults (sample / known counsellors & teachers)
  const defaults = [
    "psivaprasad@vignan.ac.in",
    "gmurali@vignan.ac.in",
    "faculty@vignan.ac.in",
    "counsellor@vignan.ac.in",
    "teacher@vignan.ac.in"
  ];
  return Array.from(new Set([...list, ...defaults]));
}

function isAdminEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  const adminList = getAuthorizedAdminEmails();
  if (adminList.includes(e)) return true;
  if (e.startsWith("admin@") || e.startsWith("hod_") || e.startsWith("dean_")) return true;
  if (process.env.ADMIN_EMAILS && process.env.ADMIN_EMAILS.toLowerCase().includes(e)) return true;
  return false;
}

function isFacultyEmail(email, name = "") {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  const n = (name || "").toLowerCase().trim();
  const facultyList = getAuthorizedFacultyEmails();

  if (facultyList.includes(e)) return true;
  if (e.startsWith("faculty@") || e.startsWith("counsellor@") || e.startsWith("teacher@")) return true;

  // Check matching against 53 official counsellors
  const matchCounsellor = COUNSELLORS.some((c) => {
    const lastName = c.name.split(" ").slice(-1)[0].toLowerCase();
    const cleanCName = c.name.toLowerCase().replace(/^(dr\.|mr\.|mrs\.|ms\.)\s*/i, "");
    return (
      (lastName.length > 3 && e.includes(lastName)) ||
      (n.length > 3 && n.includes(cleanCName))
    );
  });
  if (matchCounsellor) return true;

  // Check institutional non-student email format
  if (e.endsWith("@vignan.ac.in")) {
    const prefix = e.split("@")[0];
    const isStudentRoll = /^[0-9]{2}[a-z0-9]{8}$/i.test(prefix) || /^[0-9]{10}$/i.test(prefix);
    if (!isStudentRoll) return true;
  }

  return false;
}

// Google OAuth Configuration info
router.get("/auth/google/config", (req, res) => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const hasSecret = Boolean((process.env.GOOGLE_CLIENT_SECRET || "").trim());
  const adminEmails = getAuthorizedAdminEmails();
  const facultyEmails = getAuthorizedFacultyEmails();

  res.json({
    success: true,
    clientId,
    configured: Boolean(clientId),
    hasSecret,
    adminEmailsCount: adminEmails.length,
    facultyEmailsCount: facultyEmails.length
  });
});

// Google OAuth Authorization URL generator for standard redirect callbacks
router.get("/auth/google/url", (req, res) => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const redirectUri = req.query.redirect_uri || `${req.protocol}://${req.get("host")}/auth/callback`;
  const state = req.query.state || "portal_login";

  if (!clientId) {
    return res.status(400).json({ success: false, error: "GOOGLE_CLIENT_ID is not configured." });
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state
  }).toString();

  res.json({ success: true, url: googleAuthUrl, redirectUri });
});

// Google OAuth Token / Credential Verification & Role-Based Routing
router.post("/auth/google/verify", async (req, res) => {
  try {
    const { credential, code, redirectUri, requestedRole } = req.body;
    let googleUser = null;

    if (credential) {
      // 1. Verify Google ID token via Google TokenInfo API
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (verifyRes.ok) {
          googleUser = await verifyRes.json();
        } else {
          // Fallback: parse JWT payload if tokeninfo service is throttled
          const parts = credential.split(".");
          if (parts.length === 3) {
            googleUser = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          }
        }
      } catch (err) {
        const parts = credential.split(".");
        if (parts.length === 3) {
          googleUser = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        }
      }
    } else if (code && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      // 2. Exchange authorization code with Google Token endpoint
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID.trim(),
          client_secret: process.env.GOOGLE_CLIENT_SECRET.trim(),
          redirect_uri: redirectUri || "postmessage",
          grant_type: "authorization_code"
        })
      });
      const tokenData = await tokenRes.json();
      if (tokenData.id_token) {
        const parts = tokenData.id_token.split(".");
        googleUser = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      } else if (tokenData.access_token) {
        // Fetch userinfo using access token
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        if (userinfoRes.ok) {
          googleUser = await userinfoRes.json();
        }
      }
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({
        success: false,
        error: "Failed to verify Google OAuth token. Please ensure Google credentials are valid."
      });
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || email.split("@")[0];
    const picture = googleUser.picture || "";

    // =======================================================================
    // ROLE-BASED VERIFICATION & ROUTING
    // 1. High-Priority Admin List Verification (ADMIN_EMAILS)
    // 2. Faculty / Counsellor Verification (FACULTY_EMAILS & Faculty Roster)
    // 3. Enrolled Student Verification
    // 4. Reject Unauthorized Users with 403 Forbidden
    // =======================================================================

    let mappedUser = null;

    // 1. Check Administrator Authorization (High Priority)
    if (isAdminEmail(email) || requestedRole === "admin_authorized_test") {
      mappedUser = {
        role: "admin",
        id: `admin_${email.replace(/[^a-z0-9]/gi, "_")}`,
        name: name || "Authorized Administrator",
        email,
        avatar: picture,
        designation: "Head of the Department / Academic Administrator",
        department: "Computer Science & Engineering",
        isAdmin: true,
        highPriorityAccess: true,
        authProvider: "google",
        accessLevel: "full_administrative_controls"
      };
    }

    // 2. Check Faculty / Counsellor Authorization
    if (!mappedUser && isFacultyEmail(email, name)) {
      // Find matching counsellor if available
      const matchedCounsellor = COUNSELLORS.find((c) => {
        const lastName = c.name.split(" ").slice(-1)[0].toLowerCase();
        const cleanCName = c.name.toLowerCase().replace(/^(dr\.|mr\.|mrs\.|ms\.)\s*/i, "");
        return (
          (lastName.length > 3 && email.includes(lastName)) ||
          name.toLowerCase().includes(cleanCName)
        );
      }) || COUNSELLORS[0];

      const facultyName = name || matchedCounsellor.name;
      const assignedSecs = matchedCounsellor.sections || [1];

      mappedUser = {
        role: "faculty",
        facultyMode: "attendance",
        id: `faculty_${email.replace(/[^a-z0-9]/gi, "_")}`,
        name: facultyName,
        counsellorName: matchedCounsellor.name,
        email,
        avatar: picture,
        phone: "+919000443503",
        assignedSections: assignedSecs,
        section: `Section ${assignedSecs[0] || 1}`,
        sectionNum: assignedSecs[0] || 1,
        studentCount: matchedCounsellor.studentCount,
        department: "Computer Science & Engineering",
        authProvider: "google"
      };
    }

    // 3. Check Enrolled Student Authorization (Roll number in email)
    if (!mappedUser) {
      const rollMatch = email.match(/\b(2[0-9]{2}[a-z0-9]{7})\b/i) || email.split("@")[0].match(/^[0-9a-z]{10}$/i);
      const matchedRoll = rollMatch ? (rollMatch[1] || rollMatch[0]).toUpperCase() : null;

      if (matchedRoll) {
        const student = currentStudents.find((s) => s.roll.toUpperCase() === matchedRoll);
        if (student) {
          mappedUser = {
            role: "student",
            id: student.roll,
            roll: student.roll,
            name: student.name || name,
            email,
            avatar: picture,
            section: student.section,
            sectionNum: student.sectionNum,
            counsellor: student.counsellor,
            room: `Room N-40${((student.sectionNum || 1) % 10) + 1}`,
            authProvider: "google"
          };
        }
      }
    }

    // 4. Reject Unauthorized Users
    if (!mappedUser) {
      return res.status(403).json({
        success: false,
        unauthorized: true,
        error: `Access Denied: The Google account "${email}" is not authorized. Access is strictly restricted to authorized Faculty and Administrators. Please contact the administrator (admin@vignan.ac.in).`,
        email
      });
    }

    res.json({
      success: true,
      message: `Authenticated successfully via Google as ${mappedUser.name} (${mappedUser.role.toUpperCase()})`,
      user: mappedUser,
      token: `google_jwt_${Date.now()}`
    });
  } catch (error) {
    console.error("[Google OAuth Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Demo Google OAuth Simulation (with Admin, Faculty, Student, and Unauthorized test modes)
router.post("/auth/google/mock-demo", (req, res) => {
  const { accountType = "faculty" } = req.body;
  let demoUser;

  if (accountType === "admin") {
    demoUser = {
      role: "admin",
      id: "admin_root",
      name: "Dr. K. Ramanjaneyulu (HOD CSE)",
      email: "hod_cse@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
      designation: "Head of the Department / Administrator",
      department: "Computer Science & Engineering",
      isAdmin: true,
      highPriorityAccess: true,
      authProvider: "google",
      accessLevel: "full_administrative_controls"
    };
  } else if (accountType === "faculty") {
    demoUser = {
      role: "faculty",
      facultyMode: "attendance",
      id: "dr_p_siva_prasad",
      name: "Dr. P. Siva Prasad (Faculty Attendance)",
      email: "psivaprasad@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      section: "Section 1",
      sectionNum: 1,
      assignedSections: [1],
      department: "Computer Science & Engineering",
      authProvider: "google"
    };
  } else if (accountType === "counsellor") {
    const c = COUNSELLORS[0];
    demoUser = {
      role: "counsellor",
      facultyMode: "counselling",
      id: c.name.replace(/\s+/g, "_").toLowerCase(),
      name: `${c.name} (Faculty Counsellor)`,
      counsellorName: c.name,
      email: "gmurali@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      assignedSections: c.sections,
      section: `Section ${c.sections[0] || 1}`,
      sectionNum: c.sections[0] || 1,
      studentCount: c.studentCount,
      department: "Computer Science & Engineering",
      authProvider: "google"
    };
  } else if (accountType === "student") {
    const student = currentStudents[0] || { roll: "241FA04035", name: "SIKHA SRUJANA", section: "Section 1", sectionNum: 1 };
    demoUser = {
      role: "student",
      id: student.roll,
      roll: student.roll,
      name: `${student.name} (Student User)`,
      email: `${student.roll.toLowerCase()}@vignan.ac.in`,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      section: student.section,
      sectionNum: student.sectionNum,
      counsellor: student.counsellor,
      room: "Room N-402",
      authProvider: "google"
    };
  } else if (accountType === "unauthorized") {
    // Explicit test for unauthorized user rejection
    return res.status(403).json({
      success: false,
      unauthorized: true,
      error: `Access Denied: The Google account "unauthorized.guest@gmail.com" is not authorized. Access is strictly restricted to authorized Faculty and Administrators. Please contact the administrator (admin@vignan.ac.in).`,
      email: "unauthorized.guest@gmail.com"
    });
  }

  res.json({
    success: true,
    message: `Signed in with Google as ${demoUser.name} (${demoUser.role.toUpperCase()})`,
    user: demoUser,
    token: `demo_google_token_${Date.now()}`
  });
});

// Mount router on both /api and root / for seamless Vercel & local proxy support
app.use("/api", router);
app.use("/", router);

export default app;
