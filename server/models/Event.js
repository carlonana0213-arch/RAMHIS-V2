const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    googleMapsUrl: {
      type: String,
      trim: true,
      default: "",
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      trim: true,
    },

    endTime: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "Medical Mission",
        "Training",
        "Seminar",
        "Community Outreach",
        "Other",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },

    imageUrl: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: [participantSchema],
  },
  { timestamps: true }
);

eventSchema.index(
  { status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "Ongoing",
    },
    name: "only_one_ongoing_event",
  }
);

module.exports = mongoose.model("Event", eventSchema);