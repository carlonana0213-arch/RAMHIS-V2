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

const FamilyStep = ({ form, setForm }) => {
  const toggle = (value) => {
    setForm((prev) => ({
      ...prev,
      familyHistory: prev.familyHistory.includes(value)
        ? prev.familyHistory.filter((v) => v !== value)
        : [...prev.familyHistory, value],
    }));
  };

  return (
    <div className="step-container">
      <h3>Family History</h3>

      <div className="chip-container">
        {HISTORY_OPTIONS.map((opt) => (
          <div
            key={opt}
            className={
              form.familyHistory.includes(opt) ? "chip active" : "chip"
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

export default FamilyStep;
