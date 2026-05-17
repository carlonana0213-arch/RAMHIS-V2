import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
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
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={patientTrends}>
            <defs>
              <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3f5fbe" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3f5fbe" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="patients"
              stroke="#3f5fbe"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPatients)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="graph-card small">
        <h3>Diagnosis Distribution</h3>

        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={diagnosisData}
              dataKey="value"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              stroke="none"
            >
              {diagnosisData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="diagnosis-summary-row">
          {topDiagnoses.map((diag, index) => (
            <div key={diag.name} className="diagnosis-pill">
              <span
                className="diagnosis-dot"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />

              <span className="diagnosis-pill-name">{diag.name}</span>

              <span className="diagnosis-pill-count">{diag.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPatientGraphs;
