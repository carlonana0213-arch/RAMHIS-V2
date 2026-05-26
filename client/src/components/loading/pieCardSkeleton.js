import "../../styles/component-styles/pieCardSkeleton.css";

function PieCardSkeleton() {
  return (
    <div className="pie-card">
      {/* title */}
      <div
        className="skeleton"
        style={{
          height: "24px",
          width: "180px",
          marginBottom: "24px",
        }}
      />

      <div className="pie-card-content">
        {/* left legend skeleton */}
        <div className="pie-legend">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="pie-legend-item">
              <div
                className="skeleton"
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "999px",
                }}
              />

              <div
                className="skeleton"
                style={{
                  height: "16px",
                  width: "140px",
                }}
              />
            </div>
          ))}
        </div>

        {/* fake chart circle */}
        <div className="pie-skeleton-chart-wrapper">
          <div className="pie-skeleton-chart"></div>
        </div>
      </div>
    </div>
  );
}

export default PieCardSkeleton;
