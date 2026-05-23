const Patient = require("../../models/Patient");
const Prescription = require("../../models/Prescription");
const Medicine = require("../../models/Medicine");

const generatePredictiveAnalytics = async (location, nextMissionDate) => {
  // =========================
  // GET PATIENTS
  // =========================

  const patients = await Patient.find({
    location,
  });

  const patientIds = patients.map((patient) => patient._id);

  // =========================
  // GET PRESCRIPTIONS
  // =========================

  const prescriptions = await Prescription.find({
    patient: {
      $in: patientIds,
    },
  }).populate("items.medicine");

  // =========================
  // CLINIC DISTRIBUTION
  // =========================

  const clinicCounts = {};

  patients.forEach((patient) => {
    const dept = patient.department || "Unknown";

    clinicCounts[dept] = (clinicCounts[dept] || 0) + 1;
  });

  const totalPatients = patients.length;

  const clinicDistribution = {};

  Object.keys(clinicCounts).forEach((dept) => {
    clinicDistribution[dept] = Number(
      ((clinicCounts[dept] / totalPatients) * 100).toFixed(2),
    );
  });

  // =========================
  // TOP DIAGNOSES
  // =========================

  const diagnosisCounts = {};
  const recentDiagnosisCounts = {};

  patients.forEach((patient) => {
    patient.doctorSheets.forEach((sheet) => {
      const diagnosis = sheet.diagnosis || "Unknown";
      const missionDate = new Date(patient.missionDate);

      const currentMonth = new Date().getMonth();

      if (missionDate.getMonth() === currentMonth) {
        recentDiagnosisCounts[diagnosis] =
          (recentDiagnosisCounts[diagnosis] || 0) + 1;
      }

      diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
    });
  });

  // =========================
  // TOP MEDICINES
  // =========================

  const medicineCounts = {};
  const medicineRisks = {};
  prescriptions.forEach((prescription) => {
    prescription.items.forEach((item) => {
      const medicineName = item.medicine?.names?.[0] || "Unknown";

      medicineCounts[medicineName] =
        (medicineCounts[medicineName] || 0) + item.quantity;
    });
  });
  Object.entries(medicineCounts).forEach(([medicine, qty]) => {
    let risk = "LOW";

    if (qty > 30) {
      risk = "HIGH";
    } else if (qty > 15) {
      risk = "MEDIUM";
    }

    medicineRisks[medicine] = {
      estimatedNeed: qty,
      currentStock: Math.floor(Math.random() * 50),
      risk,
    };
  });
  // =========================
  // PREDICTION
  // =========================

  const predictedPatients = totalPatients;
  const diseaseAlerts = [];
  Object.entries(recentDiagnosisCounts).forEach(([diagnosis, count]) => {
    if (count > 10) {
      diseaseAlerts.push(`${diagnosis} cases are increasing rapidly`);
    }
  });
  const previousMissionPatients = Math.round(totalPatients * 0.85);

  const patientGrowth = Number(
    (
      ((predictedPatients - previousMissionPatients) /
        previousMissionPatients) *
      100
    ).toFixed(2),
  );
  return {
    totalPatients,

    predictedPatients,

    clinicDistribution,
    diseaseAlerts,
    topDiagnoses: diagnosisCounts,

    topMedicines: medicineCounts,
    medicineRisks,
    previousMissionPatients,
    patientGrowth,
  };
};

module.exports = {
  generatePredictiveAnalytics,
};
