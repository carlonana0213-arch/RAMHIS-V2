const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getPendingConflicts,
  getPatientConflicts,
  getConflict,
  resolveConflict,
} = require("../controllers/SyncConflictController");

// ---------------------------------------------------------
// Get every pending conflict (must stay above "/:conflictId")
// ---------------------------------------------------------

router.get("/pending", auth, getPendingConflicts);

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
