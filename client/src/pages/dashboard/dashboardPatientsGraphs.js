import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

function DashboardPatientGraphs({ patientTrends, diagnosisData }) {
  const COLORS = ["#3f5fbe", "#5c7cfa", "#91a7ff", "#748ffc", "#bac8ff"];
  const topDiagnoses = [...diagnosisData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div className="dashboard-graphs">
      <div className="graph-card large">
        <div className="graph-header">
          <h3>Patients Over Time</h3>

          <span className="graph-date">As of: {currentDate}</span>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={patientTrends}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar dataKey="patients" fill="#3b82f6" radius={[6, 6, 0, 0]} />

            <Bar dataKey="volunteers" fill="#60a5fa" radius={[6, 6, 0, 0]} />

            <Bar dataKey="prescriptions" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DashboardPatientGraphs;
