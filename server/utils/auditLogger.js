const mongoose = require("mongoose");

const AuditLog = require("../models/AuditLog");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const STATUSES = ["Success", "Failed", "Blocked"];

// Never copy these into the audit trail, at any depth.
const SENSITIVE_KEY = /password|token|secret|hash|otp|authorization/i;

// Bookkeeping fields that are not meaningful changes.
const IGNORED_KEYS = new Set(["_id", "__v", "createdAt", "updatedAt"]);

const MAX_VALUE_LENGTH = 300;
const MAX_CHANGES = 40;

/*
|--------------------------------------------------------------------------
| Value helpers
|--------------------------------------------------------------------------
*/

// Mongoose documents / ObjectIds / Dates -> plain JSON-safe data.
const toPlain = (value) => {
  if (value === null || value === undefined) return value;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const truncate = (text) =>
  text.length > MAX_VALUE_LENGTH
    ? `${text.slice(0, MAX_VALUE_LENGTH)}…`
    : text;

// A compact, display-safe version of a value.
const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (Array.isArray(value)) {
    if (value.length === 0) return null;

    if (value.every((item) => !isPlainObject(item) && !Array.isArray(item))) {
      return truncate(value.join(", "));
    }

    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (isPlainObject(value)) {
    return truncate(JSON.stringify(value));
  }

  if (typeof value === "string") return truncate(value);

  return value;
};

// "generalInfo.birthdate" -> "General Info › Birthdate"
const humanize = (path) =>
  String(path)
    .split(".")
    .map((part) =>
      part
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .replace(/^./, (character) => character.toUpperCase()),
    )
    .join(" › ");

const flatten = (value, prefix = "", out = {}) => {
  if (!isPlainObject(value)) {
    if (prefix) out[prefix] = value;
    return out;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (IGNORED_KEYS.has(key) || SENSITIVE_KEY.test(key)) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(nested)) {
      flatten(nested, path, out);
    } else {
      out[path] = nested;
    }
  }

  return out;
};

/*
|--------------------------------------------------------------------------
| Change tracking
|--------------------------------------------------------------------------
|
| diffObjects(before, after, { fields })
|
| Returns [{ field, label, before, after }] for every value that is
| different. `fields` optionally limits the comparison to the given
| top-level keys (for example the keys of a PATCH body).
|
*/

const diffObjects = (before, after, { fields } = {}) => {
  const flatBefore = flatten(toPlain(before) || {});
  const flatAfter = flatten(toPlain(after) || {});

  const allowed = Array.isArray(fields) && fields.length ? new Set(fields) : null;

  const paths = new Set([...Object.keys(flatBefore), ...Object.keys(flatAfter)]);

  const changes = [];

  for (const path of paths) {
    if (allowed && !allowed.has(path.split(".")[0])) continue;

    const previous = flatBefore[path];
    const next = flatAfter[path];

    if (JSON.stringify(previous ?? null) === JSON.stringify(next ?? null)) {
      continue;
    }

    changes.push({
      field: path,
      label: humanize(path),
      before: formatValue(previous),
      after: formatValue(next),
    });

    if (changes.length >= MAX_CHANGES) break;
  }

  return changes;
};

const showValue = (value) =>
  value === null || value === undefined ? "empty" : `"${value}"`;

// "Status: "waiting" → "beingSeen"; Department: ... (+2 more)"
const summarizeChanges = (changes = [], max = 3) => {
  if (!changes.length) return "";

  const shown = changes
    .slice(0, max)
    .map(
      (change) =>
        `${change.label}: ${showValue(change.before)} → ${showValue(change.after)}`,
    )
    .join("; ");

  const remaining = changes.length - max;

  return remaining > 0 ? `${shown} (+${remaining} more)` : shown;
};

/*
|--------------------------------------------------------------------------
| Request helpers
|--------------------------------------------------------------------------
*/

const getClientIp = (req) => {
  const forwarded = req?.headers?.["x-forwarded-for"];

  const raw =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0] ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    "";

  return String(raw).trim().replace(/^::ffff:/, "");
};

