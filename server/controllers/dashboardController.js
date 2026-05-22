const Patient = require("../models/Patient");
const User = require("../models/user");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");

const STAFF_ROLES = [
  "volunteer",
  "Volunteer",
  "doctor",
  "Doctor",
  "pharmacist",
  "Pharmacist",
];

function getDateValue(doc) {
  return doc.createdAt || doc.created_at || doc.dateCreated || null;
}

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();

    const totalUsers = await User.countDocuments({
      role: { $in: STAFF_ROLES },
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
    const previousMonth =
      currentMonth === 0 ? 11 : currentMonth - 1;

    const allPatients = await Patient.find();
    const allUsers = await User.find({
      role: { $in: STAFF_ROLES },
    });

    let currentPatients = 0;
    let previousPatients = 0;
    let currentUsers = 0;
    let previousUsers = 0;

    allPatients.forEach((patient) => {
      const created = getDateValue(patient);
      if (!created) return;

      const month = new Date(created).getMonth();

      if (month === currentMonth) currentPatients++;
      if (month === previousMonth) previousPatients++;
    });

    allUsers.forEach((user) => {
      const created = getDateValue(user);
      if (!created) return;

      const month = new Date(created).getMonth();

      if (month === currentMonth) currentUsers++;
      if (month === previousMonth) previousUsers++;
    });

    return res.json({
      ok: true,
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
    return res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
};

exports.getPatientTrends = async (req, res) => {
  try {
    const patients = await Patient.find();
    const prescriptions = await Prescription.find();

    const staffUsers = await User.find({
      role: { $in: STAFF_ROLES },
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

    months.forEach((month) => {
      monthlyData[month] = {
        patients: 0,
        prescriptions: 0,
        volunteers: 0,
      };
    });

    patients.forEach((patient) => {
      const created = getDateValue(patient);
      if (!created) return;

      const month = months[new Date(created).getMonth()];
      monthlyData[month].patients++;
    });

    prescriptions.forEach((prescription) => {
      const created = getDateValue(prescription);
      if (!created) return;

      const month = months[new Date(created).getMonth()];
      monthlyData[month].prescriptions++;
    });

    staffUsers.forEach((user) => {
      const created = getDateValue(user);
      if (!created) return;

      const month = months[new Date(created).getMonth()];
      monthlyData[month].volunteers++;
    });

    const result = months.map((month) => ({
      month,
      patients: monthlyData[month].patients,
      prescriptions: monthlyData[month].prescriptions,
      volunteers: monthlyData[month].volunteers,
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
};

exports.getDiagnosisDistribution = async (req, res) => {
  try {
    const patients = await Patient.find();

    const diagnosisMap = {};

    patients.forEach((patient) => {
      const sheets = Array.isArray(patient.doctorSheets)
        ? patient.doctorSheets
        : [];

      sheets.forEach((sheet) => {
        const diagnosis = String(sheet.diagnosis || "").trim();

        if (diagnosis) {
          diagnosisMap[diagnosis] =
            (diagnosisMap[diagnosis] || 0) + 1;
        }
      });
    });

    const sorted = Object.keys(diagnosisMap)
      .map((key) => ({
        name: key,
        value: diagnosisMap[key],
      }))
      .sort((a, b) => b.value - a.value);

    const topThree = sorted.slice(0, 3);

    const othersTotal = sorted
      .slice(3)
      .reduce((sum, item) => sum + item.value, 0);

    return res.json([
      ...topThree,
      ...(othersTotal > 0
        ? [
            {
              name: "Others",
              value: othersTotal,
            },
          ]
        : []),
    ]);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
};

exports.getTopMedicines = async (req, res) => {
  try {
    const prescriptions = await Prescription.find().populate(
      "items.medicine"
    );

    const medicineMap = {};

    prescriptions.forEach((prescription) => {
      const items = Array.isArray(prescription.items)
        ? prescription.items
        : [];

      items.forEach((item) => {
        const medName =
          item.medicine?.names?.[0] ||
          item.medicine?.name ||
          item.medicineName ||
          "Unknown";

        const quantity = Number(item.quantity || 0);

        medicineMap[medName] =
          (medicineMap[medName] || 0) + quantity;
      });
    });

    const sorted = Object.keys(medicineMap)
      .map((key) => ({
        medicine: key,
        count: medicineMap[key],
      }))
      .sort((a, b) => b.count - a.count);

    const topThree = sorted.slice(0, 3);

    const othersTotal = sorted
      .slice(3)
      .reduce((sum, item) => sum + item.count, 0);

    return res.json([
      ...topThree,
      ...(othersTotal > 0
        ? [
            {
              medicine: "Others",
              count: othersTotal,
            },
          ]
        : []),
    ]);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
};