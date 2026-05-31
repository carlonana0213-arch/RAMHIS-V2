const mongoose = require("mongoose");

const prescriptionItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  directions: {
    type: String,
    required: true,
  },

  isGiven: {
    type: Boolean,
    default: false,
  },
});

const prescriptionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    items: [prescriptionItemSchema],

    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    eventTitle: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ createdAt: 1 });
prescriptionSchema.index({ "items.medicine": 1 });
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ eventId: 1 });
prescriptionSchema.index({ status: 1, eventId: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);