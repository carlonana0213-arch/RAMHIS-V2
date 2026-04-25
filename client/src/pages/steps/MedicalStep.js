const HISTORY_OPTIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Cancer",
  "Stroke",
  "Epilepsy",
  "Tuberculosis",
  "Other",
];

const MedicalStep = ({ form, setForm }) => {
  const toggle = (value) => {
    setForm((prev) => ({
      ...prev,
      medicalHistory: prev.medicalHistory.includes(value)
        ? prev.medicalHistory.filter((v) => v !== value)
        : [...prev.medicalHistory, value],
    }));
  };

  return (
    <div className="step-container">
      <h3>Medical History</h3>

      <div className="chip-container">
        {HISTORY_OPTIONS.map((opt) => (
          <div
            key={opt}
            className={
              form.medicalHistory.includes(opt) ? "chip active" : "chip"
            }
            onClick={() => toggle(opt)}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicalStep;
