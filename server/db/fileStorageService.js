/**
 * VFSTR CSE Attendance Portal V2.4
 * Centralized File & Document Storage Service (Local Filesystem + MongoDB GridFS)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { getCollection, getGridFS } from "./connection.js";
import { COLLECTIONS } from "./collections.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_ROOT = path.join(__dirname, "..", "storage");

// Ensure physical directories exist
const DIRECTORIES = {
  OD_DOCUMENTS: path.join(STORAGE_ROOT, "od_documents"),
  REPORTS: path.join(STORAGE_ROOT, "reports"),
  AVATARS: path.join(STORAGE_ROOT, "avatars"),
  BACKUPS: path.join(STORAGE_ROOT, "backups"),
  GENERATED: path.join(STORAGE_ROOT, "generated")
};

Object.values(DIRECTORIES).forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export async function storeFile({
  originalName,
  buffer,
  mimeType = "application/octet-stream",
  module = "general",
  uploader = {},
  relatedRecordId = "",
  category = "document"
}) {
  const fileId = `file_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const ext = path.extname(originalName) || ".dat";
  const storedName = `${fileId}${ext}`;
  const targetDir = DIRECTORIES[category.toUpperCase()] || DIRECTORIES.GENERATED;
  const filePath = path.join(targetDir, storedName);

  // Compute Checksum
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

  // Save to disk
  fs.writeFileSync(filePath, buffer);

  const fileDoc = {
    fileId,
    originalName,
    storedName,
    filePath,
    mimeType,
    sizeBytes: buffer.length,
    checksum,
    module,
    category,
    relatedRecordId,
    uploader: {
      userId: uploader.userId || uploader.roll || "anonymous",
      name: uploader.name || "Anonymous",
      role: uploader.role || "student"
    },
    uploadedAt: new Date().toISOString(),
    status: "ACTIVE"
  };

  const fileMetaColl = getCollection(COLLECTIONS.FILE_METADATA);
  await fileMetaColl.insertOne(fileDoc);

  const uploadedFilesColl = getCollection(COLLECTIONS.UPLOADED_FILES);
  await uploadedFilesColl.insertOne({
    ...fileDoc,
    createdAt: new Date()
  });

  return fileDoc;
}

export async function recordFileDownload({ fileId, downloader = {}, ip = "127.0.0.1" }) {
  try {
    const downloadColl = getCollection(COLLECTIONS.FILE_DOWNLOAD_HISTORY);
    await downloadColl.insertOne({
      downloadId: `dl_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      fileId,
      downloader: {
        userId: downloader.userId || downloader.roll || "guest",
        role: downloader.role || "guest",
        name: downloader.name || "Guest"
      },
      ip,
      downloadedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn("[File Download History Warning]:", e.message);
  }
}

export function getStorageDirectories() {
  return DIRECTORIES;
}

