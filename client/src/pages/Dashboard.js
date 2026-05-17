import { useEffect, useState } from "react";

import DashboardCards from "./dashboard/dashboardCards";
import DashboardPatientGraphs from "./dashboard/dashboardPatientsGraphs";
import DashboardInventoryGraphs from "./dashboard/dashboardInventoryGraphs";

import {
  getDashboardSummary,
  getPatientTrends,
  getDiagnosisDistribution,
  getTopMedicines,
} from "../services/dashboardService";

import "../styles/dashboard.css";

function Dashboard() {
  const [summary, setSummary] = useState({});
  const [patientTrends, setPatientTrends] = useState([]);
  const [diagnosisData, setDiagnosisData] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryData, trendsData, diagnosisResult, medicinesResult] =
          await Promise.all([
            getDashboardSummary(),
            getPatientTrends(),
            getDiagnosisDistribution(),
            getTopMedicines(),
          ]);

        setSummary(summaryData);
        setPatientTrends(trendsData);
        setDiagnosisData(diagnosisResult);
        setTopMedicines(medicinesResult);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading Dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
        </div>

        <button className="publish-btn">Publish</button>
      </div>

      <DashboardCards summary={summary} />

      <DashboardPatientGraphs
        patientTrends={patientTrends}
        diagnosisData={diagnosisData}
      />

      <DashboardInventoryGraphs summary={summary} topMedicines={topMedicines} />
    </div>
  );
}

export default Dashboard;
