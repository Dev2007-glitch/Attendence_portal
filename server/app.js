import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { ALL_STUDENTS, SECTIONS, COUNSELLORS, DEFAULT_SETTINGS } from "../data.js";
import { connectDB, getCollection, getDb } from "./db/connection.js";
import { COLLECTIONS, DB_NAME } from "./db/collections.js";
import { recordAuditEvent, queryAuditLogs } from "./db/auditService.js";
import { storeFile, recordFileDownload } from "./db/fileStorageService.js";
import { createDatabaseBackup, listDatabaseBackups, restoreDatabaseBackup } from "./db/backupService.js";
import { getAllFacultyDirectory } from "../src/utils/facultyLocator.js";
import { getSimulatedFacultyGPS, resolveCampusLocation, VFSTR_BUILDINGS } from "../src/utils/campusGeofence.js";
import {
  updateLiveLocation,
  setLocationPermission,
  getLocationPermission,
  logLocationAccess,
  logConsentHistory,
  getStudentLocationForFaculty,
  getStudentLocationForCounsellor,
  getFacultyLocationForViewer,
  getAdminLocationAuditData,
  evaluateLocationFreshness
} from "./db/locationService.js";

// In-memory real-time GPS beacon cache
const facultyGpsStore = new Map();

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
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Helper to get client IP
function getClientIp(req) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
}

// -------------------------------------------------------------------------
// Router Definitions
// -------------------------------------------------------------------------
const router = express.Router();

// 1. Health & Database Diagnostic
router.get("/health", async (req, res) => {
  let mongoStatus = "DISCONNECTED";
  let collectionsSummary = {};

  try {
    const db = getDb();
    if (db) {
      mongoStatus = "CONNECTED";
      const colls = await db.listCollections().toArray();
      for (const c of colls) {
        collectionsSummary[c.name] = await db.collection(c.name).estimatedDocumentCount();
      }
    }
  } catch (e) {
    mongoStatus = `ERROR: ${e.message}`;
  }

  res.json({
    status: "healthy",
    service: "VFSTR CSE Attendance Portal Master API",
    version: "2.4.0",
    database: DB_NAME,
    mongoConnection: mongoStatus,
    collections: collectionsSummary,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Settings endpoint
router.get("/settings", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.APPLICATION_SETTINGS);
    const doc = await coll.findOne({ key: "default_portal_settings" });
    res.json({ success: true, data: doc?.settings || DEFAULT_SETTINGS });
  } catch (err) {
    res.json({ success: true, data: DEFAULT_SETTINGS });
  }
});

// 2. Sections & Counsellors metadata endpoints
router.get("/sections", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.CLASS_SECTIONS);
    const sections = await coll.find({}).sort({ sectionNum: 1 }).toArray();
    res.json({ success: true, count: sections.length, data: sections.length > 0 ? sections : SECTIONS });
  } catch (err) {
    res.json({ success: true, count: SECTIONS.length, data: SECTIONS });
  }
});

router.get("/counsellors", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.COUNSELLORS);
    const counsellors = await coll.find({}).sort({ name: 1 }).toArray();
    res.json({ success: true, count: counsellors.length, data: counsellors.length > 0 ? counsellors : COUNSELLORS });
  } catch (err) {
    res.json({ success: true, count: COUNSELLORS.length, data: COUNSELLORS });
  }
});

