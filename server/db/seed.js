/**
 * VFSTR CSE Attendance Portal V2.4
 * Master Database Seeder: Seeds VFSTR_CSE_Attendance_DB with all historical and master data
 */

import { connectDB, getCollection } from "./connection.js";
import { COLLECTIONS, DB_NAME } from "./collections.js";
import { ALL_STUDENTS, SECTIONS, COUNSELLORS, DEFAULT_SETTINGS } from "../../data.js";
import { ALL_SECTION_TIMETABLES } from "../../src/data/timetable.js";
import { getAllFacultyDirectory } from "../../src/utils/facultyLocator.js";
import { recordAuditEvent } from "./auditService.js";
import { createDatabaseBackup } from "./backupService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_FILE = path.join(__dirname, "..", "data", "sessions.json");

export async function seedDatabase(force = false) {
  const db = await connectDB();
  console.log(`[Seed] Initiating database initialization for: ${DB_NAME}`);

  // 1. Check existing students
  const studentsColl = getCollection(COLLECTIONS.STUDENTS);
  const studentCount = await studentsColl.countDocuments();

  if (studentCount < ALL_STUDENTS.length || force) {
    console.log(`[Seed] Ingesting all ${ALL_STUDENTS.length} students into collection: ${COLLECTIONS.STUDENTS}...`);
    for (const s of ALL_STUDENTS) {
      await studentsColl.updateOne(
        { roll: s.roll },
        {
          $set: {
            roll: s.roll,
            name: s.name,
            section: s.section,
            sectionNum: s.sectionNum || 1,
            counsellor: s.counsellor || "Assigned Counsellor",
            department: "Computer Science & Engineering",
            semester: "III Year - 5th Semester",
            officialEmail: `${s.roll.toLowerCase()}@vignan.ac.in`,
            status: "ENROLLED",
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    }
    console.log(`[Seed] Successfully synchronized ${ALL_STUDENTS.length} students in MongoDB!`);
  }

  // 2. Sections
  const sectionsColl = getCollection(COLLECTIONS.CLASS_SECTIONS);
  for (const sec of SECTIONS) {
    const secName = typeof sec === "string" ? sec : sec.section;
    const secNum = typeof sec === "object" && sec.sectionNum ? sec.sectionNum : parseInt(String(secName).replace(/\D/g, "") || "1", 10);
    const room = typeof sec === "object" && sec.room ? sec.room : `Room N-40${secNum}`;
    const studentCount = typeof sec === "object" && sec.studentCount ? sec.studentCount : 70;
    const classTeacher = typeof sec === "object" && sec.classTeacher ? sec.classTeacher : "";

    await sectionsColl.updateOne(
      { section: secName },
      {
        $set: {
          section: secName,
          sectionNum: secNum,
          room,
          studentCount,
          classTeacher,
          counsellors: typeof sec === "object" && sec.counsellors ? sec.counsellors : [],
          department: "CSE",
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }

  // 3. Counsellors
  const counsellorsColl = getCollection(COLLECTIONS.COUNSELLORS);
  for (const c of COUNSELLORS) {
    await counsellorsColl.updateOne(
      { name: c.name },
      {
        $set: {
          name: c.name,
          sections: c.sections,
          studentCount: c.studentCount,
          department: "Computer Science & Engineering",
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }

  // 4. Faculty Directory
  const facultyColl = getCollection(COLLECTIONS.FACULTY);
  try {
    const facultyList = getAllFacultyDirectory();
    console.log(`[Seed] Ingesting ${facultyList.length} faculty profiles into MongoDB...`);
    for (const f of facultyList) {
      await facultyColl.updateOne(
        { id: f.id },
        {
          $set: {
            id: f.id,
            name: f.name,
            cabin: f.cabin,
            phone: f.phone,
            department: f.department,
            subjects: f.subjectsList,
            sections: f.sectionsList,
            sectionNums: f.sectionNumsList,
            isClassTeacher: Boolean(f.isClassTeacher),
            classTeacherSection: f.classTeacherSection || null,
            schedule: f.schedule || {},
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    }
  } catch (e) {
    console.warn("[Seed Warning] Faculty directory import skipped:", e.message);
  }

  // 5. Timetables
  const timetablesColl = getCollection(COLLECTIONS.TIMETABLES);
  for (const [secStr, tData] of Object.entries(ALL_SECTION_TIMETABLES)) {
    await timetablesColl.updateOne(
      { sectionNum: parseInt(secStr, 10) },
      {
        $set: {
          sectionNum: parseInt(secStr, 10),
          sectionName: tData.sectionName,
          classTeacher: tData.classTeacher,
          timetable: tData.timetable,
          faculties: tData.faculties,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }

  // 6. Application Settings
  const settingsColl = getCollection(COLLECTIONS.APPLICATION_SETTINGS);
  await settingsColl.updateOne(
    { key: "default_portal_settings" },
    {
      $set: {
        key: "default_portal_settings",
        settings: DEFAULT_SETTINGS,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  // 7. Admins
  const adminsColl = getCollection(COLLECTIONS.ADMINS);
  const adminEmails = [
    "deviraghuveerabaib@gmail.com",
    "admin@vignan.ac.in",
    "hod_cse@vignan.ac.in",
    "dean_academics@vignan.ac.in"
  ];
  for (const email of adminEmails) {
    await adminsColl.updateOne(
      { email },
      {
        $set: {
          email,
          role: "admin",
          department: "Computer Science & Engineering",
          permissions: ["ALL"],
          status: "ACTIVE",
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }

  // 8. Ingest Historical Attendance Sessions from sessions.json
  const sessionsColl = getCollection(COLLECTIONS.ATTENDANCE_SESSIONS);
  const submissionsColl = getCollection(COLLECTIONS.ATTENDANCE_SUBMISSIONS);
  const recordsColl = getCollection(COLLECTIONS.ATTENDANCE_RECORDS);

  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      const existingSessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8") || "[]");
      console.log(`[Seed] Ingesting ${existingSessions.length} past attendance sessions into MongoDB...`);

      for (const sess of existingSessions) {
        const sessionId = sess.id || `session_${Date.now()}`;
        const sessionDate = sess.date || new Date().toISOString().split("T")[0];
        const sectionNum = sess.sectionNum || parseInt(String(sess.section).replace(/\D/g, "") || "1", 10);

        // Save session document
        await sessionsColl.updateOne(
          { id: sessionId },
          {
            $set: {
              ...sess,
              id: sessionId,
              date: sessionDate,
              sectionNum,
              updatedAt: new Date()
            },
            $setOnInsert: { createdAt: new Date(sess.timestamp || Date.now()) }
          },
          { upsert: true }
        );

        // Save submission document
        await submissionsColl.updateOne(
          { id: sessionId },
          {
            $set: {
              id: sessionId,
              sessionId,
              date: sessionDate,
              period: sess.period || "1",
              subject: sess.subject || "Academic Class",
              section: sess.section || `Section ${sectionNum}`,
              sectionNum,
              facultyId: sess.facultyId || "fac_general",
              facultyName: sess.facultyName || "CSE Faculty",
              totalStudents: sess.totalCount || 70,
              presentCount: sess.presentCount || (70 - (sess.absentCount || 0)),
              absentCount: sess.absentCount || 0,
              percentage: sess.percentage || "100.0",
              absentRolls: sess.absentRolls || [],
              version: sess.version || 1,
              status: "SUBMITTED",
              timestamp: sess.timestamp || new Date().toISOString()
            },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );

        // Ingest individual attendance records
        if (sess.attendance && typeof sess.attendance === "object") {
          for (const [roll, status] of Object.entries(sess.attendance)) {
            await recordsColl.updateOne(
              { sessionId, studentRoll: roll },
              {
                $set: {
                  sessionId,
                  studentRoll: roll,
                  status,
                  date: sessionDate,
                  period: sess.period || "1",
                  sectionNum,
                  subject: sess.subject || "Academic Class",
                  markedBy: sess.facultyName || "Faculty",
                  timestamp: sess.timestamp || new Date().toISOString()
                },
                $setOnInsert: { createdAt: new Date() }
              },
              { upsert: true }
            );
          }
        }
      }
    } catch (e) {
      console.warn("[Seed Warning] Historical sessions import error:", e.message);
    }
  }

  // 9. Initial Audit Log
  await recordAuditEvent({
    eventType: "DATABASE_INITIALIZED",
    module: "system",
    actor: { userId: "system", name: "System Initialization Service", role: "system" },
    target: { entityType: "database", entityId: DB_NAME, details: "Master collections initialized and seeded" },
    changes: null,
    metadata: { version: "2.4", totalStudents: ALL_STUDENTS.length }
  });

  // 10. Initial Backup
  try {
    await createDatabaseBackup({
      triggeredBy: { userId: "system", role: "system" },
      reason: "Initial baseline database snapshot after seed"
    });
  } catch (e) {
    console.warn("[Seed Warning] Initial backup warning:", e.message);
  }

  console.log(`[Seed Complete] All collections in ${DB_NAME} are verified and ready for MongoDB Compass!`);
  return { success: true, database: DB_NAME };
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seedDatabase(true).then(() => {
    console.log("Seeding script execution finished.");
    process.exit(0);
  }).catch((err) => {
    console.error("Seeding script failed:", err);
    process.exit(1);
  });
}
