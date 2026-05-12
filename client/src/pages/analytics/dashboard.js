import { useMemo, useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import "../../styles/dashboard.css";
import { apiFetch } from "../../services/api";
import { FiUsers, FiFileText, FiActivity } from "react-icons/fi"; // Modern, clean icons
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

// Professional Blue-Centric Palette
const bluePalette = [
  "#1e40af", // Deep Blue
  "#2563eb", // Royal Blue
  "#3b82f6", // Bright Blue
  "#60a5fa", // Sky Blue
  "#93c5fd", // Soft Blue
];

const PatientDashboard = ({ patients }) => {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const data = await apiFetch("http://localhost:5000/api/prescriptions");
        setPrescriptions(data);
      } catch (err) {
        console.error("Failed to load prescriptions", err);
      }
    };
    loadPrescriptions();
  }, []);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows chart to fill the 240px wrapper exactly
    layout: {
      padding: {
        top: 0,
        bottom: 0, // Remove internal canvas padding
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 10, // Reduced from 20
          boxWidth: 8,
          font: { size: 11 },
        },
      },
    },
  };

  const stats = useMemo(
    () => ({
      totalPatients: patients.length,
      activePrescriptions: prescriptions.length,
      averageAge: Math.round(
        patients.reduce((acc, p) => acc + (p.generalInfo?.age || 0), 0) /
          (patients.length || 1),
      ),
    }),
    [patients, prescriptions],
  );

  const ageSexData = useMemo(() => {
    const groups = {
      "0-12": { M: 0, F: 0 },
      "13-19": { M: 0, F: 0 },
      "20-35": { M: 0, F: 0 },
      "36-60": { M: 0, F: 0 },
      "60+": { M: 0, F: 0 },
    };
    patients.forEach((p) => {
      const age = p.generalInfo?.age;
      const sex = (p.generalInfo?.gender ||
        p.generalInfo?.sex)?.[0]?.toUpperCase();
      if (!age || !sex) return;
      let group =
        age <= 12
          ? "0-12"
          : age <= 19
            ? "13-19"
            : age <= 35
              ? "20-35"
              : age <= 60
                ? "36-60"
                : "60+";
      if (groups[group]) groups[group][sex]++;
    });

    return {
      labels: Object.keys(groups),
      datasets: [
        {
          label: "Male",
          data: Object.values(groups).map((g) => g.M),
          backgroundColor: "#1d4ed8",
          borderRadius: 4,
        },
        {
          label: "Female",
          data: Object.values(groups).map((g) => g.F),
          backgroundColor: "#0ea5e9",
          borderRadius: 4,
        },
      ],
    };
  }, [patients]);

  const diagnosisData = useMemo(() => {
    const count = {};
    patients.forEach((p) => {
      const diag =
        p.doctorSheets?.[p.doctorSheets.length - 1]?.diagnosis ||
        p.medicalInfo?.diagnosis;
      if (diag) count[diag] = (count[diag] || 0) + 1;
    });
    const sorted = Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return {
      labels: sorted.map((d) => d[0]),
      datasets: [
        {
          data: sorted.map((d) => d[1]),
          backgroundColor: bluePalette,
          borderWidth: 2,
          borderColor: "#ffffff",
          cutout: "75%",
        },
      ],
    };
  }, [patients]);

  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card blue-tint">
          <div className="stat-content">
            <span className="stat-label">Total Patients</span>
            <span className="stat-value">{stats.totalPatients}</span>
          </div>
          <div>
            <FiUsers className="stat-icon-wrapper blue-bg" />
          </div>
        </div>

        <div className="stat-card cyan-tint">
          <div className="stat-content">
            <span className="stat-label">Active Prescriptions</span>
            <span className="stat-value">{stats.activePrescriptions}</span>
          </div>
          <div className="stat-icon-wrapper cyan-bg">
            <FiFileText className="stat-icon-wrapper cyan-bg" />
          </div>
        </div>

        <div className="stat-card navy-tint">
          <div className="stat-content">
            <span className="stat-label">Avg. Patient Age</span>
            <span className="stat-value">{stats.averageAge}</span>
          </div>
          <div className="stat-icon-wrapper navy-bg">
            <FiActivity className="stat-icon-wrapper navy-bg" />
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <h3>Demographics by Age & Sex</h3>
          <div className="chart-wrapper">
            <Bar data={ageSexData} options={commonOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Diagnosis Distribution</h3>
          <div className="chart-wrapper">
            <Doughnut data={diagnosisData} options={commonOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
