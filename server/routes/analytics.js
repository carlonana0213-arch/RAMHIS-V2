const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");

router.get("/", async (req, res) => {
  try {
    const { mission } = req.query;

    let query = {};

    if (mission === "latest") {
      const latest = await Patient.find().sort({ missionDate: -1 }).limit(1);
      if (latest.length > 0) {
        query.missionDate = latest[0].missionDate;
      }
    }

    const patients = await Patient.find(query);

    const genderStats = {};
    const diagnosisStats = {};
    const medicineStats = {};

    const prescriptions = await Prescription.find().populate("patientId");

    prescriptions.forEach((p) => {
      if (!p.patientId) return;

      const included = patients.some(
        (pt) => pt._id.toString() === p.patientId._id.toString(),
      );

      if (!included) return;

      // diagnosis
      if (p.diagnosis) {
        diagnosisStats[p.diagnosis] = (diagnosisStats[p.diagnosis] || 0) + 1;
      }

      // medicines
      if (Array.isArray(p.medicines)) {
        p.medicines.forEach((m) => {
          medicineStats[m] = (medicineStats[m] || 0) + 1;
        });
      }
    });

    patients.forEach((p) => {
      const gender = p.generalInfo?.gender;
      if (gender) {
        genderStats[gender] = (genderStats[gender] || 0) + 1;
      }
    });

    res.json({
      patients,
      genderStats,
      diagnosisStats,
      medicineStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
