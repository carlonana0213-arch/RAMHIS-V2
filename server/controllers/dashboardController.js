const Patient = require("../models/Patient");
const User = require("../models/user");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalMedicines = await Medicine.countDocuments();

    const pendingPrescriptions = await Prescription.countDocuments({
      status: "Pending",
    });

    const lowStock = await Medicine.countDocuments({
      quantity: { $gt: 0, $lte: 50 },
    });

    const outOfStock = await Medicine.countDocuments({
      quantity: 0,
    });

    res.json({
      totalPatients,
      totalUsers,
      totalMedicines,
      pendingPrescriptions,
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
    const patients = await Patient.find().sort({
      createdAt: 1,
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

    // initialize all months
    months.forEach((month) => {
      monthlyData[month] = 0;
    });

    patients.forEach((patient) => {
      const date = new Date(patient.createdAt);

      const month = months[date.getMonth()];

      monthlyData[month]++;
    });

    const result = months.map((month) => ({
      month,
      patients: monthlyData[month],
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
      patient.doctorSheets.forEach((sheet) => {
        const diagnosis = sheet.diagnosis;

        if (diagnosis && diagnosis.trim() !== "") {
          diagnosisMap[diagnosis] = (diagnosisMap[diagnosis] || 0) + 1;
        }
      });
    });

    const result = Object.keys(diagnosisMap).map((key) => ({
      name: key,
      value: diagnosisMap[key],
    }));

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
      prescription.items.forEach((item) => {
        const medName = item.medicine?.names?.[0] || "Unknown";

        medicineMap[medName] = (medicineMap[medName] || 0) + item.quantity;
      });
    });

    const result = Object.keys(medicineMap)
      .map((key) => ({
        medicine: key,
        count: medicineMap[key],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
