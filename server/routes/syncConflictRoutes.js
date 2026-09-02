const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getPatientConflicts,
  getConflict,
  resolveConflict,
} = require("../controllers/SyncConflictController");

// ---------------------------------------------------------
// Get all pending conflicts for a patient
// ---------------------------------------------------------

router.get("/patient/:patientId", auth, getPatientConflicts);

// ---------------------------------------------------------
// Get a specific conflict
// ---------------------------------------------------------

router.get("/:conflictId", auth, getConflict);

// ---------------------------------------------------------
// Resolve a conflict
// ---------------------------------------------------------

router.post("/:conflictId/resolve", auth, resolveConflict);

module.exports = router;
