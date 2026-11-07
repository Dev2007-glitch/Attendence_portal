/**
 * VFSTR CSE Attendance Portal V2.4
 * Role-Based Live Location Service & Access Controller (Phases 7, 8, 9)
 */

import { getCollection, getDb } from "./connection.js";
import { COLLECTIONS } from "./collections.js";
import { resolveCampusLocation } from "../../src/utils/campusGeofence.js";

// In-Memory Fast Fallback Stores (active when MongoDB is in offline mode)
const inMemoryLiveLocations = new Map();
const inMemoryPermissions = new Map();
const inMemoryAccessLogs = [];
const inMemoryConsentHistory = [];

/**
 * Checks if a location timestamp is genuinely fresh (< 5 mins), stale (5-15 mins), or expired (> 15 mins)
 */
export function evaluateLocationFreshness(timestamp) {
  if (!timestamp) return "UNAVAILABLE";
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageMins = ageMs / (1000 * 60);

  if (ageMins < 5) return "LIVE";
  if (ageMins <= 15) return "STALE";
  return "OFFLINE";
}

/**
 * Updates or stores a user's genuine live GPS location
 */
export async function updateLiveLocation(userId, role, name, { latitude, longitude, accuracy }, isSharing = true) {
  if (!userId || typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("Invalid GPS update payload: userId, latitude, and longitude are required.");
  }

  const now = new Date();
  const campusResolved = resolveCampusLocation(latitude, longitude, accuracy || 10);

  const locationDoc = {
    userId,
    role,
    name: name || userId,
    latitude,
    longitude,
    accuracy: Math.round(accuracy || 10),
    isSharing: Boolean(isSharing),
    ...campusResolved,
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000) // 1 Hour TTL
  };

  // Cache in memory
  inMemoryLiveLocations.set(userId, locationDoc);

  // Persist to MongoDB
  try {
    const coll = getCollection(COLLECTIONS.LIVE_LOCATIONS);
    if (coll) {
      await coll.updateOne(
        { userId },
        { $set: locationDoc },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("[LocationService DB Warning] Could not persist live location:", err.message);
  }

  return locationDoc;
}

/**
 * Sets user explicit location-sharing permission
 */
export async function setLocationPermission(userId, role, isEnabled, allowedViewers = ["authorized_roles"]) {
  const now = new Date();
  const permDoc = {
    userId,
    role,
    isEnabled: Boolean(isEnabled),
    allowedViewers,
    updatedAt: now.toISOString()
  };

  inMemoryPermissions.set(userId, permDoc);

  try {
    const coll = getCollection(COLLECTIONS.LOCATION_SHARING_PERMISSIONS);
    if (coll) {
      await coll.updateOne(
        { userId },
        { $set: permDoc },
        { upsert: true }
      );
    }
  } catch (e) {}

  // If stopping sharing, mark live location as inactive
  if (!isEnabled) {
    const existing = inMemoryLiveLocations.get(userId);
    if (existing) {
      existing.isSharing = false;
      existing.updatedAt = now.toISOString();
    }
    try {
      const liveColl = getCollection(COLLECTIONS.LIVE_LOCATIONS);
      if (liveColl) {
        await liveColl.updateOne({ userId }, { $set: { isSharing: false, updatedAt: now.toISOString() } });
      }
    } catch (e) {}
  }

  return permDoc;
}

/**
 * Retrieves a user's location sharing permission status
 */
export async function getLocationPermission(userId) {
  if (!userId) return { isEnabled: false };

  try {
    const coll = getCollection(COLLECTIONS.LOCATION_SHARING_PERMISSIONS);
    if (coll) {
      const doc = await coll.findOne({ userId });
      if (doc) return doc;
    }
  } catch (e) {}

  return inMemoryPermissions.get(userId) || { userId, isEnabled: false };
}

/**
 * Records an access audit event whenever someone views a shared location (Phase 9)
 */
export async function logLocationAccess({
  viewerId,
  viewerRole,
  viewerName,
  targetUserId,
  targetRole,
  purpose,
  result,
  details = ""
}) {
  const logDoc = {
    logId: `loclog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    viewerId: viewerId || "anonymous",
    viewerRole: viewerRole || "unknown",
    viewerName: viewerName || viewerId,
    targetUserId: targetUserId || "unknown",
    targetRole: targetRole || "unknown",
    purpose: purpose || "GENERAL_LOOKUP",
    result: result || "GRANTED", // "GRANTED" | "DENIED_UNAUTHORIZED" | "DENIED_NO_CONSENT" | "OFFLINE"
    details,
    timestamp: new Date().toISOString()
  };

  inMemoryAccessLogs.unshift(logDoc);
  if (inMemoryAccessLogs.length > 500) inMemoryAccessLogs.pop();

  try {
    const coll = getCollection(COLLECTIONS.LOCATION_ACCESS_LOGS);
    if (coll) {
      await coll.insertOne(logDoc);
    }
  } catch (e) {}

  return logDoc;
}

/**
 * Records consent change history (Phase 9)
 */
export async function logConsentHistory(userId, role, action, consentVersion = "v2.4") {
  const doc = {
    consentId: `cons_${Date.now()}`,
    userId,
    role,
    action, // "ENABLED" | "DISABLED" | "REVOKED"
    consentVersion,
    timestamp: new Date().toISOString()
  };

  inMemoryConsentHistory.unshift(doc);
  if (inMemoryConsentHistory.length > 500) inMemoryConsentHistory.pop();

  try {
    const coll = getCollection(COLLECTIONS.LOCATION_CONSENT_HISTORY);
    if (coll) {
      await coll.insertOne(doc);
    }
  } catch (e) {}

  return doc;
}

/**
 * Phase 1: Attendance Role Authorization Engine
 * Faculty can view ONLY students in their assigned sections/classes.
 */
export async function getStudentLocationForFaculty(facultyUser, targetStudentRoll, allStudents = []) {
  const student = allStudents.find((s) => s.roll === targetStudentRoll || s.id === targetStudentRoll);
  if (!student) {
    await logLocationAccess({
      viewerId: facultyUser.id || facultyUser.name,
      viewerRole: "faculty",
      viewerName: facultyUser.name,
      targetUserId: targetStudentRoll,
      targetRole: "student",
      purpose: "ATTENDANCE_VERIFICATION",
      result: "DENIED_UNAUTHORIZED",
      details: "Student record not found in university directory."
    });
    return {
      success: false,
      authorized: false,
      status: "UNAUTHORIZED",
      message: "Student record not found."
    };
  }

  // 1. Authorize: Check if faculty teaches student's section
  // Admin role bypasses section check, but faculty/counsellor must match assigned section
  const facultySectionNum = facultyUser.sectionNum || parseInt(String(facultyUser.section || "").replace(/\D/g, ""), 10);
  const studentSectionNum = student.sectionNum || parseInt(String(student.section || "").replace(/\D/g, ""), 10);

  // If faculty has designated assigned sections (e.g. [1, 18, 21])
  const assignedNums = facultyUser.sectionNums || (facultySectionNum ? [facultySectionNum] : [1]);
  const isAuthorized = facultyUser.role === "admin" || assignedNums.includes(studentSectionNum);

  if (!isAuthorized) {
    await logLocationAccess({
      viewerId: facultyUser.id || facultyUser.name,
      viewerRole: "faculty",
      viewerName: facultyUser.name,
      targetUserId: student.roll,
      targetRole: "student",
      purpose: "ATTENDANCE_VERIFICATION",
      result: "DENIED_UNAUTHORIZED",
      details: `Unauthorized section: Faculty assigned to Sec ${assignedNums.join(", ")}, student is in Sec ${studentSectionNum}.`
    });
    return {
      success: false,
      authorized: false,
      status: "UNAUTHORIZED",
      studentName: student.name,
      studentRoll: student.roll,
      section: student.section,
      message: `Access Denied: You are not authorized to view students in ${student.section}. You are authorized for Section(s): ${assignedNums.join(", ")}.`
    };
  }

  // 2. Check student's explicit location sharing consent
  const permission = await getLocationPermission(student.roll);
  if (!permission.isEnabled) {
    await logLocationAccess({
      viewerId: facultyUser.id || facultyUser.name,
      viewerRole: "faculty",
      viewerName: facultyUser.name,
      targetUserId: student.roll,
      targetRole: "student",
      purpose: "ATTENDANCE_VERIFICATION",
      result: "DENIED_NO_CONSENT",
      details: "Student has not enabled location sharing."
    });
    return {
      success: true,
      authorized: true,
      isSharing: false,
      status: "NOT_ENABLED",
      studentName: student.name,
      studentRoll: student.roll,
      section: student.section,
      message: "Location sharing is not enabled.",
      location: null
    };
  }

  // 3. Retrieve Latest Live GPS Coordinates
  let locationDoc = inMemoryLiveLocations.get(student.roll);
  if (!locationDoc) {
    try {
      const coll = getCollection(COLLECTIONS.LIVE_LOCATIONS);
      if (coll) {
        locationDoc = await coll.findOne({ userId: student.roll });
      }
    } catch (e) {}
  }

  if (!locationDoc || !locationDoc.isSharing) {
    await logLocationAccess({
      viewerId: facultyUser.id || facultyUser.name,
      viewerRole: "faculty",
      viewerName: facultyUser.name,
      targetUserId: student.roll,
      targetRole: "student",
      purpose: "ATTENDANCE_VERIFICATION",
      result: "OFFLINE",
      details: "Student device is offline or sharing stopped."
    });
    return {
      success: true,
      authorized: true,
      isSharing: false,
      status: "OFFLINE",
      studentName: student.name,
      studentRoll: student.roll,
      section: student.section,
      message: "Student location currently unavailable.",
      location: null
    };
  }

  // 4. Check Freshness
  const freshness = evaluateLocationFreshness(locationDoc.updatedAt);
  const statusMessage =
    freshness === "LIVE"
      ? "Live GPS Location Active"
      : freshness === "STALE"
      ? "Last known location – not currently live."
      : "Student location currently unavailable.";

  await logLocationAccess({
    viewerId: facultyUser.id || facultyUser.name,
    viewerRole: "faculty",
    viewerName: facultyUser.name,
    targetUserId: student.roll,
    targetRole: "student",
    purpose: "ATTENDANCE_VERIFICATION",
    result: "GRANTED",
    details: `Freshness: ${freshness}, Building: ${locationDoc.shortName || locationDoc.badge}`
  });

  return {
    success: true,
    authorized: true,
    isSharing: freshness !== "OFFLINE",
    status: freshness,
    message: statusMessage,
    studentName: student.name,
    studentRoll: student.roll,
    section: student.section,
    counsellor: student.counsellor,
    location: {
      latitude: locationDoc.latitude,
      longitude: locationDoc.longitude,
      accuracy: locationDoc.accuracy,
      building: locationDoc.building,
      shortName: locationDoc.shortName,
      badge: locationDoc.badge,
      color: locationDoc.color,
      description: locationDoc.description,
      updatedAt: locationDoc.updatedAt,
      isLive: freshness === "LIVE"
    }
  };
}

/**
 * Phase 2: Counsellor Role Authorization Engine
 * Counsellor can view ONLY assigned counselees who opted in.
 */
export async function getStudentLocationForCounsellor(counsellorUser, targetStudentRoll, allStudents = []) {
  const student = allStudents.find((s) => s.roll === targetStudentRoll || s.id === targetStudentRoll);
  if (!student) {
    return { success: false, authorized: false, message: "Student record not found." };
  }

  // Check assignment
  const counsellorName = counsellorUser.counsellorName || counsellorUser.name || "";
  const isAssigned =
    counsellorUser.role === "admin" ||
    (student.counsellor &&
      (student.counsellor.toLowerCase().includes(counsellorName.toLowerCase()) ||
        counsellorName.toLowerCase().includes(student.counsellor.toLowerCase())));

  if (!isAssigned) {
    await logLocationAccess({
      viewerId: counsellorUser.id || counsellorUser.name,
      viewerRole: "counsellor",
      viewerName: counsellorUser.name,
      targetUserId: student.roll,
      targetRole: "student",
      purpose: "MENTORSHIP_CHECKIN",
      result: "DENIED_UNAUTHORIZED",
      details: `Student is assigned to '${student.counsellor}', not '${counsellorName}'.`
    });
    return {
      success: false,
      authorized: false,
      status: "UNAUTHORIZED",
      studentName: student.name,
      studentRoll: student.roll,
      assignedCounsellor: student.counsellor,
      message: `Access Denied: Student ${student.name} is assigned to counsellor "${student.counsellor}". You can only view assigned counselees.`
    };
  }

  // Check consent
  const permission = await getLocationPermission(student.roll);
  if (!permission.isEnabled) {
    await logLocationAccess({
      viewerId: counsellorUser.id || counsellorUser.name,
      viewerRole: "counsellor",
      viewerName: counsellorUser.name,
      targetUserId: student.roll,
      targetRole: "student",
      purpose: "MENTORSHIP_CHECKIN",
      result: "DENIED_NO_CONSENT",
      details: "Student has not enabled location sharing with counsellor."
    });
    return {
      success: true,
      authorized: true,
      isSharing: false,
      status: "NOT_ENABLED",
      studentName: student.name,
      studentRoll: student.roll,
      section: student.section,
      message: "Location sharing is not enabled.",
      location: null
    };
  }

  let locationDoc = inMemoryLiveLocations.get(student.roll);
  if (!locationDoc) {
    try {
      const coll = getCollection(COLLECTIONS.LIVE_LOCATIONS);
      if (coll) locationDoc = await coll.findOne({ userId: student.roll });
    } catch (e) {}
  }

  if (!locationDoc || !locationDoc.isSharing) {
    return {
      success: true,
      authorized: true,
      isSharing: false,
      status: "OFFLINE",
      studentName: student.name,
      studentRoll: student.roll,
      section: student.section,
      message: "Student location currently unavailable.",
      location: null
    };
  }

  const freshness = evaluateLocationFreshness(locationDoc.updatedAt);
  const statusMessage =
    freshness === "LIVE"
      ? "Live GPS Location Active"
      : freshness === "STALE"
      ? "Last known location – not currently live."
      : "Student location currently unavailable.";

  await logLocationAccess({
    viewerId: counsellorUser.id || counsellorUser.name,
    viewerRole: "counsellor",
    viewerName: counsellorUser.name,
    targetUserId: student.roll,
    targetRole: "student",
    purpose: "MENTORSHIP_CHECKIN",
    result: "GRANTED",
    details: `Freshness: ${freshness}`
  });

  return {
    success: true,
    authorized: true,
    isSharing: freshness !== "OFFLINE",
    status: freshness,
    message: statusMessage,
    studentName: student.name,
    studentRoll: student.roll,
    section: student.section,
    counsellor: student.counsellor,
    location: {
      latitude: locationDoc.latitude,
      longitude: locationDoc.longitude,
      accuracy: locationDoc.accuracy,
      building: locationDoc.building,
      shortName: locationDoc.shortName,
      badge: locationDoc.badge,
      color: locationDoc.color,
      description: locationDoc.description,
      updatedAt: locationDoc.updatedAt,
      isLive: freshness === "LIVE"
    }
  };
}

/**
 * Phase 2 & Phase 3: Faculty Location Authorization Engine
 * Used by Students and Counsellors to view authorized faculty locations when shared.
 */
export async function getFacultyLocationForViewer(viewerUser, targetFacultyId, facultyDirectory = []) {
  const faculty = facultyDirectory.find((f) => f.id === targetFacultyId);
  if (!faculty) {
    return { success: false, authorized: false, message: "Faculty member not found." };
  }

  // 1. Verify Viewer Role: Students & Counsellors can view authorized faculty
  if (!["student", "counsellor", "faculty", "admin"].includes(viewerUser.role)) {
    return { success: false, authorized: false, message: "Unauthorized role." };
  }

  // 2. Check Faculty Location Sharing Permission
  const permission = await getLocationPermission(faculty.id);
  // Default faculty permission to enabled if sharing settings allow institutional discovery
  const isSharing = permission.isEnabled !== false;

  if (!isSharing) {
    await logLocationAccess({
      viewerId: viewerUser.id || viewerUser.roll || viewerUser.name,
      viewerRole: viewerUser.role,
      viewerName: viewerUser.name,
      targetUserId: faculty.id,
      targetRole: "faculty",
      purpose: "FACULTY_DIRECTORY_LOCATE",
      result: "DENIED_NO_CONSENT",
      details: "Faculty location sharing is disabled."
    });
    return {
      success: true,
      authorized: true,
      status: "NOT_ENABLED",
      facultyName: faculty.name,
      facultyId: faculty.id,
      department: faculty.department,
      cabin: faculty.cabin,
      message: "Faculty location sharing is currently disabled by the instructor.",
      location: null
    };
  }

  let locationDoc = inMemoryLiveLocations.get(faculty.id);
  if (!locationDoc) {
    try {
      const coll = getCollection(COLLECTIONS.LIVE_LOCATIONS);
      if (coll) locationDoc = await coll.findOne({ userId: faculty.id });
    } catch (e) {}
  }

  if (!locationDoc || !locationDoc.isSharing) {
    return {
      success: true,
      authorized: true,
      status: "OFFLINE",
      facultyName: faculty.name,
      facultyId: faculty.id,
      department: faculty.department,
      cabin: faculty.cabin,
      message: "Faculty member location is currently unavailable or offline.",
      location: null
    };
  }

  const freshness = evaluateLocationFreshness(locationDoc.updatedAt);
  const statusMessage =
    freshness === "LIVE"
      ? "Live GPS Location Active"
      : freshness === "STALE"
      ? "Last known location – not currently live."
      : "Faculty location currently unavailable.";

  await logLocationAccess({
    viewerId: viewerUser.id || viewerUser.roll || viewerUser.name,
    viewerRole: viewerUser.role,
    viewerName: viewerUser.name,
    targetUserId: faculty.id,
    targetRole: "faculty",
    purpose: "FACULTY_DIRECTORY_LOCATE",
    result: "GRANTED",
    details: `Freshness: ${freshness}`
  });

  return {
    success: true,
    authorized: true,
    status: freshness,
    message: statusMessage,
    facultyName: faculty.name,
    facultyId: faculty.id,
    department: faculty.department,
    cabin: faculty.cabin,
    designation: faculty.designation,
    subjects: faculty.subjects || faculty.subjectsList || [],
    location: {
      latitude: locationDoc.latitude,
      longitude: locationDoc.longitude,
      accuracy: locationDoc.accuracy,
      building: locationDoc.building,
      shortName: locationDoc.shortName,
      badge: locationDoc.badge,
      color: locationDoc.color,
      description: locationDoc.description,
      updatedAt: locationDoc.updatedAt,
      isLive: freshness === "LIVE"
    }
  };
}

/**
 * Phase 4: Admin Location Management & Audit Logs
 */
export async function getAdminLocationAuditData() {
  let accessLogs = [];
  let consentLogs = [];
  let liveLocations = Array.from(inMemoryLiveLocations.values());
  let permissions = Array.from(inMemoryPermissions.values());

  try {
    const accessColl = getCollection(COLLECTIONS.LOCATION_ACCESS_LOGS);
    if (accessColl) {
      accessLogs = await accessColl.find({}).sort({ timestamp: -1 }).limit(100).toArray();
    }
    const consentColl = getCollection(COLLECTIONS.LOCATION_CONSENT_HISTORY);
    if (consentColl) {
      consentLogs = await consentColl.find({}).sort({ timestamp: -1 }).limit(100).toArray();
    }
    const liveColl = getCollection(COLLECTIONS.LIVE_LOCATIONS);
    if (liveColl) {
      const dbLive = await liveColl.find({}).toArray();
      if (dbLive.length > 0) liveLocations = dbLive;
    }
  } catch (e) {}

  if (accessLogs.length === 0) accessLogs = inMemoryAccessLogs;
  if (consentLogs.length === 0) consentLogs = inMemoryConsentHistory;

  const summary = {
    totalTrackingUsers: liveLocations.length,
    activeLiveCount: liveLocations.filter((l) => l.isSharing && evaluateLocationFreshness(l.updatedAt) === "LIVE").length,
    staleCount: liveLocations.filter((l) => l.isSharing && evaluateLocationFreshness(l.updatedAt) === "STALE").length,
    offlineCount: liveLocations.filter((l) => !l.isSharing || evaluateLocationFreshness(l.updatedAt) === "OFFLINE").length,
    totalAccessLogsCount: accessLogs.length,
    totalConsentLogsCount: consentLogs.length
  };

  return {
    success: true,
    summary,
    metrics: summary,
    liveLocations,
    permissions,
    accessLogs,
    consentLogs
  };
}
