const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");

router.get("/", async (req, res) => {
  try {
    const { mission } = req.query;

    let query = {};

    // ✅ FIX: Proper latest mission logic (no duplicate blocks, no scope errors)
    if (mission === "latest") {
      const latestPatient = await Patient.findOne({
        missionDate: { $exists: true, $ne: null },
      })
        .sort({ missionDate: -1 })
        .lean();

      if (latestPatient?.missionDate) {
        query.missionDate = latestPatient.missionDate;
      }
    }

    // ✅ Fetch patients
    const patients = await Patient.find(query).lean();

    // ✅ Handle empty dataset safely
    if (!patients || patients.length === 0) {
      return res.json({
        patients: [],
        genderStats: {},
        diagnosisStats: {},
        medicineStats: {},
      });
    }

    // ✅ Initialize stats
    const genderStats = {};
    const diagnosisStats = {};
    const medicineStats = {};

    // ✅ OPTIMIZED: Only fetch relevant prescriptions
    const patientIds = patients.map((p) => p._id);

    const prescriptions = await Prescription.find({
      patientId: { $in: patientIds },
    }).lean();

    // ✅ Process prescriptions
    prescriptions.forEach((p) => {
      // ---- Diagnosis ----
      if (Array.isArray(p.diagnosis)) {
        p.diagnosis.forEach((d) => {
          const key = (d || "unknown").toString().toLowerCase();
          diagnosisStats[key] = (diagnosisStats[key] || 0) + 1;
        });
      } else if (p.diagnosis) {
        const key = p.diagnosis.toString().toLowerCase();
        diagnosisStats[key] = (diagnosisStats[key] || 0) + 1;
      }

      // ---- Medicines ----
      if (Array.isArray(p.medicines)) {
        p.medicines.forEach((m) => {
          const medName = typeof m === "string" ? m : m?.name || "unknown";

          const key = medName.toLowerCase();
          medicineStats[key] = (medicineStats[key] || 0) + 1;
        });
      }
    });

    // ✅ Gender stats
    patients.forEach((p) => {
      const gender = p.generalInfo?.gender?.toLowerCase();
      if (gender) {
        genderStats[gender] = (genderStats[gender] || 0) + 1;
      }
    });

    // ✅ Final response
    res.json({
      patients,
      genderStats,
      diagnosisStats,
      medicineStats,
    });
  } catch (err) {
    console.error("ANALYTICS ERROR FULL:", err);

    res.status(500).json({
      error: err.message,
      stack: err.stack, // remove in production later
    });
  }
});

module.exports = router;
