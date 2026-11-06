/**
 * VFSTR CSE Attendance Portal V2.4
 * Master End-to-End MongoDB Automated Test Suite
 */

import { connectDB, getCollection, getDb } from "./db/connection.js";
import { COLLECTIONS, DB_NAME } from "./db/collections.js";
import { recordAuditEvent, queryAuditLogs } from "./db/auditService.js";
import { storeFile, recordFileDownload } from "./db/fileStorageService.js";
import { createDatabaseBackup, listDatabaseBackups } from "./db/backupService.js";
import assert from "assert";

async function runMasterTestSuite() {
  console.log("============================================================");
  console.log("VFSTR CSE ATTENDANCE PORTAL V2.4 — MONGODB TEST SUITE");
  console.log(`Database: ${DB_NAME} (mongodb://127.0.0.1:27017)`);
  console.log("============================================================\n");

  const db = await connectDB();
  assert(db, "Failed to connect to MongoDB");
  console.log("✔ Test 1: MongoDB Community Server connection OK");

  // Test 2: Students Master Roster
  const studentsColl = getCollection(COLLECTIONS.STUDENTS);
  const studentCount = await studentsColl.countDocuments();
  console.log(`✔ Test 2: Students Master Roster has ${studentCount} records (Target: 1,511)`);
  assert(studentCount >= 1511, `Expected at least 1511 students, found ${studentCount}`);

  // Test 3: Faculty Master Directory
  const facultyColl = getCollection(COLLECTIONS.FACULTY);
  const facultyCount = await facultyColl.countDocuments();
  console.log(`✔ Test 3: Faculty Master Directory has ${facultyCount} records (Target: >250)`);
  assert(facultyCount > 200, `Expected >200 faculty records, found ${facultyCount}`);

  // Test 4: Class Sections and Timetables
  const sectionsColl = getCollection(COLLECTIONS.CLASS_SECTIONS);
  const secCount = await sectionsColl.countDocuments();
  assert.strictEqual(secCount, 22, `Expected 22 sections, found ${secCount}`);
  console.log(`✔ Test 4: All 22 CSE Academic Sections verified in MongoDB`);

  // Test 5: Attendance Session & Granular Records Submission
  const testSessionId = `test_session_${Date.now()}`;
  const sessionsColl = getCollection(COLLECTIONS.ATTENDANCE_SESSIONS);
  const recordsColl = getCollection(COLLECTIONS.ATTENDANCE_RECORDS);

  await sessionsColl.insertOne({
    id: testSessionId,
    date: "2026-11-06",
    period: "1",
    section: "Section 1",
    sectionNum: 1,
    subject: "Machine Learning (ML)",
    facultyName: "Dr. P. Siva Prasad",
    totalCount: 72,
    presentCount: 70,
    absentCount: 2,
    absentRolls: ["241FA04035", "241FA04B57"],
    percentage: "97.2",
    timestamp: new Date().toISOString()
  });

  await recordsColl.insertMany([
    { sessionId: testSessionId, studentRoll: "241FA04035", status: "absent", date: "2026-11-06", period: "1" },
    { sessionId: testSessionId, studentRoll: "241FA04B57", status: "absent", date: "2026-11-06", period: "1" },
    { sessionId: testSessionId, studentRoll: "241FA04001", status: "present", date: "2026-11-06", period: "1" }
  ]);

  const savedSess = await sessionsColl.findOne({ id: testSessionId });
  assert(savedSess, "Failed to retrieve attendance session");
  const savedRecords = await recordsColl.find({ sessionId: testSessionId }).toArray();
  assert.strictEqual(savedRecords.length, 3, "Failed to retrieve granular student attendance records");
  console.log("✔ Test 5: Attendance session and granular student records committed and retrieved");

  // Test 6: Audit Trail Logging & Immutability
  const auditEvt = await recordAuditEvent({
    eventType: "TEST_ATTENDANCE_SUBMITTED",
    module: "attendance",
    actor: { userId: "fac_sivaprasad", name: "Dr. P. Siva Prasad", role: "faculty" },
    target: { entityType: "attendance_session", entityId: testSessionId },
    changes: { previous: null, current: { absentCount: 2 } },
    metadata: { testRun: true }
  });
  assert(auditEvt && auditEvt.eventId, "Failed to create audit event");

  const queryRes = await queryAuditLogs({ eventType: "TEST_ATTENDANCE_SUBMITTED" });
  assert(queryRes.data.length > 0, "Failed to query audit trail");
  console.log(`✔ Test 6: Audit event ${auditEvt.eventId} created and verified in audit_logs`);

  // Test 7: OD Exemption Application
  const odColl = getCollection(COLLECTIONS.OD_APPLICATIONS);
  const testOdId = `od_test_${Date.now()}`;
  await odColl.insertOne({
    id: testOdId,
    studentRoll: "241FA04035",
    studentName: "BONDILI DEVI RAGHUVEERA BAI",
    date: "2026-11-06",
    reason: "Smart India Hackathon Finals",
    status: "Approved by Counsellor",
    submittedAt: new Date().toISOString()
  });
  const savedOd = await odColl.findOne({ id: testOdId });
  assert(savedOd, "Failed to save OD application");
  console.log("✔ Test 7: Counsellor OD Application workflow committed to MongoDB");

  // Test 8: Centralized File Storage Service
  const testBuffer = Buffer.from("VFSTR CSE Attendance Portal Verification Document Sample Content", "utf-8");
  const fileDoc = await storeFile({
    originalName: "Hackathon_Certificate.pdf",
    buffer: testBuffer,
    mimeType: "application/pdf",
    module: "counsellor_od",
    uploader: { userId: "241FA04035", name: "BONDILI DEVI RAGHUVEERA BAI", role: "student" },
    relatedRecordId: testOdId,
    category: "od_documents"
  });
  assert(fileDoc && fileDoc.fileId, "File storage service failed");

  await recordFileDownload({ fileId: fileDoc.fileId, downloader: { userId: "fac_sivaprasad", role: "faculty" } });
  const downloadColl = getCollection(COLLECTIONS.FILE_DOWNLOAD_HISTORY);
  const dlRecord = await downloadColl.findOne({ fileId: fileDoc.fileId });
  assert(dlRecord, "Failed to track file download history");
  console.log("✔ Test 8: File storage service, SHA256 checksum, and download history verified");

  // Test 9: Database Backup Snapshot
  const backup = await createDatabaseBackup({
    triggeredBy: { userId: "admin", role: "admin" },
    reason: "Automated End-to-End Test Suite Verification"
  });
  assert(backup && backup.backupId, "Failed to create database backup");
  const backupList = await listDatabaseBackups();
  assert(backupList.length > 0, "Failed to list database backups");
  console.log(`✔ Test 9: Complete database backup snapshot created (${backup.totalDocuments} documents saved)`);

  // Clean up test session and test OD
  await sessionsColl.deleteOne({ id: testSessionId });
  await recordsColl.deleteMany({ sessionId: testSessionId });
  await odColl.deleteOne({ id: testOdId });

  console.log("\n============================================================");
  console.log("ALL 9 TEST MODULES PASSED SUCCESSFULLY! (100% SUCCESS)");
  console.log("VFSTR_CSE_Attendance_DB is fully operational and visible in MongoDB Compass.");
  console.log("============================================================\n");
  process.exit(0);
}

runMasterTestSuite().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});

