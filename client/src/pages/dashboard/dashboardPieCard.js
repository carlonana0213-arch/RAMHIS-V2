import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = [
  "#2563eb", // blue
  "#7c3aed", // purple
  "#16a34a", // green
  "#eab308", // yellow
  "#0ea5e9", // sky blue
  "#f97316", // orange
];

function DashboardPieCard({ title, data, labelKey, valueKey }) {
  // ONE shared sorted dataset
  const sortedData = [...data].sort((a, b) => b[valueKey] - a[valueKey]);

  const topThree = sortedData.slice(0, 3);

  return (
    <div className="pie-card">
      <h3>{title}</h3>

      <div className="pie-card-content">
        <div className="pie-legend">
          {topThree.map((item, index) => (
            <div key={index} className="pie-legend-item">
              <span
                className="legend-dot"
                style={{
                  background: COLORS[index],
                }}
              />

              <span>
                {item[labelKey]} ({item[valueKey]})
              </span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="65%" height={260}>
          <PieChart>
            <Pie
              data={sortedData}
              dataKey={valueKey}
              outerRadius={125}
              innerRadius={45}
            >
              {sortedData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name, props) => [
                value,
                props.payload[labelKey],
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DashboardPieCard;
 