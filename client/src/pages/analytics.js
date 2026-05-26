import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "../styles/predictive.css";

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

  // =========================
  // FETCH LOCATIONS
  // =========================

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/patients/locations"
      );

      setLocations(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // GENERATE ANALYTICS
  // =========================

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

      console.log("PAYLOAD", {
        location: selectedLocation,
        nextMissionDate,
        missionDays,
      });

      const res = await axios.post("http://localhost:8000/generate-forecast", {
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

  // =========================
  // RECOMMENDATIONS
  // =========================

  const recommendations = useMemo(() => {
    if (!analytics) return [];

    return analytics.recommendations || [];
  }, [analytics]);

  // =========================
  // SMART INSIGHTS
  // =========================

  const smartInsights = useMemo(() => {
    if (!analytics) return [];

    const insights = [];
    const predictedPatients = analytics?.predictedPatients || 0;

    if (predictedPatients > 100) {
      insights.push("High patient turnout expected for this mission");
    }

    if (
      analytics?.confidenceRange?.max - analytics?.confidenceRange?.min >
      40
    ) {
      insights.push(
        "Forecast variability is high due to limited historical data"
      );
    }

    if (
      (analytics?.medicineForecast || []).some((med) => med.risk === "HIGH")
    ) {
      insights.push("Potential medicine shortages detected");
    }

    return insights;
  }, [analytics]);

  return (
    <div className="predictive-analytics-page">
      {/* HEADER */}
      <div className="analytics-header-card">
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
          placeholder="Mission Days"
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

              <p>{analytics?.predictedPatients || 0}</p>

              <span>
                Range: {analytics?.confidenceRange?.min || 0}
                {" - "}
                {analytics?.confidenceRange?.max || 0}
              </span>
            </div>

            <div className="summary-card">
              <h3>Mission Location</h3>

              <p>{analytics?.location || "N/A"}</p>
            </div>

            <div className="summary-card">
              <h3>Mission Days</h3>

              <p>{analytics?.missionDays || 1}</p>
            </div>

            <div className="summary-card">
              <h3>Medicine Items</h3>

              <p>{analytics?.predictedMedicineItems || 0}</p>
            </div>
          </div>

          {/* DEPARTMENT FORECAST */}
          <div className="analytics-card">
            <h2>Department Forecast</h2>

            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Patients</th>
                </tr>
              </thead>

              <tbody>
                {(Array.isArray(analytics?.departmentForecast)
                  ? analytics.departmentForecast
                  : []
                ).map((item, index) => (
                  <tr key={index}>
                    <td>{item.department}</td>

                    <td>{item.predictedPatients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FORECAST TREND */}
          <div className="analytics-card">
            <h2>Forecast Trend</h2>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analytics?.forecastTrend || []}>
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
                {Object.entries(analytics?.topDiagnoses || {}).map(
                  ([diagnosis, count]) => (
                    <tr key={diagnosis}>
                      <td>{diagnosis}</td>

                      <td>{count}</td>
                    </tr>
                  )
                )}
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

          {/* RECOMMENDATIONS */}
          <div className="analytics-card">
            <h2>Recommendations</h2>

            {recommendations.length === 0 ? (
              <p>No recommendations available</p>
            ) : (
              <ul>
                {recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            )}
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