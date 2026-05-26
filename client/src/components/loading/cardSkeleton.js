import "../../styles/component-styles/cardSkeleton.css";

function CardsSkeleton() {
  return (
    <div className="dashboard-cards">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="summary-card">
          <div className="summary-card-top">
            <div style={{ flex: 1 }}>
              <div
                className="skeleton"
                style={{
                  height: "18px",
                  width: "120px",
                  marginBottom: "18px",
                }}
              />

              <div
                className="skeleton"
                style={{
                  height: "42px",
                  width: "100px",
                  marginBottom: "14px",
                }}
              />

              <div
                className="skeleton"
                style={{
                  height: "14px",
                  width: "170px",
                }}
              />
            </div>

            <div
              className="skeleton"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CardsSkeleton;
