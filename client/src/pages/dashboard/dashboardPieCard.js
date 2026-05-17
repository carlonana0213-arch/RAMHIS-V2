import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd"];

function DashboardPieCard({ title, data, labelKey, valueKey }) {
  const topThree = [...data]
    .sort((a, b) => b[valueKey] - a[valueKey])
    .slice(0, 3);

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
              data={data}
              dataKey={valueKey}
              outerRadius={125}
              innerRadius={45}
            >
              {data.map((entry, index) => (
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
