const AuditLog = require("../models/AuditLog");

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
      const regex = new RegExp(search.trim(), "i");

      query.$or = [
        { userName: regex },
        { userRole: regex },
        { module: regex },
        { action: regex },
        { description: regex },
        { targetName: regex },
        { location: regex },
        { eventTitle: regex },
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