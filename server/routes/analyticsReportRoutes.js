const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createAnalyticsReport,
  getAnalyticsReports,
  getAnalyticsReportById,
} = require("../controllers/analyticsReportController");

router.post("/", auth, createAnalyticsReport);

router.get("/", auth, getAnalyticsReports);

router.get("/:id", auth, getAnalyticsReportById);

module.exports = router;
