const SyncConflict = require("../models/SyncConflict");
const Patient = require("../models/Patient");

// ---------------------------------------------------------
// Add a candidate to an existing conflict or create a new
// conflict group.
// ---------------------------------------------------------
exports.createOrAppendConflict = async ({
  patientId,
  entityType,
  entityKey,
  baseUpdatedAt,
  incomingCandidate,
  serverCandidate,
}) => {
  try {
    let conflict = await SyncConflict.findOne({
      patientId,
      entityType,
      entityKey,
      status: "pending",
    });

    // -----------------------------------------------------
    // No existing conflict
    // -----------------------------------------------------
    if (!conflict) {
      conflict = new SyncConflict({
        patientId,
        entityType,
        entityKey,
        baseUpdatedAt: baseUpdatedAt || null,
        candidates: [],
        status: "pending",
      });

      if (serverCandidate) {
        conflict.candidates.push(serverCandidate);
      }

      conflict.candidates.push(incomingCandidate);

      await conflict.save();

      return conflict;
    }

    // -----------------------------------------------------
    // Existing conflict
    // -----------------------------------------------------

    const alreadyExists = conflict.candidates.some(
      (candidate) => candidate.operationId === incomingCandidate.operationId,
    );

    // -----------------------------------------------------
    // Keep the server candidate current.
    // -----------------------------------------------------
    if (serverCandidate) {
      const serverIndex = conflict.candidates.findIndex(
        (candidate) => candidate.source === "server",
      );

      if (serverIndex >= 0) {
        conflict.candidates[serverIndex] = serverCandidate;
      } else {
        conflict.candidates.unshift(serverCandidate);
      }
    }

    // -----------------------------------------------------
    // Add the new offline candidate.
    // -----------------------------------------------------
    if (!alreadyExists) {
      conflict.candidates.push(incomingCandidate);
    }

    await conflict.save();

    return conflict;
  } catch (err) {
    console.error("CREATE/APPEND SYNC CONFLICT ERROR:", err);

    throw err;
  }
};

// ---------------------------------------------------------
// Get pending conflicts for a patient
// ---------------------------------------------------------
exports.getPatientConflicts = async (req, res) => {
  try {
    const { patientId } = req.params;

    const conflicts = await SyncConflict.find({
      patientId,
      status: "pending",
    })
      .populate({
        path: "candidates.ownerKey",
        select: "name full_name role",
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(conflicts);
  } catch (err) {
    console.error("GET PATIENT CONFLICTS ERROR:", err);

    return res.status(500).json({
      message: "Failed to fetch patient conflicts",
      error: err.message,
    });
  }
};

// ---------------------------------------------------------
// Get one conflict
// ---------------------------------------------------------
exports.getConflict = async (req, res) => {
  try {
    const { conflictId } = req.params;

    const conflict = await SyncConflict.findById(conflictId)
      .populate({
        path: "candidates.ownerKey",
        select: "name full_name role",
      })
      .lean();

    if (!conflict) {
      return res.status(404).json({
        message: "Conflict not found",
      });
    }

    return res.json(conflict);
  } catch (err) {
    console.error("GET CONFLICT ERROR:", err);

    return res.status(500).json({
      message: "Failed to fetch conflict",
      error: err.message,
    });
  }
};

// ---------------------------------------------------------
// Resolve a conflict
// ---------------------------------------------------------
exports.resolveConflict = async (req, res) => {
  try {
    const { conflictId } = req.params;

    const { selectedOperationId, resolvedData } = req.body;

    if (!selectedOperationId) {
      return res.status(400).json({
        message: "selectedOperationId is required",
      });
    }

    const conflict = await SyncConflict.findById(conflictId);

    if (!conflict) {
      return res.status(404).json({
        message: "Conflict not found",
      });
    }

    if (conflict.status !== "pending") {
      return res.status(400).json({
        message: "Conflict has already been resolved",
      });
    }

    // -----------------------------------------------------
    // Find the candidate selected by the user
    // -----------------------------------------------------

    const selectedCandidate = conflict.candidates.find(
      (candidate) => candidate.operationId === selectedOperationId,
    );

    if (!selectedCandidate) {
      return res.status(400).json({
        message: "Selected candidate was not found",
      });
    }

    // -----------------------------------------------------
    // Determine the final data.
    //
    // If the frontend sends resolvedData, use it.
    // Otherwise use the selected candidate's data.
    // -----------------------------------------------------

    const finalData =
      resolvedData !== undefined ? resolvedData : selectedCandidate.data;

    // -----------------------------------------------------
    // Apply the selected version to the patient
    // -----------------------------------------------------

    const patient = await Patient.findById(conflict.patientId);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    // -----------------------------------------------------
    // Handle doctorRecord conflicts
    // -----------------------------------------------------

    if (conflict.entityType === "doctorRecord") {
      /*
       * The selected candidate represents a doctor
       * consultation/record.
       *
       * If the candidate contains the complete patient
       * document, replace the patient's doctorSheets.
       *
       * Otherwise add the selected doctor record.
       */

      if (finalData && Array.isArray(finalData.doctorSheets)) {
        patient.doctorSheets = finalData.doctorSheets;
      } else {
        patient.doctorSheets.push({
          ...finalData,
          date: finalData.date || new Date(),
        });
      }
    }

    // -----------------------------------------------------
    // Handle patient conflicts
    // -----------------------------------------------------
    else if (conflict.entityType === "patient") {
      if (!finalData || typeof finalData !== "object") {
        return res.status(400).json({
          message: "Invalid patient data",
        });
      }

      Object.keys(finalData).forEach((key) => {
        if (
          key !== "_id" &&
          key !== "__v" &&
          key !== "createdAt" &&
          key !== "updatedAt"
        ) {
          patient[key] = finalData[key];
        }
      });
    } else {
      return res.status(400).json({
        message: "Unsupported conflict entity type",
      });
    }

    await patient.save();

    // -----------------------------------------------------
    // Mark conflict as resolved
    // -----------------------------------------------------

    conflict.status = "resolved";
    conflict.resolvedCandidateOperationId = selectedOperationId;
    conflict.resolvedData = finalData;
    conflict.resolvedBy = req.user?.id || null;
    conflict.resolvedAt = new Date();

    await conflict.save();

    // -----------------------------------------------------
    // Notify connected clients
    // -----------------------------------------------------

    const io = req.app.get("io");

    if (io) {
      io.emit("queueUpdated");

      io.emit("syncConflictResolved", {
        conflictId: conflict._id,
        patientId: conflict.patientId,
      });
    }

    return res.json({
      message: "Conflict resolved successfully",
      conflict,
      patient,
    });
  } catch (err) {
    console.error("RESOLVE SYNC CONFLICT ERROR:", err);

    return res.status(500).json({
      message: "Failed to resolve conflict",
      error: err.message,
    });
  }
};
