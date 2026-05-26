import { useEffect, useState } from "react";

import DashboardCards from "./dashboard/dashboardCards";
import DashboardPatientGraphs from "./dashboard/dashboardPatientsGraphs";
import DashboardInventoryGraphs from "./dashboard/dashboardInventoryGraphs";
import DashboardPieCard from "./dashboard/dashboardPieCard";
import CardsSkeleton from "../components/loading/cardSkeleton";
import PieCardSkeleton from "../components/loading/pieCardSkeleton";
import ChartSkeleton from "../components/loading/chartSkeleton";
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

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
        </div>

        <button className="publish-btn">Publish</button>
      </div>

      {loading ? <CardsSkeleton /> : <DashboardCards summary={summary} />}

      <div className="dashboard-middle-row">
        {loading ? (
          <>
            <PieCardSkeleton />
            <PieCardSkeleton />
          </>
        ) : (
          <>
            <DashboardPieCard
              title="Diagnosis Distribution"
              data={diagnosisData}
              labelKey="name"
              valueKey="value"
            />

            <DashboardPieCard
              title="Prescribed Medicines"
              data={topMedicines}
              labelKey="medicine"
              valueKey="count"
            />
          </>
        )}
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : (
        <DashboardPatientGraphs
          patientTrends={patientTrends}
          diagnosisData={diagnosisData}
        />
      )}
    </div>
  );
}

export default Dashboard;

 