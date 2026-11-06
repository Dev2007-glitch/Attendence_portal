/**
 * VFSTR CSE Attendance Portal V2.4
 * Database Backup and Disaster Recovery Service
 */

import fs from "fs";
import path from "path";
import { getDb, getCollection } from "./connection.js";
import { COLLECTIONS, DB_NAME } from "./collections.js";
import { getStorageDirectories } from "./fileStorageService.js";

export async function createDatabaseBackup({ triggeredBy = { userId: "system", role: "system" }, reason = "Scheduled Automated Backup" }) {
  const db = getDb();
  const backupId = `backup_${Date.now()}`;
  const timestamp = new Date().toISOString();
  const backupDir = path.join(getStorageDirectories().BACKUPS, backupId);

  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const collections = await db.listCollections().toArray();
  const manifest = {
    backupId,
    database: DB_NAME,
    timestamp,
    triggeredBy,
    reason,
    collections: {},
    totalDocuments: 0
  };

  for (const collInfo of collections) {
    const cName = collInfo.name;
    if (cName.startsWith("system.")) continue;

    const coll = db.collection(cName);
    const docs = await coll.find({}).toArray();
    const filePath = path.join(backupDir, `${cName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf-8");
    manifest.collections[cName] = {
      count: docs.length,
      file: `${cName}.json`
    };
    manifest.totalDocuments += docs.length;
  }

  // Save Manifest
  const manifestPath = path.join(backupDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  // Record in Database
  const backupColl = getCollection(COLLECTIONS.DATABASE_BACKUPS);
  await backupColl.insertOne({
    ...manifest,
    backupDir,
    status: "COMPLETED",
    createdAt: new Date()
  });

  console.log(`[Backup Service] Backup created: ${backupId} (${manifest.totalDocuments} total documents across ${Object.keys(manifest.collections).length} collections).`);
  return manifest;
}

export async function listDatabaseBackups() {
  const backupColl = getCollection(COLLECTIONS.DATABASE_BACKUPS);
  return await backupColl.find({}).sort({ timestamp: -1 }).toArray();
}

export async function restoreDatabaseBackup({ backupId, adminUser = { userId: "admin", role: "admin" } }) {
  const db = getDb();
  const backupDir = path.join(getStorageDirectories().BACKUPS, backupId);
  const manifestPath = path.join(backupDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Backup manifest not found for ID: ${backupId}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  for (const [cName, info] of Object.entries(manifest.collections)) {
    const filePath = path.join(backupDir, info.file);
    if (fs.existsSync(filePath)) {
      const docs = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const coll = db.collection(cName);
      if (docs.length > 0) {
        // Safe replace / upsert
        for (const doc of docs) {
          if (doc._id) {
            await coll.replaceOne({ _id: doc._id }, doc, { upsert: true });
          }
        }
      }
    }
  }

  console.log(`[Backup Service] Backup ${backupId} restored successfully by ${adminUser.userId}`);
  return { success: true, restoredBackupId: backupId, restoredAt: new Date().toISOString() };
}

