const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");

router.get("/", async (req, res) => {
  try {
    const { mission } = req.query;

    const patients = await Patient.find();

    // 🔍 Get latest mission
    const latestDate = [...new Set(patients.map((p) => p.missionDate))]
      .sort()
      .pop();

    const filteredPatients =
      mission === "latest"
        ? patients.filter((p) => p.missionDate === latestDate)
        : patients;

    // 📊 Gender
    const genderStats = {};

    // 📊 Diagnosis + Medicine
    const diagnosisStats = {};
    const medicineStats = {};

    const prescriptions = await Prescription.find().populate("patientId");

    prescriptions.forEach((p) => {
      if (!p.patientId) return;

      const isIncluded = filteredPatients.some(
        (fp) => fp._id.toString() === p.patientId._id.toString(),
      );

      if (!isIncluded) return;

      // diagnosis
      diagnosisStats[p.diagnosis] = (diagnosisStats[p.diagnosis] || 0) + 1;

      // medicines
      p.medicines.forEach((m) => {
        medicineStats[m] = (medicineStats[m] || 0) + 1;
      });
    });

    filteredPatients.forEach((p) => {
      genderStats[p.gender] = (genderStats[p.gender] || 0) + 1;
    });

    res.json({
      patients: filteredPatients,
      genderStats,
      diagnosisStats,
      medicineStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
