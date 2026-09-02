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
    // Look for an existing unresolved conflict for this
    // patient/entity.
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

      // Preserve the version that is currently on the server.
      if (serverCandidate) {
        conflict.candidates.push(serverCandidate);
      }

      // Preserve the newly arriving offline version.
      conflict.candidates.push(incomingCandidate);

      await conflict.save();

      return conflict;
    }

    // -----------------------------------------------------
    // Existing conflict
    // -----------------------------------------------------
    //
    // Don't add the same operation twice.
    //
    const alreadyExists = conflict.candidates.some(
      (candidate) => candidate.operationId === incomingCandidate.operationId,
    );

    if (!alreadyExists) {
      conflict.candidates.push(incomingCandidate);
      await conflict.save();
    }

    return conflict;
  } catch (err) {
    console.error("CREATE/APPEND SYNC CONFLICT ERROR:", err);

    throw err;
  }
};
