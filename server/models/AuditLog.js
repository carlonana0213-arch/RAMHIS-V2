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

    ipAddress: {
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

module.exports =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);