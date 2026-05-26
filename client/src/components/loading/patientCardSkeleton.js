function PatientCardSkeleton() {
  return (
    <div className="patient-queue-card current-patient-card">
      <div className="skeleton patient-avatar-skeleton" />

      <div className="patient-card-content">
        <div
          className="skeleton"
          style={{
            width: "180px",
            height: "28px",
            marginBottom: "20px",
          }}
        />

        <div
          className="skeleton"
          style={{
            width: "120px",
            height: "18px",
            marginBottom: "12px",
          }}
        />

        <div
          className="skeleton"
          style={{
            width: "140px",
            height: "18px",
            marginBottom: "18px",
          }}
        />

        <div
          className="skeleton"
          style={{
            width: "100%",
            height: "60px",
            marginBottom: "24px",
          }}
        />

        <div className="patient-card-buttons">
          <div
            className="skeleton"
            style={{
              height: "42px",
              flex: 1,
              borderRadius: "12px",
            }}
          />

          <div
            className="skeleton"
            style={{
              height: "42px",
              flex: 1,
              borderRadius: "12px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default PatientCardSkeleton;
