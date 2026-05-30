import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/predictive.css";
import { API_BASE_URL, FASTAPI_BASE_URL } from "../services/apiConfig";
import PatientTable from "./analytics/PatientsTable";
import PatientViewFinal from "./analytics/patientview";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import TableSkeleton from "../components/loading/tableSkeleton";
const Analytics = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [nextMissionDate, setNextMissionDate] = useState("");
  const [missionDays, setMissionDays] = useState(1);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);

  const [patientPage, setPatientPage] = useState(1);

  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchPatientsForLocation = async (location, page = 1) => {
    try {
      setPatientsLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE_URL}/api/patients/analytics`, {
        params: {
          location,
          page,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPatients(res.data?.patients || []);

      setPatientTotalPages(res.data?.totalPages || 1);

      setPatientPage(res.data?.currentPage || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setPatientsLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const report = document.getElementById("analytics-report");
      if (!report) return;

      const canvas = await html2canvas(report, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.setFontSize(18);
      pdf.text("RAMHIS Predictive Analytics Report", 14, 20);
      pdf.setFontSize(10);
      pdf.text(`Location: ${selectedLocation}`, 14, 30);
      pdf.text(`Mission Days: ${missionDays}`, 14, 36);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);

      pdf.addImage(imgData, "PNG", 10, 50, pdfWidth - 20, pdfHeight);
      pdf.save(`RAMHIS_Analytics_${selectedLocation}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patients/locations`);
      setLocations(res.data);
      if (res.data.length > 0) {
        const latestLocation = res.data[res.data.length - 1];
        setSelectedLocation(latestLocation);
        const fetchPatientsForLocation = async (location, page = 1) => {
          try {
            setPatientsLoading(true);

            const token = localStorage.getItem("token");

            const res = await axios.get(
              `${API_BASE_URL}/api/patients/analytics`,
              {
                params: {
                  location,
                  page,
                  limit: 10,
                },
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            setPatients(res.data.patients || []);

            setPatientTotalPages(res.data.totalPages || 1);

            setPatientPage(res.data.currentPage || 1);
          } catch (err) {
            console.error(err);
          } finally {
            setPatientsLoading(false);
          }
        };
      }
    } catch (err) {
      console.error(err);
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
        missionDays: Number(missionDays),
      });

      setAnalytics(res.data);
      setShowAnalytics(true);
    } catch (error) {
      console.error(error);
      alert("Failed to generate analytics");
    } finally {
      setLoading(false);
    }
  };

  const operationalInsights = useMemo(() => {
    if (!analytics) return [];

    const insights = [];

    const predictedPatients = analytics?.predictedPatients || 0;

    const confidence = analytics?.confidence || "LOW";

    const rangeMin = analytics?.confidenceRange?.min || 0;

    const rangeMax = analytics?.confidenceRange?.max || 0;

    const variability = rangeMax - rangeMin;

    const departments = analytics?.departmentPredictions || {};

    const diagnoses = analytics?.topDiagnoses || [];

    const missionModel = analytics?.modelsUsed?.[0];

    // ======================
    // PRIMARY DEPARTMENT LOAD
    // ======================

    const rankedDepartments = Object.entries(departments).sort(
      (a, b) => b[1] - a[1],
    );

    const dominantDept = rankedDepartments[0];

    if (dominantDept) {
      const [dept, count] = dominantDept;

      insights.push({
        severity: "operations",

        text: `${dept} is projected to experience the highest operational demand (~${count} patients). Prioritize staffing allocation, queue management, and department-level supply preparation.`,
      });
    }

    // ======================
    // PATIENT SCALE
    // ======================

    if (predictedPatients >= 1000) {
      insights.push({
        severity: "high",

        text: `High mission turnout anticipated (${predictedPatients} forecasted patients). Consider additional registration, triage, pharmacy, and consultation personnel.`,
      });
    } else if (predictedPatients >= 300) {
      insights.push({
        severity: "medium",

        text: `Moderate-to-high patient demand expected. Ensure queue handling capacity and medicine preparation are adequately scaled.`,
      });
    } else {
      insights.push({
        severity: "normal",

        text: `Projected mission demand appears operationally manageable under standard staffing assumptions.`,
      });
    }

    // ======================
    // CONFIDENCE INTERPRETATION
    // ======================

    if (confidence === "LOW") {
      insights.push({
        severity: "warning",

        text: `Forecast confidence is LOW due to sparse or irregular historical mission patterns. Maintain operational flexibility and contingency preparation.`,
      });
    } else if (confidence === "MEDIUM") {
      insights.push({
        severity: "normal",

        text: `Forecast confidence is MODERATE. Historical mission behavior is partially stable but moderate variability should still be expected.`,
      });
    } else {
      insights.push({
        severity: "good",

        text: `Forecast confidence is HIGH. Historical mission behavior appears sufficiently stable for operational planning.`,
      });
    }

    // ======================
    // VARIABILITY / RANGE
    // ======================

    if (variability >= 300) {
      insights.push({
        severity: "warning",

        text: `Forecast spread is wide (±${Math.round(
          variability / 2,
        )} patients). Consider reserve staffing and contingency medicine allocation.`,
      });
    }

    // ======================
    // CLINICAL PREP
    // ======================

    const topClinical = diagnoses.slice(0, 3).map((d) => d.diagnosis);

    if (topClinical.length) {
      insights.push({
        severity: "operations",

        text: `Historically prevalent clinical concerns include ${topClinical.join(
          ", ",
        )}. Ensure associated diagnostics, medications, and clinical workflows are adequately prepared.`,
      });
    }

    // ======================
    // MODEL EXPLANATION
    // ======================

    if (missionModel) {
      insights.push({
        severity: "normal",

        text: `Forecast generated using ${missionModel}, selected automatically based on mission history availability and historical pattern stability.`,
      });
    }

    return insights;
  }, [analytics]);

  const departmentRows = analytics?.departmentPredictions
    ? Object.entries(analytics.departmentPredictions)
    : [];

  return (
    <div className="predictive-analytics-page">
      {/* IMPROVED ROOT FLEX HEADER GRID SPLIT */}
      <div className="analytics-header-card">
        <div className="header-text-group">
          <h1>Predictive Analytics</h1>
          <p>
            Forecast mission staffing and resource allocation metrics using
            historical models
          </p>
        </div>

        <div className="analytics-control-panel">
          <div className="input-container">
            <span className="input-label">Target Location</span>
            <select
              value={selectedLocation}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedLocation(value);
                setAnalytics(null);
                setShowAnalytics(false);
                fetchPatientsForLocation(value);
              }}
            >
              <option value="">Select Location</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className="input-container">
            <span className="input-label">Mission Date</span>
            <input
              type="date"
              value={nextMissionDate}
              onChange={(e) => setNextMissionDate(e.target.value)}
            />
          </div>

          <div className="input-container">
            <span className="input-label">Duration (Days)</span>
            <input
              type="number"
              min="1"
              value={missionDays}
              onChange={(e) => setMissionDays(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            onClick={generateAnalytics}
            disabled={loading}
          >
            {loading ? "Generating..." : "Run Forecast Model"}
          </button>
        </div>
      </div>

      {!showAnalytics && (
        <div className="analytics-dashboard-layout">
          <div className="dashboard-section-card">
            <h2>Target Area Historical Records</h2>
            {patientsLoading ? (
              <TableSkeleton rows={10} columns={6} />
            ) : (
              <PatientTable
                patients={patients}
                currentPage={patientPage}
                totalPages={patientTotalPages}
                onPageChange={(page) =>
                  fetchPatientsForLocation(selectedLocation, page)
                }
                onSelectPatient={(patientId) => {
                  const found = patients.find((p) => p.id === patientId);

                  setSelectedPatient(found?.raw);
                }}
              />
            )}
          </div>
        </div>
      )}

      {showAnalytics && analytics && (
        <div className="analytics-dashboard-layout">
          <div className="dashboard-section-header">
            <div className="header-text-group">
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#3b59c4",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.8rem",
                }}
              >
                Active Prediction Layer
              </p>
            </div>
            <button className="btn-secondary" onClick={exportPDF}>
              <span>💾</span> Export Document PDF
            </button>
          </div>

          <div
            id="analytics-report"
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div className="overview-metrics-grid">
              <div className="metric-tile-card">
                <h3>Forecasted Registration</h3>
                <p className="metric-value">{analytics.predictedPatients}</p>
                <span className="metric-footer">
                  Bounds: {analytics?.confidenceRange?.min} -{" "}
                  {analytics?.confidenceRange?.max} (95% CI)
                </span>
              </div>

              <div className="metric-tile-card">
                <h3>Algorithmic Engine</h3>
                <p
                  className="metric-value"
                  style={{
                    fontSize: "1.5rem",
                    paddingTop: "12px",
                    paddingBottom: "4px",
                  }}
                >
                  {analytics?.modelsUsed?.[0] || "Regression Analysis"}
                </p>
                <span className="metric-footer">
                  Confidence Tier: <strong>{analytics?.confidence}</strong>
                </span>
              </div>

              <div className="metric-tile-card">
                <h3>Operation Bounds</h3>
                <p className="metric-value">{missionDays}</p>
                <span className="metric-footer">Continuous Mission Days</span>
              </div>
            </div>

            <div className="dashboard-columns-container">
              <div className="insights-column-stack">
                <div className="dashboard-section-card">
                  <h2>Department Volume Adjustments</h2>
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Department Domain</th>
                          <th>Allocated Run Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentRows.map(([dept, count]) => (
                          <tr key={dept}>
                            <td>
                              <strong>{dept}</strong>
                            </td>
                            <td>{count} patients</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="dashboard-section-card">
                  <h2>Top Anticipated Diagnoses</h2>
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Clinical Indication</th>
                          <th>Historical Load Prevalence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics?.topDiagnoses || []).map((item, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{item.diagnosis}</strong>
                            </td>
                            <td>{item.count} occurrences</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="dashboard-section-card">
                  <h2>Medicine Resource Forecast</h2>

                  {!analytics?.medicineForecast?.length ? (
                    <p className="no-data-text">
                      No medicine forecast available
                    </p>
                  ) : (
                    <div
                      className="
        analytics-table-wrapper
      "
                    >
                      <table
                        className="
          analytics-table
        "
                      >
                        <thead>
                          <tr>
                            <th>Medicine</th>

                            <th>Estimated Need</th>

                            <th>Risk</th>
                          </tr>
                        </thead>

                        <tbody>
                          {analytics.medicineForecast.map((med, index) => (
                            <tr key={index}>
                              <td>{med.medicine}</td>

                              <td>{med.estimatedNeed}</td>

                              <td>
                                <span
                                  style={{
                                    padding: "4px 10px",

                                    borderRadius: "12px",

                                    fontWeight: 600,

                                    color: "#fff",

                                    backgroundColor:
                                      med.risk === "HIGH"
                                        ? "#d32f2f"
                                        : med.risk === "MEDIUM"
                                          ? "#f57c00"
                                          : "#2e7d32",
                                  }}
                                >
                                  {med.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="insights-column-stack">
                <div className="dashboard-section-card">
                  <h2>Summary Insights</h2>
                  <ul className="insight-list-group">
                    {(analytics?.summaryInsights || []).map((item, index) => (
                      <li key={index} className="insight-list-item">
                        {item}
                      </li>
                    ))}
                    {(analytics?.summaryInsights || []).length === 0 && (
                      <p className="no-data-text">
                        No summary evaluation items generated
                      </p>
                    )}
                  </ul>
                </div>

                <div className="dashboard-section-card">
                  <h2>Recommendations</h2>
                  {operationalInsights.length === 0 ? (
                    <p className="no-data-text">
                      No operational recommendations generated.
                    </p>
                  ) : (
                    <ul className="insight-list-group">
                      {operationalInsights.map((insight, index) => {
                        const borderColor =
                          insight.severity === "high"
                            ? "#d32f2f"
                            : insight.severity === "warning"
                              ? "#e0a924"
                              : insight.severity === "good"
                                ? "#2e7d32"
                                : "#3b59c4";

                        return (
                          <li
                            key={index}
                            className="
              insight-list-item
            "
                            style={{
                              borderLeftColor: borderColor,
                            }}
                          >
                            {insight.text}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PatientViewFinal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
};

export default Analytics;
