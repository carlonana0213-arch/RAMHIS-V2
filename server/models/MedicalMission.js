const mongoose = require("mongoose");
const MissionSchema = new mongoose.Schema({
  title: String,
  missionDate: Date,

  province: String,
  municipality: String,
  barangay: String,
  location: String,

  patientCount: Number,

  patients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
  ],

  prescriptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
  ],

  analyticsSnapshot: {
    clinicDistribution: Object,
    topDiagnoses: Object,
    topMedicines: Object,
  },
});

module.exports = mongoose.model("Mission", MissionSchema);
