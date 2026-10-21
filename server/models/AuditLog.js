const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "",
    },

    userName: {
      type: String,
      default: "System",
    },

    userRole: {
      type: String,
      default: "",
    },

    userEmail: {
      type: String,
      default: "",
    },

    userDepartment: {
      type: String,
      default: "",
    },

    module: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Outcome of the action. Failed/Blocked entries are kept so that
    // rejected attempts (bad logins, duplicate registrations, ...) are
    // part of the trail as well.
    status: {
      type: String,
      enum: ["Success", "Failed", "Blocked"],
      default: "Success",
    },

    // Why an action failed or was blocked.
    reason: {
      type: String,
      default: "",
    },

    targetType: {
      type: String,
      default: "",
    },

    targetId: {
      type: String,
      default: "",
    },

    targetName: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "System",
      trim: true,
    },

    eventId: {
      type: String,
      default: "",
    },

    eventTitle: {
      type: String,
      default: "",
    },

    // "Online" for direct requests, "Offline Sync" when the action was
    // recorded offline and replayed from the device outbox.
    source: {
      type: String,
      default: "Online",
    },

    // Offline outbox operation that produced this action (if any).
    operationId: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    device: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    method: {
      type: String,
      default: "",
    },

    path: {
      type: String,
      default: "",
    },

    // Field-level before/after values for update-type actions.
    changes: {
      type: [
        {
          _id: false,
          field: String,
          label: String,
          before: mongoose.Schema.Types.Mixed,
          after: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ location: 1 });
AuditLogSchema.index({ userName: 1 });
AuditLogSchema.index({ status: 1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);