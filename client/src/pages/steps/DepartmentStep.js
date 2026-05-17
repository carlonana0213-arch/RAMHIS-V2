const departments = [
  "Pediatrics",
  "Ortho",
  "Opta",
  "Dental",
  "Cardio",
  "General",
];

const DepartmentStep = ({ form, setForm }) => {
  return (
    <div className="step-container">
      <div className="field-group">
        <h3>Remarks</h3>

        <textarea
          value={form.initComplaint || ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              initComplaint: e.target.value,
            }))
          }
          placeholder="Enter remarks..."
        />
      </div>
      <h3>Select Department</h3>

      <div className="field-group">
        <select
          value={form.department || ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              department: e.target.value,
            }))
          }
        >
          <option value="" disabled>
            Select Department
          </option>

          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>
      <div className="priority-toggle-card">
        <div className="priority-toggle-content">
          <div>
            <h4>Priority Patient</h4>
            <p>Mark this patient for urgent medical attention</p>
          </div>

          <label className="priority-switch">
            <input
              type="checkbox"
              checked={form.isPriority || false}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isPriority: e.target.checked,
                }))
              }
            />

            <span className="priority-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DepartmentStep;
