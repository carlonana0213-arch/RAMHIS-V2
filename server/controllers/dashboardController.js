const Patient = require("../models/Patient");
const User = require("../models/user");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();

    const totalUsers = await User.countDocuments({
      role: { $in: ["Volunteer", "Doctor"] },
    });

    const totalMedicines = await Medicine.countDocuments();

    const lowStock = await Medicine.countDocuments({
      quantity: { $gt: 0, $lte: 50 },
    });

    const outOfStock = await Medicine.countDocuments({
      quantity: 0,
    });

    const now = new Date();

    const currentMonth = now.getMonth();

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    // =========================
    // PATIENTS
    // =========================
    const allPatients = await Patient.find();

    let currentPatients = 0;
    let previousPatients = 0;

    allPatients.forEach((patient) => {
      if (!patient.createdAt) return;

      const month = new Date(patient.createdAt).getMonth();

      if (month === currentMonth) {
        currentPatients++;
      }

      if (month === previousMonth) {
        previousPatients++;
      }
    });

    // =========================
    // USERS/VOLUNTEERS
    // =========================
    const allUsers = await User.find({
      role: {
        $in: ["Volunteer", "Doctor"],
      },
    });

    let currentUsers = 0;
    let previousUsers = 0;

    allUsers.forEach((user) => {
      if (!user.createdAt) return;

      const month = new Date(user.createdAt).getMonth();

      if (month === currentMonth) {
        currentUsers++;
      }

      if (month === previousMonth) {
        previousUsers++;
      }
    });

    res.json({
      totalPatients,
      totalUsers,
      totalMedicines,

      patientIncrease: currentPatients - previousPatients,

      currentPatients,

      previousPatients,

      userIncrease: currentUsers - previousUsers,

      lowStock,
      outOfStock,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPatientTrends = async (req, res) => {
  try {
    const patients = await Patient.find();

    const prescriptions = await Prescription.find();

    const volunteers = await User.find({
      role: {
        $in: ["Volunteer", "Doctor"],
      },
    });

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyData = {};

    // INITIALIZE
    months.forEach((month) => {
      monthlyData[month] = {
        patients: 0,
        prescriptions: 0,
        volunteers: 0,
      };
    });

    // =========================
    // PATIENTS
    // =========================
    patients.forEach((patient) => {
      if (!patient.missionDate) return;

      const date = new Date(patient.missionDate);

      if (isNaN(date)) return;

      const month = months[date.getMonth()];

      monthlyData[month].patients++;
    });

    // =========================
    // PRESCRIPTIONS
    // =========================
    prescriptions.forEach((prescription) => {
      if (!prescription.createdAt) return;

      const date = new Date(prescription.createdAt);

      const month = months[date.getMonth()];

      monthlyData[month].prescriptions++;
    });

    // =========================
    // VOLUNTEERS
    // =========================
    volunteers.forEach((user) => {
      if (!user.createdAt) return;

      const date = new Date(user.createdAt);

      const month = months[date.getMonth()];

      monthlyData[month].volunteers++;
    });

    const result = months.map((month) => ({
      month,

      patients: monthlyData[month].patients,

      prescriptions: monthlyData[month].prescriptions,

      volunteers: monthlyData[month].volunteers,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getDiagnosisDistribution = async (req, res) => {
  try {
    const patients = await Patient.find();

    const diagnosisMap = {};

    patients.forEach((patient) => {
      if (!patient.doctorSheets?.length) return;

      patient.doctorSheets.forEach((sheet) => {
        const rawDiagnosis = sheet?.diagnosis;

        // Skip null/undefined/empty
        if (!rawDiagnosis || typeof rawDiagnosis !== "string") return;

        const diagnosis = rawDiagnosis.trim();

        if (!diagnosis) return;

        // Preserve exact database input
        diagnosisMap[diagnosis] = (diagnosisMap[diagnosis] || 0) + 1;
      });
    });

    const sorted = Object.entries(diagnosisMap)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const topThree = sorted.slice(0, 3);

    const othersTotal = sorted
      .slice(3)
      .reduce((sum, item) => sum + item.value, 0);

    const result = [
      ...topThree,

      ...(othersTotal > 0
        ? [
            {
              name: "Others",
              value: othersTotal,
            },
          ]
        : []),
    ];

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getTopMedicines = async (req, res) => {
  try {
    const prescriptions = await Prescription.find().populate("items.medicine");

    const medicineMap = {};

    prescriptions.forEach((prescription) => {
      if (!prescription.items?.length) return;

      prescription.items.forEach((item) => {
        const rawMedicineName = item?.medicine?.names?.[0];

        // Skip missing instead of grouping into Unknown
        if (!rawMedicineName || typeof rawMedicineName !== "string") {
          return;
        }

        const medName = rawMedicineName.trim();

        if (!medName) return;

        // Keep exact DB input
        medicineMap[medName] =
          (medicineMap[medName] || 0) + (item.quantity || 1);
      });
    });

    const sorted = Object.entries(medicineMap)
      .map(([medicine, count]) => ({
        medicine,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const topThree = sorted.slice(0, 3);

    const othersTotal = sorted
      .slice(3)
      .reduce((sum, item) => sum + item.count, 0);

    const result = [
      ...topThree,

      ...(othersTotal > 0
        ? [
            {
              medicine: "Others",
              count: othersTotal,
            },
          ]
        : []),
    ];

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
 