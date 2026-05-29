const Patient = require("../models/Patient");
const User = require("../models/user");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");

exports.getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [
      totalPatients,
      totalUsers,
      totalMedicines,
      lowStock,
      outOfStock,
      patientStats,
      userStats,
    ] = await Promise.all([
      Patient.countDocuments(),

      User.countDocuments({
        role: { $in: ["Volunteer", "Doctor"] },
      }),

      Medicine.countDocuments(),

      Medicine.countDocuments({
        quantity: { $gt: 0, $lte: 50 },
      }),

      Medicine.countDocuments({
        quantity: 0,
      }),

      Patient.aggregate([
        {
          $match: {
            createdAt: {
              $type: "date",
            },
          },
        },
        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
              year: {
                $year: "$createdAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      User.aggregate([
        {
          $match: {
            role: {
              $in: ["Volunteer", "Doctor"],
            },
            createdAt: {
              $type: "date",
            },
          },
        },
        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
              year: {
                $year: "$createdAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    const currentPatients =
      patientStats.find(
        (p) => p._id.month === currentMonth && p._id.year === currentYear,
      )?.count || 0;

    const previousPatients =
      patientStats.find(
        (p) => p._id.month === previousMonth && p._id.year === previousYear,
      )?.count || 0;

    const currentUsers =
      userStats.find(
        (u) => u._id.month === currentMonth && u._id.year === currentYear,
      )?.count || 0;

    const previousUsers =
      userStats.find(
        (u) => u._id.month === previousMonth && u._id.year === previousYear,
      )?.count || 0;

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

    const [patientStats, prescriptionStats, volunteerStats] = await Promise.all(
      [
        Patient.aggregate([
          {
            $match: {
              missionDate: {
                $type: "date",
              },
            },
          },
          {
            $group: {
              _id: {
                $month: "$missionDate",
              },
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        Prescription.aggregate([
          {
            $match: {
              createdAt: {
                $type: "date",
              },
            },
          },
          {
            $group: {
              _id: {
                $month: "$createdAt",
              },
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        User.aggregate([
          {
            $match: {
              role: {
                $in: ["Volunteer", "Doctor"],
              },
              createdAt: {
                $type: "date",
              },
            },
          },
          {
            $group: {
              _id: {
                $month: "$createdAt",
              },
              count: {
                $sum: 1,
              },
            },
          },
        ]),
      ],
    );

    const result = months.map((month, index) => {
      const monthNumber = index + 1;

      return {
        month,

        patients: patientStats.find((p) => p._id === monthNumber)?.count || 0,

        prescriptions:
          prescriptionStats.find((p) => p._id === monthNumber)?.count || 0,

        volunteers:
          volunteerStats.find((v) => v._id === monthNumber)?.count || 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Patient trends error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getDiagnosisDistribution = async (req, res) => {
  try {
    const diagnoses = await Patient.aggregate([
      {
        $unwind: "$doctorSheets",
      },

      {
        $match: {
          "doctorSheets.diagnosis": {
            $type: "string",
            $ne: "",
          },
        },
      },

      {
        $group: {
          _id: {
            $trim: {
              input: "$doctorSheets.diagnosis",
            },
          },
          value: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          value: -1,
        },
      },
    ]);

    const topThree = diagnoses.slice(0, 3);

    const othersTotal = diagnoses
      .slice(3)
      .reduce((sum, item) => sum + item.value, 0);

    const result = [
      ...topThree.map((d) => ({
        name: d._id,
        value: d.value,
      })),

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
    console.error("Diagnosis distribution error:", err);

    res.status(500).json({
      message: err.message,
    });
  } finally {
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
