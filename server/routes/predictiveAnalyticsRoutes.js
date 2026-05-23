const express = require("express");

const router = express.Router();

const {
  generateAnalytics,
} = require("../controllers/predictiveAnalyticsController");

router.post("/generate", generateAnalytics);

module.exports = router;
