const SummaryStep = ({ form }) => {
  return (
    <div className="step-container">
      <h3>Review Patient Information</h3>

      <div className="summary-section">
        <h4>General Info</h4>
        <p>
          <strong>Name:</strong> {form.generalInfo?.name}
        </p>
        <p>
          <strong>Age:</strong> {form.generalInfo?.age}
        </p>
        <p>
          <strong>Sex:</strong> {form.generalInfo?.sex}
        </p>
      </div>

      <div className="summary-section">
        <h4>Examination</h4>
        <p>
          <strong>BP:</strong> {form.examination?.bp}
        </p>
        <p>
          <strong>Temp:</strong> {form.examination?.temp}
        </p>
        <p>
          <strong>BMI:</strong> {form.examination?.bmi}
        </p>
      </div>

      <div className="summary-section">
        <h4>Medical History</h4>
        <p>
          {[
            ...form.medicalHistory,
            form.medicalHistory.includes("Other") ? form.medicalOther : null,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      <div className="summary-section">
        <h4>Family History</h4>
        <p>
          {[
            ...form.familyHistory,
            form.familyHistory.includes("Other") ? form.familyOther : null,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      <div className="summary-section">
        <h4>Department</h4>
        <p>{form.department}</p>
      </div>
    </div>
  );
};

export default SummaryStep;
