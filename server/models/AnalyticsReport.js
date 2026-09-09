const mongoose = require("mongoose");

const analyticsReportSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },

    nextMissionDate: {
      type: Date,
      required: true,
    },

    missionDays: {
      type: Number,
      required: true,
      min: 1,
    },

    predictedPatients: {
      type: Number,
      default: 0,
    },

    confidence: {
      type: String,
      default: "",
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reportData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

analyticsReportSchema.index({
  location: 1,
  createdAt: -1,
});

module.exports = mongoose.model("AnalyticsReport", analyticsReportSchema);