// 3. Students Roster Endpoints (Database-Driven)
router.get("/students", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.STUDENTS);
    const { section, counsellor, search } = req.query;
    const filter = {};

    if (section && section !== "ALL") {
      const secNum = parseInt(String(section).replace(/\D/g, ""), 10);
      filter.$or = [
        { sectionNum: secNum },
        { section: { $regex: section, $options: "i" } }
      ];
    }

    if (counsellor && counsellor !== "ALL") {
      filter.counsellor = { $regex: counsellor.trim(), $options: "i" };
    }

    if (search) {
      const q = search.trim();
      filter.$or = [
        { roll: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { counsellor: { $regex: q, $options: "i" } }
      ];
    }

    const students = await coll.find(filter).sort({ roll: 1 }).toArray();

    // Record Search / Query Activity
    if (search) {
      await getCollection(COLLECTIONS.SEARCH_ACTIVITY).insertOne({
        category: "STUDENTS",
        query: search,
        filters: { section, counsellor },
        resultCount: students.length,
        ip: getClientIp(req),
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    console.error("[API Error] /students:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/students", async (req, res) => {
  const { roll, name, section, counsellor } = req.body;
  if (!roll || !name) {
    return res.status(400).json({ success: false, error: "Roll number and student name are required" });
  }

  const rollUpper = roll.toUpperCase().trim();
  const nameUpper = name.toUpperCase().trim();
  const secName = section || "Section 1";
  const secNum = parseInt(String(secName).replace(/\D/g, "") || "1", 10);

  try {
    const coll = getCollection(COLLECTIONS.STUDENTS);
    const existing = await coll.findOne({ roll: rollUpper });

    const studentDoc = {
      roll: rollUpper,
      name: nameUpper,
      section: secName,
      sectionNum: secNum,
      counsellor: counsellor || (existing ? existing.counsellor : "Assigned Counsellor"),
      department: "Computer Science & Engineering",
      semester: "III Year - 5th Semester",
      officialEmail: `${rollUpper.toLowerCase()}@vignan.ac.in`,
      status: "ENROLLED",
      updatedAt: new Date()
    };

    await coll.updateOne(
      { roll: rollUpper },
      { $set: studentDoc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // Audit Event
    await recordAuditEvent({
      eventType: existing ? "STUDENT_UPDATED" : "STUDENT_ENROLLED",
      module: "students",
      actor: { userId: "admin", role: "admin", name: "Administrator" },
      target: { entityType: "student", entityId: rollUpper, details: `${nameUpper} (${secName})` },
      changes: { previous: existing, current: studentDoc },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: "Student saved to database successfully", data: studentDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/students/:roll", async (req, res) => {
  const roll = req.params.roll.toUpperCase().trim();
  try {
    const coll = getCollection(COLLECTIONS.STUDENTS);
    const existing = await coll.findOne({ roll });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Student not found in database" });
    }

    await coll.deleteOne({ roll });

    // Audit Event
    await recordAuditEvent({
      eventType: "STUDENT_DELETED",
      module: "students",
      actor: { userId: "admin", role: "admin", name: "Administrator" },
      target: { entityType: "student", entityId: roll, details: existing.name },
      changes: { previous: existing, current: null },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: `Student ${roll} permanently removed from database` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Attendance Sessions & Submissions (Granular Multi-Record Transactional Architecture)
router.get("/sessions", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.ATTENDANCE_SESSIONS);
    const { section, date } = req.query;
    const filter = {};
    if (section && section !== "ALL") filter.section = section;
    if (date) filter.date = date;

    const sessions = await coll.find(filter).sort({ timestamp: -1, date: -1 }).toArray();
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.ATTENDANCE_SESSIONS);
    const session = await coll.findOne({ id: req.params.id });
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    // Retrieve individual student records
    const recordsColl = getCollection(COLLECTIONS.ATTENDANCE_RECORDS);
    const individualRecords = await recordsColl.find({ sessionId: req.params.id }).toArray();

    res.json({ success: true, data: { ...session, individualRecords } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/sessions", async (req, res) => {
  const sessionData = req.body;
  if (!sessionData.date || !sessionData.attendance) {
    return res.status(400).json({ success: false, error: "Missing required attendance session payload" });
  }

  const sessionId = sessionData.id || `session_${Date.now()}`;
  const timestamp = sessionData.timestamp || new Date().toISOString();
  const sectionNum = sessionData.sectionNum || parseInt(String(sessionData.section).replace(/\D/g, "") || "1", 10);
  const facultyName = sessionData.facultyName || "CSE Faculty";
  const facultyId = sessionData.facultyId || `fac_${facultyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const subject = sessionData.subject || "Academic Class";
  const period = sessionData.period || "1";

  try {
    const sessionsColl = getCollection(COLLECTIONS.ATTENDANCE_SESSIONS);
    const submissionsColl = getCollection(COLLECTIONS.ATTENDANCE_SUBMISSIONS);
    const recordsColl = getCollection(COLLECTIONS.ATTENDANCE_RECORDS);

    // Calculate Counts
    const attendanceMap = sessionData.attendance || {};
    const totalCount = Object.keys(attendanceMap).length;
    let absentCount = 0;
    const absentRolls = [];

    for (const [r, stat] of Object.entries(attendanceMap)) {
      if (stat === "absent") {
        absentCount++;
        absentRolls.push(r);
      }
    }

    const presentCount = totalCount - absentCount;
    const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : "100.0";

    const sessionDoc = {
      ...sessionData,
      id: sessionId,
      sessionId,
      date: sessionData.date,
      period,
      subject,
      section: sessionData.section || `Section ${sectionNum}`,
      sectionNum,
      facultyId,
      facultyName,
      totalCount,
      presentCount,
      absentCount,
      percentage,
      absentRolls,
      timestamp,
      updatedAt: new Date()
    };

    // 1. Save Session
    await sessionsColl.updateOne(
      { id: sessionId },
      { $set: sessionDoc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // 2. Save Submission Audit Entry
    await submissionsColl.updateOne(
      { id: sessionId },
      {
        $set: {
          submissionId: `sub_${sessionId}`,
          sessionId,
          date: sessionData.date,
          period,
          subject,
          section: sessionData.section,
          sectionNum,
          facultyId,
          facultyName,
          totalStudents: totalCount,
          presentCount,
          absentCount,
          percentage,
          absentRolls,
          version: 1,
          status: "SUBMITTED",
          timestamp,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    // 3. Save Individual Student Records
    for (const [r, stat] of Object.entries(attendanceMap)) {
      await recordsColl.updateOne(
        { sessionId, studentRoll: r },
        {
          $set: {
            sessionId,
            studentRoll: r,
            status: stat,
            date: sessionData.date,
            period,
            sectionNum,
            subject,
            markedBy: facultyName,
            timestamp,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    }

    // 4. Record Global Audit Log
    await recordAuditEvent({
      eventType: "ATTENDANCE_SUBMITTED",
      module: "attendance",
      actor: { userId: facultyId, name: facultyName, role: "faculty" },
      target: { entityType: "attendance_session", entityId: sessionId, details: `Sec ${sectionNum} Period ${period} (${subject})` },
      changes: { previous: null, current: { present: presentCount, absent: absentCount, percentage } },
      metadata: { absentRolls, totalStudents: totalCount },
      ip: getClientIp(req)
    });

    res.json({
      success: true,
      message: "Attendance session and student records committed to MongoDB successfully",
      data: sessionDoc
    });
  } catch (err) {
    console.error("[API Error] /sessions POST:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  const sessionId = req.params.id;
  try {
    const sessionsColl = getCollection(COLLECTIONS.ATTENDANCE_SESSIONS);
    const existing = await sessionsColl.findOne({ id: sessionId });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Session not found to delete" });
    }

    await sessionsColl.deleteOne({ id: sessionId });

    // Also record deletion in audit log with preserved history
    await recordAuditEvent({
      eventType: "ATTENDANCE_SESSION_DELETED",
      module: "attendance",
      actor: { userId: "admin", name: "Administrator", role: "admin" },
      target: { entityType: "attendance_session", entityId: sessionId, details: existing.section },
      changes: { previous: existing, current: null },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: `Attendance session ${sessionId} deleted and archived in audit log` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Aggregate Stats Overview
router.get("/stats/overview", async (req, res) => {
  try {
    const sessionsColl = getCollection(COLLECTIONS.ATTENDANCE_SESSIONS);
    const studentsColl = getCollection(COLLECTIONS.STUDENTS);

    const sessions = await sessionsColl.find({}).toArray();
    const studentCount = await studentsColl.countDocuments();

    let totalPercentages = 0;
    let totalAbsentees = 0;

    sessions.forEach((s) => {
      totalPercentages += Number(s.percentage) || 0;
      totalAbsentees += Number(s.absentCount) || 0;
    });

    const avgAttendance = sessions.length > 0 ? (totalPercentages / sessions.length).toFixed(1) : "0.0";

    res.json({
      success: true,
      totalSessions: sessions.length,
      totalStudents: studentCount,
      avgAttendance: Number(avgAttendance),
      totalAbsentees,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Faculty Directory, Search & Timetables
router.get("/faculty/search", async (req, res) => {
  const { q, name, id, department, subject, cabin, limit = 50, page = 1 } = req.query;
  const numLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
  const numPage = Math.max(parseInt(String(page), 10) || 1, 1);
  const skip = (numPage - 1) * numLimit;

  const escapeRegex = (str) => String(str).trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

  try {
    const coll = getCollection(COLLECTIONS.FACULTY);
    let mongoQuery = {};
    const conditions = [];

    if (id && String(id).trim()) {
      conditions.push({ id: { $regex: escapeRegex(id), $options: "i" } });
    }
    if (name && String(name).trim()) {
      conditions.push({ name: { $regex: escapeRegex(name), $options: "i" } });
    }
    if (department && department !== "ALL" && String(department).trim()) {
      conditions.push({ department: { $regex: escapeRegex(department), $options: "i" } });
    }
    if (subject && subject !== "ALL" && String(subject).trim()) {
      const escapedSub = escapeRegex(subject);
      conditions.push({
        $or: [
          { subjects: { $elemMatch: { $regex: escapedSub, $options: "i" } } },
          { subjects: { $regex: escapedSub, $options: "i" } }
        ]
      });
    }
    if (cabin && String(cabin).trim()) {
      conditions.push({ cabin: { $regex: escapeRegex(cabin), $options: "i" } });
    }
    if (q && String(q).trim()) {
      const escapedQ = escapeRegex(q);
      conditions.push({
        $or: [
          { name: { $regex: escapedQ, $options: "i" } },
          { id: { $regex: escapedQ, $options: "i" } },
          { cabin: { $regex: escapedQ, $options: "i" } },
          { department: { $regex: escapedQ, $options: "i" } },
          { subjects: { $elemMatch: { $regex: escapedQ, $options: "i" } } },
          { subjects: { $regex: escapedQ, $options: "i" } },
          { sections: { $elemMatch: { $regex: escapedQ, $options: "i" } } },
          { sections: { $regex: escapedQ, $options: "i" } }
        ]
      });
    }

    if (conditions.length > 0) {
      mongoQuery = conditions.length === 1 ? conditions[0] : { $and: conditions };
    }

    let results = [];
    let totalCount = 0;

    if (coll) {
      try {
        totalCount = await coll.countDocuments(mongoQuery);
        results = await coll
          .find(mongoQuery)
          .sort({ name: 1 })
          .skip(skip)
          .limit(numLimit)
          .toArray();
      } catch (dbErr) {
        console.warn("[Faculty Search DB Query Warning]:", dbErr.message);
      }
    }

    // High-performance fallback: in-memory directory from timetable & faculty mappings
    if (results.length === 0 && totalCount === 0) {
      const fallbackList = getAllFacultyDirectory();
      const qLower = (q || "").toLowerCase().trim();
      const nameLower = (name || "").toLowerCase().trim();
      const idLower = (id || "").toLowerCase().trim();
      const deptLower = (department && department !== "ALL" ? department : "").toLowerCase().trim();
      const subLower = (subject && subject !== "ALL" ? subject : "").toLowerCase().trim();
      const cabinLower = (cabin || "").toLowerCase().trim();

      const filtered = fallbackList.filter((fac) => {
        if (idLower && !fac.id.toLowerCase().includes(idLower)) return false;
        if (nameLower && !fac.name.toLowerCase().includes(nameLower)) return false;
        if (deptLower && !fac.department.toLowerCase().includes(deptLower)) return false;
        if (subLower && !fac.subjectsList?.some((s) => s.toLowerCase().includes(subLower))) return false;
        if (cabinLower && !fac.cabin.toLowerCase().includes(cabinLower)) return false;
        if (qLower) {
          const matchQ =
            fac.name.toLowerCase().includes(qLower) ||
            fac.id.toLowerCase().includes(qLower) ||
            fac.cabin.toLowerCase().includes(qLower) ||
            fac.department.toLowerCase().includes(qLower) ||
            fac.subjectsList?.some((s) => s.toLowerCase().includes(qLower)) ||
            fac.sectionsList?.some((sec) => sec.toLowerCase().includes(qLower));
          if (!matchQ) return false;
        }
        return true;
      });

      totalCount = filtered.length;
      results = filtered.slice(skip, skip + numLimit);
    }

    // Sanitize records for public safety: exclude private passwords/hashes
    const sanitized = results.map((f) => ({
      id: f.id,
      name: f.name,
      cabin: f.cabin,
      phone: f.phone || "+91 98480 12345",
      department: f.department || "Computer Science & Engineering (CSE)",
      designation: f.designation || (f.name?.startsWith("Dr.") ? "Associate Professor" : "Assistant Professor"),
      subjects: Array.isArray(f.subjects) && f.subjects.length > 0 ? f.subjects : (Array.isArray(f.subjectsList) ? f.subjectsList : []),
      sections: Array.isArray(f.sections) && f.sections.length > 0 ? f.sections : (Array.isArray(f.sectionsList) ? f.sectionsList : []),
      sectionNums: Array.isArray(f.sectionNums) && f.sectionNums.length > 0 ? f.sectionNums : (Array.isArray(f.sectionNumsList) ? f.sectionNumsList : []),
      isClassTeacher: Boolean(f.isClassTeacher),
      isCounsellor: Boolean(f.isCounsellor),
      schedule: f.schedule || {},
      liveGps: facultyGpsStore.get(f.id) || getSimulatedFacultyGPS(f.id, f.name, f.cabin)
    }));

    // Record audit / search activity asynchronously in MongoDB
    try {
      const searchColl = getCollection(COLLECTIONS.SEARCH_ACTIVITY);
      if (searchColl && (q || name || id || subject)) {
        await searchColl.insertOne({
          type: "FACULTY_SEARCH",
          query: { q, name, id, department, subject, cabin },
          resultsCount: totalCount,
          clientIp: getClientIp(req),
          timestamp: new Date()
        });
      }
    } catch (e) {}

    res.json({
      success: true,
      query: { q: q || "", name: name || "", id: id || "", department: department || "ALL", subject: subject || "ALL" },
      page: numPage,
      limit: numLimit,
      total: totalCount,
      count: sanitized.length,
      data: sanitized
    });
  } catch (err) {
    console.error("[Faculty Search API Error]:", err);
    res.status(500).json({ success: false, error: "Internal database search error: " + err.message });
  }
});

router.get("/faculty/departments", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.FACULTY);
    let departments = [];
    if (coll) {
      try {
        departments = await coll.distinct("department");
      } catch (e) {}
    }
    if (!departments || departments.length === 0) {
      departments = ["Computer Science & Engineering (CSE)"];
    }
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.json({ success: true, count: 1, data: ["Computer Science & Engineering (CSE)"] });
  }
});

router.get("/faculty/subjects", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.FACULTY);
    let subjects = [];
    if (coll) {
      try {
        subjects = await coll.distinct("subjects");
      } catch (e) {}
    }
    if (!subjects || subjects.length === 0) {
      const facs = getAllFacultyDirectory();
      const set = new Set();
      facs.forEach((f) => f.subjectsList?.forEach((s) => set.add(s)));
      subjects = Array.from(set).sort();
    }
    res.json({ success: true, count: subjects.length, data: subjects.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GPS Mobile Beacon & Geofence Endpoints
router.post("/faculty/location/ping", async (req, res) => {
  const { facultyId, latitude, longitude, accuracy = 10 } = req.body;
  if (!facultyId || typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ success: false, error: "Missing facultyId, latitude, or longitude" });
  }
  const resolved = resolveCampusLocation(latitude, longitude, accuracy);
  const locationDoc = {
    facultyId,
    latitude,
    longitude,
    accuracy,
    ...resolved,
    timestamp: new Date().toISOString()
  };
  facultyGpsStore.set(facultyId, locationDoc);
  res.json({ success: true, data: locationDoc });
});

router.get("/faculty/:id/live-gps", async (req, res) => {
  const facId = req.params.id;
  const fac = getAllFacultyDirectory().find((f) => f.id === facId);
  if (!fac) {
    return res.status(404).json({ success: false, error: "Faculty not found" });
  }
  const gps = facultyGpsStore.get(facId) || getSimulatedFacultyGPS(fac.id, fac.name, fac.cabin);
  res.json({ success: true, data: gps });
});

router.get("/faculty/locations/campus-radar", async (req, res) => {
  const all = getAllFacultyDirectory().map((f) => {
    const gps = facultyGpsStore.get(f.id) || getSimulatedFacultyGPS(f.id, f.name, f.cabin);
    return {
      id: f.id,
      name: f.name,
      cabin: f.cabin,
      department: f.department,
      phone: f.phone,
      liveGps: gps
    };
  });
  res.json({ success: true, buildings: VFSTR_BUILDINGS, count: all.length, data: all });
});

// =========================================================================
// PHASE 10: ROLE-BASED LIVE LOCATION & MAP INTEGRATION APIS
// =========================================================================

// 1. Start explicit location sharing
router.post("/location/share/start", async (req, res) => {
  try {
    const { userId, role, name, consentVersion = "v2.4" } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ success: false, error: "userId and role are required." });
    }

    const perm = await setLocationPermission(userId, role, true);
    await logConsentHistory(userId, role, "ENABLED", consentVersion);

    res.json({
      success: true,
      message: "Live location sharing activated successfully.",
      data: perm
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Stop location sharing
router.post("/location/share/stop", async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required." });
    }

    const perm = await setLocationPermission(userId, role || "student", false);
    await logConsentHistory(userId, role || "student", "DISABLED");

    res.json({
      success: true,
      message: "Live location sharing stopped immediately.",
      data: perm
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Receive genuine GPS location update from device (watchPosition / interval)
router.post("/location/update", async (req, res) => {
  try {
    const { userId, role = "student", name, latitude, longitude, accuracy } = req.body;
    if (!userId || typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: userId, latitude (number), longitude (number)."
      });
    }

    // Verify user has enabled location sharing
    const perm = await getLocationPermission(userId);
    if (!perm.isEnabled) {
      return res.status(403).json({
        success: false,
        error: "Location sharing is not enabled for this user. Please enable sharing first."
      });
    }

    const updated = await updateLiveLocation(userId, role, name, { latitude, longitude, accuracy }, true);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get own location & permission status
router.get("/location/me", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: "userId query parameter required." });
  }
  const perm = await getLocationPermission(userId);
  res.json({ success: true, data: perm });
});

// 5. Query sharing status
router.get("/location/sharing-status", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: "userId required." });
  const perm = await getLocationPermission(userId);
  res.json({ success: true, userId, isSharing: Boolean(perm?.isEnabled), updatedAt: perm?.updatedAt });
});

// 6. Query permissions
router.get("/location/permissions", async (req, res) => {
  const { userId } = req.query;
  const perm = await getLocationPermission(userId);
  res.json({ success: true, data: perm });
});

// 7. Scoped Student Search for Attendance & Counsellor Roles
router.get("/location/students", async (req, res) => {
  try {
    const { viewerRole = "faculty", viewerId, viewerName, q, section, counsellor } = req.query;

    // Strict Privacy: Student role can NEVER search or view other students' locations (Phase 3)
    if (viewerRole === "student") {
      return res.status(403).json({
        success: false,
        error: "Privacy Policy Violation: Students are strictly prohibited from viewing or searching other students' locations."
      });
    }

    let filtered = ALL_STUDENTS;

    // Attendance Role: Filter only authorized sections
    if (viewerRole === "faculty" && section && section !== "ALL") {
      const sNum = parseInt(String(section).replace(/\D/g, ""), 10);
      filtered = filtered.filter((s) => s.sectionNum === sNum);
    }

    // Counsellor Role: Filter assigned counselees only
    if (viewerRole === "counsellor" && (viewerName || counsellor)) {
      const cName = counsellor || viewerName;
      filtered = filtered.filter(
        (s) => s.counsellor && s.counsellor.toLowerCase().includes(cName.toLowerCase())
      );
    }

    // Text search by name, roll, student ID, registration number
    if (q && q.trim()) {
      const qLower = q.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(qLower) ||
          s.roll.toLowerCase().includes(qLower) ||
          (s.id && s.id.toLowerCase().includes(qLower)) ||
          (s.section && s.section.toLowerCase().includes(qLower))
      );
    }

    // Attach location sharing status indicator
    const enriched = await Promise.all(
      filtered.slice(0, 50).map(async (st) => {
        const perm = await getLocationPermission(st.roll);
        return {
          id: st.id || st.roll,
          roll: st.roll,
          name: st.name,
          section: st.section,
          sectionNum: st.sectionNum,
          counsellor: st.counsellor,
          isSharingLocation: Boolean(perm?.isEnabled)
        };
      })
    );

    res.json({ success: true, count: enriched.length, total: filtered.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Retrieve Specific Student Location with Full Authorization Check
router.get("/location/students/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const {
      viewerId = "faculty",
      viewerRole = "faculty",
      viewerName = "Faculty Member",
      section,
      counsellorName
    } = req.query;

    // Strict Privacy Boundary
    if (viewerRole === "student") {
      return res.status(403).json({
        success: false,
        error: "Privacy Restriction: Students cannot view other students' locations."
      });
    }

    // Construct viewer object
    const viewerUser = {
      id: viewerId,
      role: viewerRole,
      name: viewerName,
      section: section || "Section 1",
      sectionNum: parseInt(String(section || "1").replace(/\D/g, ""), 10) || 1,
      counsellorName: counsellorName || viewerName
    };

    let result;
    if (viewerRole === "counsellor") {
      result = await getStudentLocationForCounsellor(viewerUser, studentId, ALL_STUDENTS);
    } else {
      result = await getStudentLocationForFaculty(viewerUser, studentId, ALL_STUDENTS);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Authorized Faculty Directory for Student & Counsellor Roles
router.get("/location/faculty", async (req, res) => {
  try {
    const { q, department, subject } = req.query;
    const allFacs = getAllFacultyDirectory();

    let filtered = allFacs;
    if (q && q.trim()) {
      const qLower = q.toLowerCase().trim();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(qLower) ||
          f.id.toLowerCase().includes(qLower) ||
          f.cabin.toLowerCase().includes(qLower) ||
          f.department.toLowerCase().includes(qLower) ||
          f.subjectsList?.some((s) => s.toLowerCase().includes(qLower))
      );
    }
    if (department && department !== "ALL") {
      filtered = filtered.filter((f) => f.department.toLowerCase().includes(department.toLowerCase()));
    }
    if (subject && subject !== "ALL") {
      filtered = filtered.filter((f) => f.subjectsList?.some((s) => s.toLowerCase().includes(subject.toLowerCase())));
    }

    const sanitized = await Promise.all(
      filtered.slice(0, 100).map(async (f) => {
        const perm = await getLocationPermission(f.id);
        return {
          id: f.id,
          name: f.name,
          cabin: f.cabin,
          department: f.department,
          designation: f.designation || (f.name?.startsWith("Dr.") ? "Associate Professor" : "Assistant Professor"),
          subjects: f.subjects || f.subjectsList || [],
          sections: f.sections || f.sectionsList || [],
          phone: f.phone,
          isSharingLocation: perm?.isEnabled !== false
        };
      })
    );

    res.json({ success: true, count: sanitized.length, total: filtered.length, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Retrieve Specific Faculty Location (Students & Counsellors)
router.get("/location/faculty/:facultyId", async (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    const { viewerId = "student", viewerRole = "student", viewerName = "Student" } = req.query;

    const viewerUser = { id: viewerId, role: viewerRole, name: viewerName };
    const allFacs = getAllFacultyDirectory();
    const result = await getFacultyLocationForViewer(viewerUser, facultyId, allFacs);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Counsellor Assigned Students endpoint
router.get("/location/counsellor/assigned-students", (req, res) => {
  const { counsellorName = "Mr. Gujjula Murali" } = req.query;
  const assigned = ALL_STUDENTS.filter(
    (s) => s.counsellor && s.counsellor.toLowerCase().includes(counsellorName.toLowerCase())
  );
  res.json({ success: true, count: assigned.length, data: assigned });
});

// 12. Faculty Assigned Sections endpoint
router.get("/location/faculty/assigned-sections", (req, res) => {
  const { facultyId } = req.query;
  const fac = getAllFacultyDirectory().find((f) => f.id === facultyId);
  const sections = fac ? fac.sectionsList || ["Section 1"] : ["Section 1"];
  res.json({ success: true, facultyId, sections });
});

// 13. Location Access Audit History (Phase 9 & Admin)
router.get("/location/access-history", async (req, res) => {
  try {
    const data = await getAdminLocationAuditData();
    res.json({ success: true, count: data.accessLogs.length, data: data.accessLogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Admin Overview (Phase 4)
router.get("/location/admin/overview", async (req, res) => {
  try {
    const data = await getAdminLocationAuditData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/faculty/:id", async (req, res) => {
  const facId = req.params.id;
  try {
    const coll = getCollection(COLLECTIONS.FACULTY);
    let fac = null;
    if (coll) {
      try {
        fac = await coll.findOne({ id: facId });
      } catch (e) {}
    }
    if (!fac) {
      fac = getAllFacultyDirectory().find((f) => f.id === facId);
    }
    if (!fac) {
      return res.status(404).json({ success: false, error: `Faculty with ID '${facId}' not found.` });
    }
    res.json({ success: true, data: fac });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/faculty", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.FACULTY);
    const list = await coll.find({}).sort({ name: 1 }).toArray();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/faculty", async (req, res) => {
  const contacts = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ success: false, error: "Expected an array of contacts" });
  }

  try {
    const coll = getCollection(COLLECTIONS.FACULTY);
    for (const c of contacts) {
      if (c.name) {
        await coll.updateOne(
          { name: c.name },
          { $set: { ...c, updatedAt: new Date() } },
          { upsert: true }
        );
      }
    }
    res.json({ success: true, message: "Faculty contacts updated in MongoDB", count: contacts.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Absent Notifications & Synced Student Mailbox
router.post("/notifications/absent", async (req, res) => {
  const { studentRoll, studentName, date, period, subject, section, facultyName, facultyPhone } = req.body;
  if (!studentRoll) {
    return res.status(400).json({ success: false, error: "Missing studentRoll parameter" });
  }

  const rollUpper = studentRoll.toUpperCase().trim();
  const rollLower = studentRoll.toLowerCase().trim();
  const recipientEmail = `vu.${rollLower}@gmail.com`;
  const officialEmail = `${rollLower}@vignan.ac.in`;

  const notificationDoc = {
    notificationId: `notif_${Date.now()}_${rollUpper}`,
    studentRoll: rollUpper,
    studentName: studentName || rollUpper,
    recipientEmail,
    officialEmail,
    date: date || new Date().toISOString().split("T")[0],
    period: period || "Period 1",
    subject: subject || "Academic Course",
    section: section || "Section 1",
    facultyName: facultyName || "Faculty Member",
    facultyPhone: facultyPhone || "+919000443503",
    status: "DELIVERED",
    isRead: false,
    timestamp: new Date().toISOString()
  };

  try {
    const inboxColl = getCollection(COLLECTIONS.SYNCED_INBOXES);
    await inboxColl.insertOne(notificationDoc);

    const deliveryColl = getCollection(COLLECTIONS.NOTIFICATION_DELIVERY_LOGS);
    await deliveryColl.insertOne({
      ...notificationDoc,
      channel: "EMAIL",
      deliveryResult: "SUCCESS",
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: `Absence alert delivered and stored in MongoDB mailbox for ${rollUpper}`,
      data: notificationDoc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/notifications/mailbox/:roll", async (req, res) => {
  const rollUpper = req.params.roll.toUpperCase().trim();
  try {
    const inboxColl = getCollection(COLLECTIONS.SYNCED_INBOXES);
    const messages = await inboxColl.find({ studentRoll: rollUpper }).sort({ timestamp: -1 }).toArray();
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/notifications/mailbox/read", async (req, res) => {
  const { studentRoll, notificationId } = req.body;
  try {
    const inboxColl = getCollection(COLLECTIONS.SYNCED_INBOXES);
    const filter = notificationId ? { notificationId } : { studentRoll: studentRoll?.toUpperCase().trim() };
    await inboxColl.updateMany(filter, { $set: { isRead: true, readAt: new Date().toISOString() } });
    res.json({ success: true, message: "Notifications marked as read in MongoDB" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. On-Duty (OD) Exemption & Counsellor Management
router.get("/od-applications", async (req, res) => {
  const { counsellor, studentRoll, status } = req.query;
  const filter = {};

  if (counsellor && counsellor !== "ALL") {
    filter.counsellorName = { $regex: counsellor.trim(), $options: "i" };
  }
  if (studentRoll) {
    filter.studentRoll = studentRoll.toUpperCase().trim();
  }
  if (status && status !== "ALL") {
    filter.status = status;
  }

  try {
    const coll = getCollection(COLLECTIONS.OD_APPLICATIONS);
    const list = await coll.find(filter).sort({ submittedAt: -1 }).toArray();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/od-applications", async (req, res) => {
  const {
    studentRoll,
    studentName,
    studentSection,
    sectionNum,
    counsellorName,
    date,
    reason,
    description = "",
    periods = "All Scheduled Periods",
    documentData,
    documentName,
    documentType
  } = req.body;

  if (!studentRoll || !date || !reason) {
    return res.status(400).json({ success: false, error: "Student roll, event date, and reason are required" });
  }

  const rollUpper = studentRoll.toUpperCase().trim();
  const id = req.body.id || `od_${Date.now()}_${rollUpper}`;

  // If document payload included, store through file storage service
  let fileRef = null;
  if (documentData && documentData.startsWith("data:")) {
    try {
      const matches = documentData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        fileRef = await storeFile({
          originalName: documentName || `${rollUpper}_OD_Proof.pdf`,
          buffer,
          mimeType,
          module: "counsellor_od",
          uploader: { userId: rollUpper, name: studentName, role: "student" },
          relatedRecordId: id,
          category: "od_documents"
        });
      }
    } catch (e) {
      console.warn("[OD Document Storage Warning]:", e.message);
    }
  }

  const odDoc = {
    id,
    studentRoll: rollUpper,
    studentName: studentName || rollUpper,
    studentSection: studentSection || `Section ${sectionNum || 1}`,
    sectionNum: Number(sectionNum) || 1,
    counsellorName: counsellorName || "Designated Counsellor",
    date,
    reason,
    description,
    periods,
    status: req.body.status || "Pending Counsellor Review",
    submittedAt: req.body.submittedAt || new Date().toISOString(),
    documentData: documentData || null,
    documentName: documentName || null,
    documentType: documentType || null,
    fileId: fileRef ? fileRef.fileId : null,
    isReadByCounsellor: false,
    counsellorRemarks: "",
    reviewedAt: null,
    updatedAt: new Date()
  };

  try {
    const coll = getCollection(COLLECTIONS.OD_APPLICATIONS);
    await coll.insertOne(odDoc);

    // Audit Event
    await recordAuditEvent({
      eventType: "OD_APPLICATION_SUBMITTED",
      module: "counsellor",
      actor: { userId: rollUpper, name: studentName || rollUpper, role: "student" },
      target: { entityType: "od_application", entityId: id, details: `${date} - ${reason}` },
      changes: { previous: null, current: odDoc },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: "OD application recorded in MongoDB", data: odDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/od-applications/:id", async (req, res) => {
  const { id } = req.params;
  const { status, counsellorRemarks, reviewedBy } = req.body;

  try {
    const coll = getCollection(COLLECTIONS.OD_APPLICATIONS);
    const existing = await coll.findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, error: "OD application not found" });
    }

    const updated = {
      ...existing,
      status: status || existing.status,
      counsellorRemarks: counsellorRemarks !== undefined ? counsellorRemarks : existing.counsellorRemarks,
      reviewedAt: new Date().toISOString(),
      isReadByCounsellor: true,
      reviewedBy: reviewedBy || "Faculty Counsellor"
    };

    await coll.updateOne({ id }, { $set: updated });

    // Audit Event
    await recordAuditEvent({
      eventType: "OD_APPLICATION_REVIEWED",
      module: "counsellor",
      actor: { userId: reviewedBy || "counsellor", name: "Faculty Counsellor", role: "counsellor" },
      target: { entityType: "od_application", entityId: id, details: `New status: ${updated.status}` },
      changes: { previous: existing.status, current: updated.status },
      metadata: { remarks: updated.counsellorRemarks },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: `OD status updated to ${updated.status}`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Calendar Notes & Reminders
router.get("/calendar/notes", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.CALENDAR_NOTES);
    const notes = await coll.find({}).sort({ updatedAt: -1 }).toArray();
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/calendar/notes", async (req, res) => {
  const { date, note, author } = req.body;
  if (!date) return res.status(400).json({ success: false, error: "Date is required" });

  try {
    const coll = getCollection(COLLECTIONS.CALENDAR_NOTES);
    const noteDoc = {
      date,
      note,
      author: author || "Faculty User",
      updatedAt: new Date().toISOString()
    };

    await coll.updateOne({ date }, { $set: noteDoc }, { upsert: true });

    await recordAuditEvent({
      eventType: "CALENDAR_NOTE_SAVED",
      module: "academic_calendar",
      actor: { userId: author || "faculty", role: "faculty" },
      target: { entityType: "calendar_note", entityId: date },
      changes: { note },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: "Calendar note recorded in MongoDB", data: noteDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Authentication & Security Tracking (Login / Logout / Active Sessions)
router.post("/auth/google/mock-demo", async (req, res) => {
  const { accountType = "faculty", fName = "Mr. Adnan Ahmad Khan", studentRoll = "241FA04035" } = req.body;
  let demoUser = null;

  if (accountType === "admin") {
    demoUser = {
      role: "admin",
      id: "admin_dean_cse",
      name: "Dr. K. Venkateswara Rao (HOD & Dean CSE)",
      email: "hod_cse@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
      department: "Computer Science & Engineering",
      authProvider: "google"
    };
  } else if (accountType === "faculty") {
    demoUser = {
      role: "faculty",
      facultyMode: "attendance",
      id: "fac_sivaprasad",
      name: fName || "Dr. P. Siva Prasad",
      email: "faculty@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      section: "Section 1",
      sectionNum: 1,
      department: "Computer Science & Engineering",
      authProvider: "google"
    };
  } else if (accountType === "counsellor") {
    demoUser = {
      role: "counsellor",
      facultyMode: "counselling",
      id: "couns_gmurali",
      name: `${fName} (Faculty Counsellor)`,
      counsellorName: fName,
      email: "gmurali@vignan.ac.in",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      section: "Section 1",
      sectionNum: 1,
      department: "Computer Science & Engineering",
      authProvider: "google"
    };
  } else if (accountType === "student") {
    const queryRoll = (studentRoll || "241FA04035").toUpperCase().trim();
    const studentsColl = getCollection(COLLECTIONS.STUDENTS);
    const student = await studentsColl.findOne({ roll: queryRoll }) || {
      roll: queryRoll,
      name: "BONDILI DEVI RAGHUVEERA BAI",
      section: "Section 1",
      sectionNum: 1
    };

    demoUser = {
      role: "student",
      id: student.roll,
      roll: student.roll,
      name: student.name,
      email: `vu.${student.roll.toLowerCase()}@gmail.com`,
      officialEmail: `${student.roll.toLowerCase()}@vignan.ac.in`,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      section: student.section,
      sectionNum: student.sectionNum || 1,
      counsellor: student.counsellor,
      room: `Room N-40${((student.sectionNum || 1) % 10) + 1}`,
      semester: "III Year - 5th Semester",
      department: "Computer Science & Engineering",
      authProvider: "google"
    };
  } else if (accountType === "unauthorized") {
    // Record security event
    await getCollection(COLLECTIONS.SECURITY_EVENTS).insertOne({
      eventType: "UNAUTHORIZED_LOGIN_ATTEMPT",
      email: "unauthorized.guest@gmail.com",
      ip: getClientIp(req),
      timestamp: new Date().toISOString()
    });

    return res.status(403).json({
      success: false,
      unauthorized: true,
      error: `Access Denied: The Google account "unauthorized.guest@gmail.com" is not authorized. Access is strictly restricted to authorized Faculty and Administrators. Please contact the administrator (admin@vignan.ac.in).`,
      email: "unauthorized.guest@gmail.com"
    });
  }

  // Record Login Event in MongoDB
  try {
    const loginHistoryColl = getCollection(COLLECTIONS.LOGIN_HISTORY);
    await loginHistoryColl.insertOne({
      userId: demoUser.id,
      name: demoUser.name,
      role: demoUser.role,
      email: demoUser.email,
      provider: "google",
      ip: getClientIp(req),
      timestamp: new Date().toISOString()
    });

    // Upsert User Profile
    const usersColl = getCollection(COLLECTIONS.USERS);
    await usersColl.updateOne(
      { userId: demoUser.id },
      { $set: { ...demoUser, lastLoginAt: new Date().toISOString() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // Audit Event
    await recordAuditEvent({
      eventType: "USER_LOGIN",
      module: "authentication",
      actor: { userId: demoUser.id, name: demoUser.name, role: demoUser.role, email: demoUser.email },
      target: { entityType: "session", entityId: demoUser.id },
      ip: getClientIp(req)
    });
  } catch (e) {
    console.warn("[Auth Logging Warning]:", e.message);
  }

  res.json({
    success: true,
    message: `Signed in with Google as ${demoUser.name} (${demoUser.role.toUpperCase()})`,
    user: demoUser,
    token: `demo_google_token_${Date.now()}`
  });
});

router.post("/auth/login", async (req, res) => {
  const { user, provider = "credentials" } = req.body;
  if (!user || (!user.id && !user.roll && !user.name)) {
    return res.status(400).json({ success: false, error: "Missing user object in login payload" });
  }

  const userId = user.id || user.roll || user.email || "user";
  const userName = user.name || user.roll || "Authenticated User";
  const userRole = user.role || "student";
  const userEmail = user.email || `${String(userId).toLowerCase()}@vignan.ac.in`;
  const timestamp = new Date().toISOString();
  const ip = getClientIp(req);

  try {
    // 1. Record in login_history
    const loginHistoryColl = getCollection(COLLECTIONS.LOGIN_HISTORY);
    const loginRecord = {
      userId,
      name: userName,
      role: userRole,
      email: userEmail,
      provider: user.authProvider || provider,
      section: user.section || null,
      sectionNum: user.sectionNum || null,
      ip,
      userAgent: req.headers["user-agent"] || "Browser Client",
      timestamp,
      createdAt: new Date()
    };
    await loginHistoryColl.insertOne(loginRecord);

    // 2. Upsert in users collection
    const usersColl = getCollection(COLLECTIONS.USERS);
    await usersColl.updateOne(
      { userId },
      {
        $set: {
          ...user,
          userId,
          name: userName,
          role: userRole,
          email: userEmail,
          lastLoginAt: timestamp,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    // 3. Upsert active session
    const sessionsColl = getCollection(COLLECTIONS.ACTIVE_SESSIONS);
    await sessionsColl.updateOne(
      { userId },
      {
        $set: {
          userId,
          role: userRole,
          name: userName,
          email: userEmail,
          ip,
          loginTimestamp: timestamp,
          lastActivityAt: timestamp
        }
      },
      { upsert: true }
    );

    // 4. Record Audit Event
    await recordAuditEvent({
      eventType: "USER_LOGIN",
      module: "authentication",
      actor: { userId, name: userName, role: userRole, email: userEmail },
      target: { entityType: "session", entityId: userId },
      metadata: { provider: user.authProvider || provider, ip },
      ip
    });

    console.log(`[Auth Service] Recorded login in MongoDB for ${userName} (${userRole}) [${userId}]`);
    res.json({ success: true, message: "Login recorded in MongoDB", data: loginRecord });
  } catch (err) {
    console.error("[Auth Error] /auth/login:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/auth/login-history", async (req, res) => {
  try {
    const { userId, role, limit = 50 } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (role && role !== "ALL") filter.role = role;

    const coll = getCollection(COLLECTIONS.LOGIN_HISTORY);
    const history = await coll.find(filter).sort({ timestamp: -1 }).limit(parseInt(String(limit), 10) || 50).toArray();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/auth/logout", async (req, res) => {
  const { userId, role, name } = req.body;
  try {
    const logoutColl = getCollection(COLLECTIONS.LOGOUT_HISTORY);
    await logoutColl.insertOne({
      userId: userId || "user",
      role: role || "unknown",
      name: name || "User",
      ip: getClientIp(req),
      timestamp: new Date().toISOString()
    });

    await recordAuditEvent({
      eventType: "USER_LOGOUT",
      module: "authentication",
      actor: { userId: userId || "user", name: name || "User", role: role || "unknown" },
      target: { entityType: "session", entityId: userId || "none" },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Complete Historical Data Retrieval & Audit APIs
router.get("/audit/logs", async (req, res) => {
  try {
    const result = await queryAuditLogs(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/audit/student/:roll", async (req, res) => {
  const roll = req.params.roll.toUpperCase().trim();
  try {
    const recordsColl = getCollection(COLLECTIONS.ATTENDANCE_RECORDS);
    const attendanceHistory = await recordsColl.find({ studentRoll: roll }).sort({ date: -1 }).toArray();

    const odColl = getCollection(COLLECTIONS.OD_APPLICATIONS);
    const odHistory = await odColl.find({ studentRoll: roll }).sort({ date: -1 }).toArray();

    const inboxColl = getCollection(COLLECTIONS.SYNCED_INBOXES);
    const mailbox = await inboxColl.find({ studentRoll: roll }).sort({ timestamp: -1 }).toArray();

    const studentsColl = getCollection(COLLECTIONS.STUDENTS);
    const profile = await studentsColl.findOne({ roll });

    res.json({
      success: true,
      roll,
      profile,
      attendanceRecordsCount: attendanceHistory.length,
      attendanceHistory,
      odApplications: odHistory,
      mailboxAlerts: mailbox
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/audit/faculty/:facultyId", async (req, res) => {
  const facultyId = req.params.facultyId;
  try {
    const submissionsColl = getCollection(COLLECTIONS.ATTENDANCE_SUBMISSIONS);
    const submissions = await submissionsColl.find({ facultyId }).sort({ date: -1 }).toArray();

    const auditColl = getCollection(COLLECTIONS.AUDIT_LOGS);
    const actions = await auditColl.find({ "actor.userId": facultyId }).sort({ timestamp: -1 }).limit(100).toArray();

    res.json({
      success: true,
      facultyId,
      submissionCount: submissions.length,
      submissions,
      actions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Search Activity Tracking
router.post("/search/record", async (req, res) => {
  const { category, query, filters, resultCount, userId, role } = req.body;
  try {
    const coll = getCollection(COLLECTIONS.SEARCH_ACTIVITY);
    const doc = {
      category: category || "GENERAL",
      query: query || "",
      filters: filters || {},
      resultCount: Number(resultCount) || 0,
      user: { userId: userId || "guest", role: role || "guest" },
      ip: getClientIp(req),
      timestamp: new Date().toISOString()
    };
    await coll.insertOne(doc);
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/search/history", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.SEARCH_ACTIVITY);
    const history = await coll.find({}).sort({ timestamp: -1 }).limit(50).toArray();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. File Storage & Report Generation APIs
router.post("/files/upload", async (req, res) => {
  const { originalName, base64Data, mimeType, module, category, uploader, relatedRecordId } = req.body;
  if (!base64Data || !originalName) {
    return res.status(400).json({ success: false, error: "originalName and base64Data are required" });
  }

  try {
    const cleanData = base64Data.replace(/^data:[A-Za-z-+\/]+;base64,/, "");
    const buffer = Buffer.from(cleanData, "base64");

    const fileDoc = await storeFile({
      originalName,
      buffer,
      mimeType: mimeType || "application/octet-stream",
      module: module || "uploads",
      category: category || "documents",
      uploader: uploader || {},
      relatedRecordId: relatedRecordId || ""
    });

    res.json({ success: true, message: "File stored successfully", data: fileDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/files", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.FILE_METADATA);
    const files = await coll.find({}).sort({ uploadedAt: -1 }).toArray();
    res.json({ success: true, count: files.length, data: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/files/:fileId", async (req, res) => {
  try {
    const coll = getCollection(COLLECTIONS.FILE_METADATA);
    const file = await coll.findOne({ fileId: req.params.fileId });
    if (!file || !fs.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    // Record download event
    await recordFileDownload({
      fileId: file.fileId,
      downloader: { userId: req.query.userId || "guest", role: req.query.role || "guest" },
      ip: getClientIp(req)
    });

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${file.originalName}"`);
    fs.createReadStream(file.filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Database Backup & Disaster Recovery APIs
router.post("/admin/backup", async (req, res) => {
  const { reason = "Manual Admin Backup" } = req.body;
  try {
    const manifest = await createDatabaseBackup({
      triggeredBy: { userId: "admin", role: "admin" },
      reason
    });

    await recordAuditEvent({
      eventType: "DATABASE_BACKUP_CREATED",
      module: "admin",
      actor: { userId: "admin", role: "admin", name: "Administrator" },
      target: { entityType: "database_backup", entityId: manifest.backupId },
      metadata: { totalDocuments: manifest.totalDocuments },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: "Database backup snapshot generated", data: manifest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/admin/backups", async (req, res) => {
  try {
    const backups = await listDatabaseBackups();
    res.json({ success: true, count: backups.length, data: backups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/admin/restore", async (req, res) => {
  const { backupId } = req.body;
  if (!backupId) return res.status(400).json({ success: false, error: "backupId is required" });

  try {
    const result = await restoreDatabaseBackup({
      backupId,
      adminUser: { userId: "admin", role: "admin" }
    });

    await recordAuditEvent({
      eventType: "DATABASE_BACKUP_RESTORED",
      module: "admin",
      actor: { userId: "admin", role: "admin", name: "Administrator" },
      target: { entityType: "database_backup", entityId: backupId },
      ip: getClientIp(req)
    });

    res.json({ success: true, message: "Database backup restored successfully", data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount router on both /api and root /
app.use("/api", router);
app.use("/", router);

export default app;
