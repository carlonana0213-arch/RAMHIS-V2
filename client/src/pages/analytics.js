import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "../styles/predictive.css";
import { API_BASE_URL, FASTAPI_BASE_URL } from "../services/apiConfig";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

const Analytics = () => {
  const [locations, setLocations] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");

  const [nextMissionDate, setNextMissionDate] = useState("");

  const [missionDays, setMissionDays] = useState(1);

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patients/locations`);

      setLocations(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const generateAnalytics = async () => {
    try {
      if (!selectedLocation) {
        alert("Please select a location");
        return;
      }

      if (!nextMissionDate) {
        alert("Please select a mission date");
        return;
      }

      setLoading(true);

      const res = await axios.post(`${FASTAPI_BASE_URL}/generate-forecast`, {
        location: selectedLocation,
        nextMissionDate,
        missionDays,
      });

      console.log("FASTAPI RESPONSE:", res.data);

      setAnalytics(res.data);
    } catch (error) {
      console.error(error);

      alert("Failed to generate analytics");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // SMART INSIGHTS
  // =====================================

  const smartInsights = useMemo(() => {
    if (!analytics) return [];

    const insights = [];

    const predictedPatients = analytics?.predictedPatients || 0;

    const range =
      (analytics?.confidenceRange?.max || 0) -
      (analytics?.confidenceRange?.min || 0);

    if (predictedPatients > 100) {
      insights.push("High patient turnout expected for this mission");
    }

    if (range > 40) {
      insights.push(
        "Forecast variability is high due to limited historical data",
      );
    }

    if (
      (analytics?.medicineForecast || []).some((med) => med.risk === "HIGH")
    ) {
      insights.push("Potential medicine shortages detected");
    }

    if (analytics?.confidence === "VERY LOW") {
      insights.push(
        "Historical mission data is limited — forecast reliability is low",
      );
    }

    return insights;
  }, [analytics]);

  return (
    <div className="predictive-analytics-page">
      <div className="analytics-header">
        <h1>Predictive Analytics</h1>

        <p>Forecast mission needs based on historical patient records</p>
      </div>

      {/* FILTERS */}

      <div className="analytics-filters">
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">Select Location</option>

          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={nextMissionDate}
          onChange={(e) => setNextMissionDate(e.target.value)}
        />

        <input
          type="number"
          min="1"
          value={missionDays}
          onChange={(e) => setMissionDays(e.target.value)}
        />

        <button onClick={generateAnalytics}>
          {loading ? "Generating..." : "Generate Analytics"}
        </button>
      </div>

      {/* RESULTS */}

      {analytics && (
        <div className="analytics-results">
          {/* SUMMARY */}

          <div className="summary-grid">
            <div className="summary-card">
              <h3>Forecasted Patients</h3>

              <p>{analytics?.predictedPatients}</p>

              <span>
                95% Range: {analytics?.confidenceRange?.min}
                {" - "}
                {analytics?.confidenceRange?.max}
              </span>
            </div>

            <div className="summary-card">
              <h3>Forecast Method</h3>

              <p>
                {analytics?.forecastMethod === "prophet"
                  ? "Prophet"
                  : "Weighted Statistical"}
              </p>

              <span>Confidence: {analytics?.confidence}</span>
            </div>

            <div className="summary-card">
              <h3>Historical Missions</h3>

              <p>{analytics?.historicalMissionCount}</p>

              <span>Used for prediction</span>
            </div>

            <div className="summary-card">
              <h3>Mission Days</h3>

              <p>{missionDays}</p>

              <span>Planning duration</span>
            </div>
          </div>

          {/* FORECAST TREND */}

          {analytics?.forecastMethod === "prophet" &&
            analytics?.forecastTrend?.length > 0 && (
              <div className="analytics-card">
                <h2>Forecast Trend</h2>

                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={analytics?.forecastTrend}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="ds"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />

                    <YAxis />

                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />

                    <Area
                      type="monotone"
                      dataKey="yhat"
                      stroke="#2563eb"
                      fill="#93c5fd"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

          {/* DEPARTMENT FORECAST */}

          <div className="analytics-card">
            <h2>Department Forecast</h2>

            <table>
              <thead>
                <tr>
                  <th>Department</th>

                  <th>Predicted Patients</th>
                </tr>
              </thead>

              <tbody>
                {(analytics?.departmentForecast || []).map((item, index) => (
                  <tr key={index}>
                    <td>{item.department}</td>

                    <td>{item.predictedPatients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOP DIAGNOSES */}

          <div className="analytics-card">
            <h2>Top Diagnoses</h2>

            <table>
              <thead>
                <tr>
                  <th>Diagnosis</th>

                  <th>Count</th>
                </tr>
              </thead>

              <tbody>
                {(analytics?.topDiagnoses || []).map((item, index) => (
                  <tr key={index}>
                    <td>{item.diagnosis}</td>

                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MEDICINE FORECAST */}

          <div className="analytics-card">
            <h2>Medicine Forecast</h2>

            <table>
              <thead>
                <tr>
                  <th>Medicine</th>

                  <th>Estimated Need</th>

                  <th>Risk</th>
                </tr>
              </thead>

              <tbody>
                {(analytics?.medicineForecast || []).map((item, index) => (
                  <tr key={index}>
                    <td>{item.medicine}</td>

                    <td>{item.estimatedNeed}</td>

                    <td>{item.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY INSIGHTS */}

          <div className="analytics-card">
            <h2>Summary Insights</h2>

            <ul>
              {(analytics?.summaryInsights || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* SMART INSIGHTS */}

          <div className="analytics-card">
            <h2>Smart Insights</h2>

            {smartInsights.length === 0 ? (
              <p>No insights available</p>
            ) : (
              <ul>
                {smartInsights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
