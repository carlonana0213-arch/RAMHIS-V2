const AnalyticsReport = require("../models/AnalyticsReport");

const createAnalyticsReport = async (req, res) => {
  try {
    const { location, nextMissionDate, missionDays, analytics } = req.body;

    if (!location || !nextMissionDate || !missionDays || !analytics) {
      return res.status(400).json({
        message: "Missing analytics report data.",
      });
    }

    const report = await AnalyticsReport.create({
      location,
      nextMissionDate,
      missionDays: Number(missionDays),

      predictedPatients: Number(analytics?.predictedPatients) || 0,

      confidence: analytics?.confidence || "",

      generatedBy: req.user?._id || req.user?.id || null,

      reportData: analytics,
    });

    res.status(201).json({
      message: "Analytics report saved successfully.",
      report,
    });
  } catch (error) {
    console.error("CREATE ANALYTICS REPORT ERROR:", error);

    res.status(500).json({
      message: "Failed to save analytics report.",
    });
  }
};

const getAnalyticsReports = async (req, res) => {
  try {
    const reports = await AnalyticsReport.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      reports,
    });
  } catch (error) {
    console.error("GET ANALYTICS REPORTS ERROR:", error);

    res.status(500).json({
      message: "Failed to load analytics reports.",
    });
  }
};

const getAnalyticsReportById = async (req, res) => {
  try {
    const report = await AnalyticsReport.findById(req.params.id).lean();

    if (!report) {
      return res.status(404).json({
        message: "Analytics report not found.",
      });
    }

    res.json({
      report,
    });
  } catch (error) {
    console.error("GET ANALYTICS REPORT ERROR:", error);

    res.status(500).json({
      message: "Failed to load analytics report.",
    });
  }
};

module.exports = {
  createAnalyticsReport,
  getAnalyticsReports,
  getAnalyticsReportById,
};
