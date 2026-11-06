/**
 * VFSTR CSE Attendance Portal V2.4
 * Master Audit Trail and Activity History Service
 */

import { getCollection } from "./connection.js";
import { COLLECTIONS } from "./collections.js";
import crypto from "crypto";

export async function recordAuditEvent({
  eventType,
  module = "general",
  actor = {},
  target = {},
  changes = null,
  metadata = {},
  ip = "127.0.0.1",
  userAgent = "Application Client",
  result = "SUCCESS"
}) {
  try {
    const auditColl = getCollection(COLLECTIONS.AUDIT_LOGS);
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const timestamp = new Date().toISOString();

    // Sanitize any sensitive keys
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.credential;

    const eventDocument = {
      eventId,
      eventType,
      module,
      actor: {
        userId: actor.userId || actor.roll || actor.id || "system",
        name: actor.name || "System",
        role: actor.role || "system",
        email: actor.email || ""
      },
      target: {
        entityType: target.entityType || "generic",
        entityId: target.entityId || "none",
        details: target.details || ""
      },
      changes: changes
        ? {
            previous: changes.previous !== undefined ? changes.previous : null,
            current: changes.current !== undefined ? changes.current : null
          }
        : null,
      metadata: sanitizedMetadata,
      ip,
      userAgent,
      result,
      timestamp,
      createdAt: new Date()
    };

    await auditColl.insertOne(eventDocument);

    // Also mirror to user-specific activity log if applicable
    if (actor.userId && actor.userId !== "system") {
      const actColl = getCollection(COLLECTIONS.ACTIVITY_LOGS);
      await actColl.insertOne({
        eventId,
        userId: actor.userId,
        role: actor.role,
        action: eventType,
        module,
        summary: `${actor.name || actor.userId} performed ${eventType} on ${target.entityType || "record"}`,
        timestamp,
        createdAt: new Date()
      });
    }

    return eventDocument;
  } catch (err) {
    console.error("[Audit Error] Failed to write audit event:", err.message);
    return null;
  }
}

export async function queryAuditLogs({
  module,
  eventType,
  userId,
  role,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 50
}) {
  const auditColl = getCollection(COLLECTIONS.AUDIT_LOGS);
  const filter = {};

  if (module && module !== "ALL") filter.module = module;
  if (eventType && eventType !== "ALL") filter.eventType = eventType;
  if (userId) filter["actor.userId"] = userId;
  if (role && role !== "ALL") filter["actor.role"] = role;

  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate).toISOString();
    if (endDate) filter.timestamp.$lte = new Date(endDate).toISOString();
  }

  if (search) {
    filter.$or = [
      { eventType: { $regex: search, $options: "i" } },
      { "actor.name": { $regex: search, $options: "i" } },
      { "actor.userId": { $regex: search, $options: "i" } },
      { "target.entityId": { $regex: search, $options: "i" } }
    ];
  }

  const numLimit = parseInt(String(limit), 10) || 50;
  const numPage = parseInt(String(page), 10) || 1;
  const skip = (Math.max(1, numPage) - 1) * numLimit;
  const total = await auditColl.countDocuments(filter);
  const logs = await auditColl
    .find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(numLimit)
    .toArray();

  return {
    total,
    page: numPage,
    limit: numLimit,
    totalPages: Math.ceil(total / numLimit),
    data: logs
  };
}
