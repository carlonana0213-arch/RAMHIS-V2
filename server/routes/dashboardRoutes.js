const express = require("express");

const router = express.Router();

const {
  getDashboardSummary,
  getPatientTrends,
  getDiagnosisDistribution,
  getTopMedicines,
} = require("../controllers/dashboardController");

router.get("/summary", getDashboardSummary);

router.get("/patient-trends", getPatientTrends);

router.get("/diagnosis-distribution", getDiagnosisDistribution);

router.get("/top-medicines", getTopMedicines);

module.exports = router;
