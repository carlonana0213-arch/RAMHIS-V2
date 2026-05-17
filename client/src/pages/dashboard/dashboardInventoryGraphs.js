import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { FaCapsules, FaExclamationTriangle } from "react-icons/fa";
function DashboardInventoryGraphs({ summary, topMedicines }) {
  return (
    <div className="dashboard-bottom">
      <div className="graph-card">
        <h3>Most Prescribed Medicines</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={topMedicines}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barCategoryGap="12%"
            barGap={2}
          >
            <XAxis
              dataKey="medicine"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <Tooltip cursor={{ fill: "#f8fafc" }} />
            <Bar
              dataKey="count"
              fill="#2563eb"
              radius={[10, 10, 0, 0]}
              barSize={100}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="inventory-summary-column">
        <div className="inventory-stat-card dashboard-stat-card">
          <div className="inventory-card-content">
            <div>
              <h4>Total Medicines</h4>

              <div className="stat-value">{summary.totalMedicines}</div>

              <p>Medicines currently in inventory</p>
            </div>

            <div className="inventory-icon medicine-icon">
              <FaCapsules />
            </div>
          </div>
        </div>

        <div className="inventory-stat-card warning dashboard-stat-card">
          <div className="inventory-card-content">
            <div>
              <h4>Low Stock Medicines</h4>

              <div className="stat-value">{summary.lowStock}</div>

              <p>Medicines with low remaining stock</p>
            </div>

            <div className="inventory-icon warning-icon">
              <FaExclamationTriangle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardInventoryGraphs;
