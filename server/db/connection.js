/**
 * VFSTR CSE Attendance Portal V2.4
 * Database Connection & Index Management Module
 */

import { MongoClient, GridFSBucket } from "mongodb";
import { DB_NAME, COLLECTIONS } from "./collections.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";

let client = null;
let db = null;
let gridFSBucket = null;

export async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50
    });

    await client.connect();
    db = client.db(DB_NAME);
    gridFSBucket = new GridFSBucket(db, { bucketName: "fs" });

    console.log(`[Database] Connected successfully to MongoDB at ${MONGO_URI}`);
    console.log(`[Database] Active Database: ${DB_NAME}`);

    // Create Indexes
    await initializeIndexes(db);

    return db;
  } catch (err) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);
    throw err;
  }
}

export function getDb() {
  return db || null;
}

export function getCollection(collectionName) {
  const database = getDb();
  if (!database) return null;
  return database.collection(collectionName);
}

export function getGridFS() {
  if (!gridFSBucket) {
    throw new Error("[Database Error] GridFSBucket not initialized.");
  }
  return gridFSBucket;
}

async function initializeIndexes(database) {
  try {
    // 1. Students: Unique roll number index
    await database.collection(COLLECTIONS.STUDENTS).createIndex(
      { roll: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.STUDENTS).createIndex(
      { sectionNum: 1, roll: 1 },
      { background: true }
    );

    // 2. Users: Unique email / userId index
    await database.collection(COLLECTIONS.USERS).createIndex(
      { userId: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.USERS).createIndex(
      { email: 1 },
      { background: true }
    );

    // 3. Attendance Sessions & Submissions
    await database.collection(COLLECTIONS.ATTENDANCE_SESSIONS).createIndex(
      { id: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.ATTENDANCE_SESSIONS).createIndex(
      { sectionNum: 1, date: 1, period: 1 },
      { background: true }
    );
    await database.collection(COLLECTIONS.ATTENDANCE_SUBMISSIONS).createIndex(
      { id: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.ATTENDANCE_SUBMISSIONS).createIndex(
      { date: 1, section: 1 },
      { background: true }
    );

    // 4. Attendance Records: Individual student roll + sessionId
    await database.collection(COLLECTIONS.ATTENDANCE_RECORDS).createIndex(
      { sessionId: 1, studentRoll: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.ATTENDANCE_RECORDS).createIndex(
      { studentRoll: 1, date: 1 },
      { background: true }
    );

    // 5. Audit Logs: Unique eventId and fast chronological queries
    await database.collection(COLLECTIONS.AUDIT_LOGS).createIndex(
      { eventId: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.AUDIT_LOGS).createIndex(
      { timestamp: -1 },
      { background: true }
    );
    await database.collection(COLLECTIONS.AUDIT_LOGS).createIndex(
      { module: 1, eventType: 1 },
      { background: true }
    );
    await database.collection(COLLECTIONS.AUDIT_LOGS).createIndex(
      { "actor.userId": 1, timestamp: -1 },
      { background: true }
    );

    // 6. Login History
    await database.collection(COLLECTIONS.LOGIN_HISTORY).createIndex(
      { timestamp: -1 },
      { background: true }
    );
    await database.collection(COLLECTIONS.LOGIN_HISTORY).createIndex(
      { userId: 1 },
      { background: true }
    );

    // 7. OD Applications
    await database.collection(COLLECTIONS.OD_APPLICATIONS).createIndex(
      { id: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.OD_APPLICATIONS).createIndex(
      { studentRoll: 1, date: -1 },
      { background: true }
    );

    // 8. Search Activity
    await database.collection(COLLECTIONS.SEARCH_ACTIVITY).createIndex(
      { timestamp: -1 },
      { background: true }
    );

    // 9. Location Tracking & Permissions (Phase 7)
    await database.collection(COLLECTIONS.LIVE_LOCATIONS).createIndex(
      { userId: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.LIVE_LOCATIONS).createIndex(
      { role: 1, isSharing: 1 },
      { background: true }
    );
    await database.collection(COLLECTIONS.LIVE_LOCATIONS).createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, background: true }
    );
    await database.collection(COLLECTIONS.LOCATION_SHARING_PERMISSIONS).createIndex(
      { userId: 1 },
      { unique: true, background: true }
    );
    await database.collection(COLLECTIONS.LOCATION_ACCESS_LOGS).createIndex(
      { viewerId: 1, timestamp: -1 },
      { background: true }
    );
    await database.collection(COLLECTIONS.LOCATION_ACCESS_LOGS).createIndex(
      { targetUserId: 1, timestamp: -1 },
      { background: true }
    );
    await database.collection(COLLECTIONS.LOCATION_CONSENT_HISTORY).createIndex(
      { userId: 1, timestamp: -1 },
      { background: true }
    );

    console.log("[Database] All core performance, location tracking and uniqueness indexes verified.");
  } catch (err) {
    console.warn("[Database Warning] Non-critical error initializing indexes:", err.message);
  }
}

