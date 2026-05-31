const AuditLog = require("../models/AuditLog");

const logAudit = async (req, data = {}) => {
  try {
    if (!data.module || !data.action || !data.description) {
      console.warn("AUDIT LOG SKIPPED: Missing module, action, or description");
      return;
    }

    const userId =
      data.userId ||
      req.user?._id ||
      req.user?.id ||
      "";

    const userName =
      data.userName ||
      req.user?.name ||
      req.user?.full_name ||
      req.user?.email ||
      "System";

    const userRole =
      data.userRole ||
      req.user?.role ||
      req.user?.account_type ||
      "";

    await AuditLog.create({
      userId: userId ? String(userId) : "",
      userName,
      userRole,

      module: data.module,
      action: data.action,
      description: data.description,

      targetId: data.targetId ? String(data.targetId) : "",
      targetName: data.targetName || "",

      location: data.location || "System",

      eventId: data.eventId ? String(data.eventId) : "",
      eventTitle: data.eventTitle || "",

      ipAddress:
        req.headers?.["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        req.ip ||
        "",

      method: req.method || "",
      path: req.originalUrl || req.path || "",

      metadata: data.metadata || {},
    });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error.message);
  }
};

module.exports = logAudit;