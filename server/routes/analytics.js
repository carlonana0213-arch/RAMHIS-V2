const express = require("express");

const router = express.Router();

const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");

// ── Helpers ──────────────────────────────────────────────────────
function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);

    if (!key) return acc;

    acc[key] = (acc[key] || 0) + 1;

    return acc;
  }, {});
}

function toTopList(stats, limit = 5) {
  return Object.entries(stats)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getPercentage(count, total) {
  if (!total) return 0;

  return Math.round((count / total) * 100);
}

async function getLatestMissionQuery(mission) {
  const query = {};

  // ✅ Keep original latest mission logic
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

  return query;
}

// ────────────────────────────────────────────────────────────────
// EXISTING WEB ANALYTICS
// ⚠️ DO NOT BREAK — used by web analytics dashboard
// GET /api/analytics
// ────────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { mission } = req.query;

    const query = await getLatestMissionQuery(mission);

    // ✅ Original patient fetch
    const patients = await Patient.find(query).lean();

    // ✅ Keep original empty handling
    if (!patients || patients.length === 0) {
      return res.json({
        ok: true,
        patients: [],
        genderStats: {},
        diagnosisStats: {},
        medicineStats: {},
      });
    }

    // ✅ Original stats
    const genderStats = {};
    const diagnosisStats = {};
    const medicineStats = {};

    // ✅ Original optimized prescription fetch
    const patientIds = patients.map((p) => p._id);

    const prescriptions = await Prescription.find({
      patientId: { $in: patientIds },
    }).lean();

    // ✅ Original diagnosis + medicine processing
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
          const medName =
            typeof m === "string"
              ? m
              : m?.name || "unknown";

          const key = medName.toLowerCase();

          medicineStats[key] =
            (medicineStats[key] || 0) + 1;
        });
      }
    });

    // ✅ Original gender stats
    patients.forEach((p) => {
      const gender =
        p.generalInfo?.gender?.toLowerCase();

      if (gender) {
        genderStats[gender] =
          (genderStats[gender] || 0) + 1;
      }
    });

    // ✅ ORIGINAL RESPONSE PRESERVED
    return res.json({
      ok: true,
      patients,
      genderStats,
      diagnosisStats,
      medicineStats,
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// NEW MOBILE ANALYTICS SUMMARY
// ✅ Added ONLY for HomepageScreen
// GET /api/analytics/mobile-summary
// ────────────────────────────────────────────────────────────────
router.get("/mobile-summary", async (req, res, next) => {
  try {
    const { mission } = req.query;

    const query = await getLatestMissionQuery(mission);

    const patients = await Patient.find(query).lean();

    const totalPatients = patients.length;

    const patientIds = patients.map((p) => p._id);

    const prescriptions = await Prescription.find({
      patientId: { $in: patientIds },
    }).lean();

    const totalPrescriptions = prescriptions.length;

    // ── Province analytics ───────────────────────────────────────
    const provinceStats = countBy(patients, (patient) => {
      return (
        patient.generalInfo?.province ||
        patient.address?.province ||
        patient.province ||
        "Unknown"
      );
    });

    const topProvince =
      toTopList(provinceStats, 1)[0] || {
        name: "No data",
        count: 0,
      };

    // ── Diagnosis analytics ──────────────────────────────────────
    const diagnosisStats = {};

    prescriptions.forEach((prescription) => {
      const diagnosisValue =
        prescription.diagnosis ||
        prescription.remarks ||
        prescription.diagnosisRemarks;

      if (Array.isArray(diagnosisValue)) {
        diagnosisValue.forEach((diagnosis) => {
          const key = String(
            diagnosis || "unknown"
          ).toLowerCase();

          diagnosisStats[key] =
            (diagnosisStats[key] || 0) + 1;
        });
      } else if (diagnosisValue) {
        const key = String(diagnosisValue).toLowerCase();

        diagnosisStats[key] =
          (diagnosisStats[key] || 0) + 1;
      }
    });

    const topDiagnosis =
      toTopList(diagnosisStats, 1)[0] || {
        name: "No data",
        count: 0,
      };

    // ── Medicine analytics ───────────────────────────────────────
    const medicineStats = {};

    prescriptions.forEach((prescription) => {
      if (Array.isArray(prescription.medicines)) {
        prescription.medicines.forEach((medicine) => {
          const medName =
            typeof medicine === "string"
              ? medicine
              : medicine?.name ||
                medicine?.medicineName ||
                medicine?.genericName ||
                "unknown";

          const key = String(medName).toLowerCase();

          medicineStats[key] =
            (medicineStats[key] || 0) + 1;
        });
      }
    });

    const mostUsedMedicines = toTopList(
      medicineStats,
      5
    ).map((medicine) => ({
      name: medicine.name,
      count: medicine.count,
      demand:
        medicine.count >= 50
          ? "High"
          : medicine.count >= 25
          ? "Moderate"
          : "Stable",
    }));

    // ── Clinic distribution ──────────────────────────────────────
    const clinicStats = {};

    patients.forEach((patient) => {
      const clinic =
        patient.clinic ||
        patient.clinicType ||
        patient.department ||
        patient.serviceType ||
        patient.generalInfo?.clinic ||
        "General Medicine";

      clinicStats[clinic] =
        (clinicStats[clinic] || 0) + 1;
    });

    const patientsPerClinic = Object.entries(clinicStats)
      .map(([clinic, count]) => ({
        clinic,
        count,
        percentage: getPercentage(
          count,
          totalPatients
        ),
      }))
      .sort((a, b) => b.count - a.count);

    // ── Health alert system ──────────────────────────────────────
    const healthAlert =
      topDiagnosis.count >= 10
        ? `Rising ${topDiagnosis.name} cases`
        : "No major health alert";

    // ✅ MOBILE RESPONSE ONLY
    return res.json({
      ok: true,

      summary: {
        totalPatients,

        totalPrescriptions,

        prescriptionVolume:
          totalPrescriptions,

        topProvince: {
          name: topProvince.name,
          count: topProvince.count,
        },

        topDiagnosis: {
          name: topDiagnosis.name,
          count: topDiagnosis.count,
          percentage: getPercentage(
            topDiagnosis.count,
            totalPrescriptions
          ),
        },

        healthAlert,

        // ✅ Requested:
        // Percentage of patients per clinic
        patientsPerClinic,

        // ✅ Requested:
        // Most used medicines
        mostUsedMedicines,

        // ✅ Homepage insight cards
        keyDrivers: [
          {
            label: "Top Province",
            value: topProvince.name,
            detail: `${topProvince.count} patients`,
          },

          {
            label: "Most Common Diagnosis",
            value: topDiagnosis.name,
            detail: `${getPercentage(
              topDiagnosis.count,
              totalPrescriptions
            )}% of prescriptions`,
          },

          {
            label: "Prescription Volume",
            value: totalPrescriptions,
            detail: "Total prescriptions",
          },

          {
            label: "Health Alert",
            value: healthAlert,
            detail:
              "Monitor and prepare resources",
          },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;