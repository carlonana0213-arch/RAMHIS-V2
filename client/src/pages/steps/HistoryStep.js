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

const HistoryChecklist = ({
  title,
  values,
  otherValue,
  onToggle,
  onOtherChange,
}) => {
  return (
    <div className="history-section">
      <h3>{title}</h3>

      <div className="checklist-container">
        {HISTORY_OPTIONS.map((opt) => (
          <label key={opt} className="checklist-item">
            <input
              type="checkbox"
              checked={values.includes(opt)}
              onChange={() => onToggle(opt)}
            />

            <span>{opt}</span>
          </label>
        ))}
      </div>

      {values.includes("Other") && (
        <div className="field-group">
          <input
            type="text"
            placeholder={`Specify other ${title.toLowerCase()}...`}
            value={otherValue || ""}
            onChange={(e) => onOtherChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

const HistoryStep = ({ form, setForm }) => {
  const toggleMedical = (value) => {
    setForm((prev) => ({
      ...prev,
      medicalHistory: prev.medicalHistory.includes(value)
        ? prev.medicalHistory.filter((v) => v !== value)
        : [...prev.medicalHistory, value],
    }));
  };

  const toggleFamily = (value) => {
    setForm((prev) => ({
      ...prev,
      familyHistory: prev.familyHistory.includes(value)
        ? prev.familyHistory.filter((v) => v !== value)
        : [...prev.familyHistory, value],
    }));
  };

  return (
    <div className="step-wrapper">
      <div className="card">
        <HistoryChecklist
          title="Medical History"
          values={form.medicalHistory}
          otherValue={form.medicalOther}
          onToggle={toggleMedical}
          onOtherChange={(value) =>
            setForm((prev) => ({
              ...prev,
              medicalOther: value,
            }))
          }
        />
      </div>

      <div className="card">
        <HistoryChecklist
          title="Family History"
          values={form.familyHistory}
          otherValue={form.familyOther}
          onToggle={toggleFamily}
          onOtherChange={(value) =>
            setForm((prev) => ({
              ...prev,
              familyOther: value,
            }))
          }
        />
      </div>
    </div>
  );
};

export default HistoryStep;
