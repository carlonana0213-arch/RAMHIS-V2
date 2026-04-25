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
      ref: "User", // if you have doctors in user model
    },
    items: [prescriptionItemSchema],
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
