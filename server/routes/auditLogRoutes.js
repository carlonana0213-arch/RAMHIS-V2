const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getAuditLogs,
  getAuditLocations,
} = require("../controllers/auditLogController");

router.get("/locations", auth, getAuditLocations);
router.get("/", auth, getAuditLogs);

module.exports = router;