const Patient = require("../models/Patient");
const User = require("../models/user");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");
const dashboardCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 mins
exports.getDashboardSummary = async (req, res) => {
  const cacheKey = "summary";

  if (
    dashboardCache[cacheKey] &&
    Date.now() - dashboardCache[cacheKey].timestamp < CACHE_DURATION
  ) {
    return res.json(dashboardCache[cacheKey].data);
  }
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
      Patient.estimatedDocumentCount(),

      User.countDocuments({
        role: { $in: ["Volunteer", "Doctor"] },
      }),

      Medicine.estimatedDocumentCount(),

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

    const result = {
      totalPatients,
      totalUsers,
      totalMedicines,

      patientIncrease: currentPatients - previousPatients,

      currentPatients,
      previousPatients,

      userIncrease: currentUsers - previousUsers,

      lowStock,
      outOfStock,
    };

    dashboardCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getPatientTrends = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    let selectedYear = parseInt(req.query.year);

    if (!selectedYear || isNaN(selectedYear)) {
      selectedYear = currentYear;
    }

    // Safety: block future years
    if (selectedYear > currentYear) {
      return res.status(400).json({
        message: "Future years are not allowed",
      });
    }

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
            $addFields: {
              parsedMissionDate: {
                $cond: [
                  { $eq: [{ $type: "$missionDate" }, "string"] },
                  { $dateFromString: { dateString: "$missionDate" } },
                  "$missionDate",
                ],
              },
            },
          },
          {
            $match: {
              parsedMissionDate: {
                $gte: new Date(`${selectedYear}-01-01`),
                $lt: new Date(`${selectedYear + 1}-01-01`),
              },
            },
          },
          {
            $group: {
              _id: {
                $month: "$parsedMissionDate",
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
                $gte: new Date(`${selectedYear}-01-01`),
                $lt: new Date(`${selectedYear + 1}-01-01`),
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
                $gte: new Date(`${selectedYear}-01-01`),
                $lt: new Date(`${selectedYear + 1}-01-01`),
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
  const cacheKey = "diagnosisDistribution";

  if (
    dashboardCache[cacheKey] &&
    Date.now() - dashboardCache[cacheKey].timestamp < CACHE_DURATION
  ) {
    return res.json(dashboardCache[cacheKey].data);
  }
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

    dashboardCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
    };

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
  const cacheKey = "topMedicines";

  if (
    dashboardCache[cacheKey] &&
    Date.now() - dashboardCache[cacheKey].timestamp < CACHE_DURATION
  ) {
    return res.json(dashboardCache[cacheKey].data);
  }
  try {
    const medicines = await Prescription.aggregate([
      // flatten items array
      {
        $unwind: "$items",
      },

      // skip empty medicine refs
      {
        $match: {
          "items.medicine": {
            $exists: true,
            $ne: null,
          },
        },
      },

      // sum quantities per medicine id
      {
        $group: {
          _id: "$items.medicine",
          count: {
            $sum: {
              $ifNull: ["$items.quantity", 1],
            },
          },
        },
      },

      // highest first
      {
        $sort: {
          count: -1,
        },
      },

      // grab top 10
      {
        $limit: 10,
      },

      // join medicine document
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicineData",
        },
      },

      // flatten lookup
      {
        $unwind: {
          path: "$medicineData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // shape final result
      {
        $project: {
          _id: 0,

          medicine: {
            $ifNull: [
              {
                $arrayElemAt: ["$medicineData.names", 0],
              },
              "Unknown",
            ],
          },

          count: 1,
        },
      },
    ]);

    const topThree = medicines.slice(0, 3);

    const othersTotal = medicines
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
    dashboardCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
    };
    res.json(result);
  } catch (err) {
    console.error("Top medicines error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};
/*exports.getTopMedicines = async (req, res) => {
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
};*/
