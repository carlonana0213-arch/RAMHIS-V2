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
    </div>
  );
};

export default DepartmentStep;