// "Chrome 126 on Windows" from a raw user-agent string.
const describeDevice = (userAgent = "") => {
  if (!userAgent) return "";

  const os = /Windows/i.test(userAgent)
    ? "Windows"
    : /Android/i.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iPod/i.test(userAgent)
        ? "iOS"
        : /Mac OS X|Macintosh/i.test(userAgent)
          ? "macOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "Unknown OS";

  // Order matters: Edge/Opera user agents also contain "Chrome/".
  const browserPatterns = [
    ["Edge", /Edg\/(\d+)/],
    ["Opera", /OPR\/(\d+)/],
    ["Firefox", /Firefox\/(\d+)/],
    ["Chrome", /(?:Chrome|CriOS)\/(\d+)/],
    ["Safari", /Version\/(\d+).*Safari/],
  ];

  let browserName = "Unknown browser";
  let browserVersion = "";

  for (const [name, pattern] of browserPatterns) {
    const match = userAgent.match(pattern);

    if (match) {
      browserName = name;
      browserVersion = match[1];
      break;
    }
  }

  return `${browserName}${browserVersion ? ` ${browserVersion}` : ""} on ${os}`;
};

/*
|--------------------------------------------------------------------------
| Actor lookup
|--------------------------------------------------------------------------
|
| The JWT only carries { id, role }, so the name/email/department of the
| person performing the action has to be looked up.
|
*/

const lookupActor = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(String(userId))) return null;

  try {
    // Required lazily so the logger never creates a circular import.
    const User = require("../models/user");

    return await User.findById(userId)
      .select("name full_name email role department")
      .lean();
  } catch {
    return null;
  }
};

const lookupEventTitle = async (eventId) => {
  if (!eventId || !mongoose.isValidObjectId(String(eventId))) return "";

  try {
    const Event = require("../models/Event");

    const event = await Event.findById(eventId).select("title").lean();

    return event?.title || "";
  } catch {
    return "";
  }
};

/*
|--------------------------------------------------------------------------
| logAudit
|--------------------------------------------------------------------------
|
| Required: module, action, description
|
| Optional:
|   status        "Success" (default) | "Failed" | "Blocked"
|   reason        why it failed / was blocked
|   targetType    "Patient", "User", "Event", ...
|   targetId / targetName
|   location / eventId / eventTitle
|   changes       [{ field, label, before, after }]  (see diffObjects)
|   operationId   offline outbox operation (marks source "Offline Sync")
|   source        override for the inferred source
|   metadata      any extra structured detail
|   userId/userName/userRole/userEmail/userDepartment
|                 override the authenticated user (e.g. login)
|
*/

const logAudit = async (req, data = {}) => {
  try {
    if (!data.module || !data.action || !data.description) {
      console.warn("AUDIT LOG SKIPPED: Missing module, action, or description");
      return;
    }

    const userId = data.userId || req?.user?._id || req?.user?.id || "";

    let actor = {};

    if (!data.userName || !data.userEmail || !data.userDepartment) {
      actor = (await lookupActor(userId)) || {};
    }

    const userName =
      data.userName ||
      actor.name ||
      actor.full_name ||
      req?.user?.name ||
      req?.user?.full_name ||
      req?.user?.email ||
      actor.email ||
      "System";

    const userRole =
      data.userRole ||
      actor.role ||
      req?.user?.role ||
      req?.user?.account_type ||
      "";

    const userAgent = String(req?.headers?.["user-agent"] || "").slice(0, 300);

    const operationId = data.operationId
      ? String(data.operationId)
      : data.metadata?.operationId
        ? String(data.metadata.operationId)
        : "";

    const eventTitle =
      data.eventTitle || (await lookupEventTitle(data.eventId)) || "";

    await AuditLog.create({
      userId: userId ? String(userId) : "",
      userName,
      userRole,
      userEmail: data.userEmail || actor.email || req?.user?.email || "",
      userDepartment: data.userDepartment || actor.department || "",

      module: data.module,
      action: data.action,
      description: data.description,

      status: STATUSES.includes(data.status) ? data.status : "Success",
      reason: data.reason || "",

      targetType: data.targetType || "",
      targetId: data.targetId ? String(data.targetId) : "",
      targetName: data.targetName || "",

      location: data.location || "System",

      eventId: data.eventId ? String(data.eventId) : "",
      eventTitle,

      source: data.source || (operationId ? "Offline Sync" : "Online"),
      operationId,

      ipAddress: getClientIp(req),
      device: describeDevice(userAgent),
      userAgent,

      method: req?.method || "",
      path: req?.originalUrl || req?.path || "",

      changes: Array.isArray(data.changes) ? data.changes : [],

      metadata: toPlain(data.metadata) || {},
    });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error.message);
  }
};

module.exports = logAudit;
module.exports.diffObjects = diffObjects;
module.exports.summarizeChanges = summarizeChanges;
module.exports.formatValue = formatValue;
