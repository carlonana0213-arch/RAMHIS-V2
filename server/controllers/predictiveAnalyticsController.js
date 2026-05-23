const {
  generatePredictiveAnalytics,
} = require("../services/analytics/predictiveAnalyticsService");

const generateAnalytics = async (req, res) => {
  try {
    const { location, nextMissionDate } = req.body;

    const analytics = await generatePredictiveAnalytics(
      location,
      nextMissionDate,
    );

    res.json(analytics);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to generate analytics",
    });
  }
};

module.exports = {
  generateAnalytics,
};
