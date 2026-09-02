const mongoose = require("mongoose");

const conflictCandidateSchema = new mongoose.Schema(
  {
    // The user/device that created this version
    ownerKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The offline operation that produced this version
    operationId: {
      type: String,
      required: true,
    },

    // The data submitted by this user
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // The server version that this user was working from
    baseUpdatedAt: {
      type: Date,
      default: null,
    },

    // Whether this candidate came from the server's
    // already-accepted version or from an offline user
    source: {
      type: String,
      enum: ["server", "offline"],
      required: true,
    },

    // When this version entered the conflict group
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const syncConflictSchema = new mongoose.Schema(
  {
    // Patient whose data is in conflict
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    // What kind of data caused the conflict
    entityType: {
      type: String,
      required: true,
      enum: ["patient", "doctorRecord"],
      index: true,
    },

    // Used to identify the specific record being synchronized.
    // For doctorRecord conflicts this can be the patient ID or
    // the doctor-record ID depending on the operation.
    entityKey: {
      type: String,
      required: true,
      index: true,
    },

    // The server version from which the conflicting offline
    // operations originated.
    baseUpdatedAt: {
      type: Date,
      default: null,
    },

    // Every competing version is kept here.
    candidates: {
      type: [conflictCandidateSchema],
      default: [],
    },

    // pending = waiting for a user to resolve it
    // resolved = a final version has been selected
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
      index: true,
    },

    // Which candidate was ultimately selected
    resolvedCandidateOperationId: {
      type: String,
      default: null,
    },

    // The final data chosen/created by the resolver
    resolvedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SyncConflict", syncConflictSchema);
