const mongoose = require("mongoose");

const AuditLog = require("../models/AuditLog");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isAdmin = (req) => {
  return (req.user?.role || "").toLowerCase() === "admin";
};

exports.getAuditLogs = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        ok: false,
        message: "Access denied",
      });
    }

    const {
      search,
      module,
      action,
      location,
      status,
      source,
      dateFrom,
      dateTo,
      limit = 300,
    } = req.query;

    const query = {};

    if (module && module !== "All") {
      query.module = module;
    }

    if (action && action !== "All") {
      query.action = action;
    }

    if (location && location !== "All") {
      query.location = location;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (source && source !== "All") {
      query.source = source;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};

      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(escapeRegex(search.trim()), "i");

      query.$or = [
        { userName: regex },
        { userRole: regex },
        { userEmail: regex },
        { module: regex },
        { action: regex },
        { description: regex },
        { reason: regex },
        { targetName: regex },
        { targetType: regex },
        { location: regex },
        { eventTitle: regex },
        { ipAddress: regex },
      ];
    }

    const safeLimit = Math.min(Number(limit) || 300, 500);

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    res.json({
      ok: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("GET AUDIT LOGS ERROR:", error);

    res.status(500).json({
      ok: false,
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

exports.getAuditLog = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        ok: false,
        message: "Access denied",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid audit log id",
      });
    }

    const log = await AuditLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        ok: false,
        message: "Audit log not found",
      });
    }

    res.json({ ok: true, data: log });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to fetch audit log",
    });
  }
};

exports.getAuditLocations = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        ok: false,
        message: "Access denied",
      });
    }

    const locations = await AuditLog.distinct("location");

    res.json({
      ok: true,
      data: locations.filter((item) => item && item.trim() !== ""),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Failed to fetch audit locations",
    });
  }
};