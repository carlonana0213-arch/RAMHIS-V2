const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getAuditLogs,
  getAuditLog,
  getAuditLocations,
} = require("../controllers/auditLogController");

router.get("/locations", auth, getAuditLocations);
router.get("/", auth, getAuditLogs);
router.get("/:id", auth, getAuditLog);

module.exports = router;