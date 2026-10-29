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

// Google OAuth Configuration info
router.get("/auth/google/config", (req, res) => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const hasSecret = Boolean((process.env.GOOGLE_CLIENT_SECRET || "").trim());
  res.json({
    success: true,
    clientId,
    configured: Boolean(clientId),
    hasSecret
  });
});

// Google OAuth Token / Credential Verification & User Provisioning
router.post("/auth/google/verify", async (req, res) => {
  try {
    const { credential, code, redirectUri } = req.body;
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
          // Fallback: parse JWT payload
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
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri || "postmessage",
          grant_type: "authorization_code"
        })
      });
      const tokenData = await tokenRes.json();
      if (tokenData.id_token) {
        const parts = tokenData.id_token.split(".");
        googleUser = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
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

    // Map Google User to portal role & profile
    let mappedUser = null;

    // Check if email contains a student roll number (e.g. 241FA04035)
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

    // Check if email matches a counsellor
    if (!mappedUser) {
      const matchedCounsellor = COUNSELLORS.find(
        (c) =>
          email.includes(c.name.split(" ").slice(-1)[0].toLowerCase()) ||
          name.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCounsellor) {
        mappedUser = {
          role: "counsellor",
          facultyMode: "counselling",
          id: matchedCounsellor.name.replace(/\s+/g, "_").toLowerCase(),
          name: matchedCounsellor.name,
          counsellorName: matchedCounsellor.name,
          email,
          avatar: picture,
          assignedSections: matchedCounsellor.sections,
          section: `Section ${matchedCounsellor.sections[0] || 1}`,
          sectionNum: matchedCounsellor.sections[0] || 1,
          studentCount: matchedCounsellor.studentCount,
          authProvider: "google"
        };
      }
    }

    // Check if admin / HOD
    if (!mappedUser && (email.includes("admin") || email.includes("hod") || email.includes("dean"))) {
      mappedUser = {
        role: "admin",
        id: "admin_google",
        name: name || "Administrator (HOD CSE)",
        email,
        avatar: picture,
        designation: "Head of the Department / Academic Dean",
        department: "Computer Science & Engineering",
        authProvider: "google"
      };
    }

    // Default: authenticate as verified student user
    if (!mappedUser) {
      const sampleStudent = currentStudents[0] || { roll: "241FA04035", section: "Section 1", sectionNum: 1 };
      mappedUser = {
        role: "student",
        id: matchedRoll || sampleStudent.roll,
        roll: matchedRoll || sampleStudent.roll,
        name: name,
        email,
        avatar: picture,
        section: sampleStudent.section,
        sectionNum: sampleStudent.sectionNum,
        counsellor: sampleStudent.counsellor,
        authProvider: "google"
      };
    }

    res.json({
      success: true,
      message: `Authenticated successfully via Google as ${mappedUser.name}`,
      user: mappedUser,
      token: `google_jwt_${Date.now()}`
    });
  } catch (error) {
    console.error("[Google OAuth Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Demo Google OAuth Simulation (for development / testing before GCP console keys)
router.post("/auth/google/mock-demo", (req, res) => {
  const { accountType = "student" } = req.body;
  let demoUser;

  if (accountType === "faculty") {
    demoUser = {
      role: "faculty",
      facultyMode: "attendance",
      id: "dr_p_siva_prasad",
      name: "Dr. P. Siva Prasad (Google Auth)",
      email: "psivaprasad@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      section: "Section 1",
      sectionNum: 1,
      authProvider: "google"
    };
  } else if (accountType === "counsellor") {
    const c = COUNSELLORS[0];
    demoUser = {
      role: "counsellor",
      facultyMode: "counselling",
      id: c.name.replace(/\s+/g, "_").toLowerCase(),
      name: `${c.name} (Google Auth)`,
      counsellorName: c.name,
      email: "gmurali@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      assignedSections: c.sections,
      section: `Section ${c.sections[0] || 1}`,
      sectionNum: c.sections[0] || 1,
      studentCount: c.studentCount,
      authProvider: "google"
    };
  } else if (accountType === "admin") {
    demoUser = {
      role: "admin",
      id: "admin_root",
      name: "Dr. K. Ramanjaneyulu (HOD CSE)",
      email: "hod_cse@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
      designation: "Head of the Department",
      authProvider: "google"
    };
  } else {
    const student = currentStudents[0] || { roll: "241FA04035", name: "SRUJANA", section: "Section 1", sectionNum: 1 };
    demoUser = {
      role: "student",
      id: student.roll,
      roll: student.roll,
      name: `${student.name} (Google Auth)`,
      email: `${student.roll.toLowerCase()}@vignan.ac.in`,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      section: student.section,
      sectionNum: student.sectionNum,
      counsellor: student.counsellor,
      room: "Room N-402",
      authProvider: "google"
    };
  }

  res.json({
    success: true,
    message: `Signed in with Google as ${demoUser.name}`,
    user: demoUser,
    token: `demo_google_token_${Date.now()}`
  });
});

// Mount router on both /api and root / for seamless Vercel & local proxy support
app.use("/api", router);
app.use("/", router);

export default app;
