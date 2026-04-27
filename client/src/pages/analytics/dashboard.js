import { useMemo, useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import "../../styles/dashboard.css";
import { apiFetch } from "../../services/api";

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

const Dashboard = ({ patients }) => {
  const [prescriptions, setPrescriptions] = useState([]);

  // 🔹 LOAD PRESCRIPTIONS
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

  // 🔹 1. AGE + SEX DISTRIBUTION
  const ageSexData = useMemo(() => {
    const groups = {
      "0-12": { Male: 0, Female: 0 },
      "13-19": { Male: 0, Female: 0 },
      "20-35": { Male: 0, Female: 0 },
      "36-60": { Male: 0, Female: 0 },
      "60+": { Male: 0, Female: 0 },
    };

    patients.forEach((p) => {
      const g = p.generalInfo || {};
      const age = g.age;
      const sex = g.gender || g.sex;

      if (!age || !sex) return;

      let group = "60+";
      if (age <= 12) group = "0-12";
      else if (age <= 19) group = "13-19";
      else if (age <= 35) group = "20-35";
      else if (age <= 60) group = "36-60";

      if (!groups[group][sex]) groups[group][sex] = 0;
      groups[group][sex]++;
    });

    return {
      labels: Object.keys(groups),
      datasets: [
        {
          label: "Male",
          data: Object.values(groups).map((g) => g.Male || 0),
        },
        {
          label: "Female",
          data: Object.values(groups).map((g) => g.Female || 0),
        },
      ],
    };
  }, [patients]);

  // 🔹 2. MOST COMMON DIAGNOSES
  const diagnosisData = useMemo(() => {
    const count = {};

    patients.forEach((p) => {
      const latest = p.doctorSheets?.[p.doctorSheets.length - 1];

      const diag = latest?.diagnosis || p.diagnosis || p.medicalInfo?.diagnosis;

      if (!diag) return;

      count[diag] = (count[diag] || 0) + 1;
    });

    const sorted = Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map((d) => d[0]),
      datasets: [
        {
          data: sorted.map((d) => d[1]),
        },
      ],
    };
  }, [patients]);

  // 🔹 3. MOST USED MEDICINES (ONLY GIVEN)
  const suppliesData = useMemo(() => {
    const count = {};

    prescriptions.forEach((prescription) => {
      prescription.items?.forEach((item) => {
        if (!item.isGiven) return;

        const name = item.medicine?.name || "Unknown";

        count[name] = (count[name] || 0) + 1;
      });
    });

    const sorted = Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map((s) => s[0]),
      datasets: [
        {
          data: sorted.map((s) => s[1]),
        },
      ],
    };
  }, [prescriptions]);

  return (
    <div className="dashboard-grid">
      {" "}
      <div className="chart-card">
        {" "}
        <h3>Patients by Age & Sex</h3>
        <Bar data={ageSexData} options={{ maintainAspectRatio: false }} />{" "}
      </div>
      <div className="chart-card">
        <h3>Most Common Diagnoses</h3>
        <Pie data={diagnosisData} options={{ maintainAspectRatio: false }} />
      </div>
      <div className="chart-card">
        <h3>Most Used Medicines</h3>
        <Pie data={suppliesData} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
  );
};

export default Dashboard;
