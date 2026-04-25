const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");

router.get("/", async (req, res) => {
  try {
    const { mission } = req.query;

    let query = {};

    // ✅ FIXED latest mission logic
    let latestDate = null;

    if (mission === "latest") {
      const latestPatient = await Patient.findOne()
        .sort({ missionDate: -1 })
        .lean();

      if (latestPatient?.missionDate) {
        latestDate = latestPatient.missionDate;
        query.missionDate = latestDate;
      }
    }

    const patients = await Patient.find(query);
    if (!patients || patients.length === 0) {
      return res.json({
        patients: [],
        genderStats: {},
        diagnosisStats: {},
        medicineStats: {},
      });
    }
    const genderStats = {};
    const diagnosisStats = {};
    const medicineStats = {};

    const prescriptions = await Prescription.find().populate({
      path: "patientId",
      model: "Patient",
      options: { strictPopulate: false },
    });
    // ✅ FIXED patient ID matching
    const patientIds = new Set(patients.map((p) => p._id.toString()));

    prescriptions.forEach((p) => {
      if (!p.patientId || !p.patientId._id) return;
      if (!patientIds.has(p.patientId._id.toString())) return;

      // ✅ SAFE diagnosis handling
      if (Array.isArray(p.diagnosis)) {
        p.diagnosis.forEach((d) => {
          diagnosisStats[d] = (diagnosisStats[d] || 0) + 1;
        });
      } else if (p.diagnosis) {
        diagnosisStats[p.diagnosis] = (diagnosisStats[p.diagnosis] || 0) + 1;
      }

      // ✅ SAFE medicine handling
      if (Array.isArray(p.medicines)) {
        p.medicines.forEach((m) => {
          medicineStats[m] = (medicineStats[m] || 0) + 1;
        });
      }
    });

    // ✅ Gender stats
    patients.forEach((p) => {
      const gender = p.generalInfo?.gender;
      if (gender) {
        genderStats[gender] = (genderStats[gender] || 0) + 1;
      }
    });

    // ✅ ALWAYS send response
    res.json({
      patients,
      genderStats,
      diagnosisStats,
      medicineStats,
    });
  } catch (err) {
    console.error("ANALYTICS ERROR:", err);

    res.status(500).json({
      error: err.message || "Analytics route failed",
    });
  }
});

module.exports = router;
