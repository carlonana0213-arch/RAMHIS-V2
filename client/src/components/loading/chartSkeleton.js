import "../../styles/component-styles/chartSkeleton.css";
function ChartSkeleton({ bars = 8, height = 350, titleWidth = 180 }) {
  return (
    <div className="graph-card large">
      <div className="graph-header">
        <div
          className="skeleton"
          style={{
            width: `${titleWidth}px`,
            height: "26px",
          }}
        />

        <div
          className="skeleton"
          style={{
            width: "170px",
            height: "42px",
            borderRadius: "999px",
          }}
        />
      </div>

      <div className="chart-skeleton-body" style={{ height }}>
        {/* fake bars */}
        <div className="chart-bars">
          {[...Array(bars)].map((_, index) => {
            const heights = [
              "45%",
              "72%",
              "55%",
              "88%",
              "60%",
              "40%",
              "78%",
              "50%",
            ];

            return (
              <div key={index} className="chart-bar-group">
                <div
                  className="skeleton chart-bar"
                  style={{
                    height: heights[index % heights.length],
                  }}
                />

                <div className="skeleton chart-label" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ChartSkeleton;
