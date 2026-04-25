const ExaminationStep = ({ form, setForm }) => {
  const exam = form.examination || {};

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      examination: {
        ...prev.examination,
        [field]: value,
      },
    }));
  };

  const computeBMI = (height, weight) => {
    if (!height || !weight) return "";
    const h = height / 100;
    return (weight / (h * h)).toFixed(1);
  };

  const handleEnterKey = (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const container = e.currentTarget.closest(".step-wrapper");

    const elements = Array.from(
      container.querySelectorAll("input, select, textarea, .button-group"),
    );

    const current = e.target.closest(".button-group") || e.target;
    const index = elements.indexOf(current);
    const next = elements[index + 1];

    if (next) {
      if (next.classList.contains("button-group")) {
        next.focus();
        const firstBtn = next.querySelector("button");
        if (firstBtn) firstBtn.focus();
      } else {
        next.focus();
      }
    }
  };

  return (
    <div className="step-wrapper">
      <div className="step-container">
        <h3>Examination</h3>

        {/* BP */}
        <div className="bp-group">
          <input
            placeholder="Systolic"
            value={exam.bp?.split("/")[0] || ""}
            onChange={(e) => {
              const sys = e.target.value;
              const dia = exam.bp?.split("/")[1] || "";
              handleChange("bp", `${sys}/${dia}`);
            }}
            onKeyDown={handleEnterKey}
          />
          <span>/</span>
          <input
            placeholder="Diastolic"
            value={exam.bp?.split("/")[1] || ""}
            onChange={(e) => {
              const dia = e.target.value;
              const sys = exam.bp?.split("/")[0] || "";
              handleChange("bp", `${sys}/${dia}`);
            }}
            onKeyDown={handleEnterKey}
          />
        </div>

        {/* TEMP */}
        <input
          placeholder="Temperature"
          value={exam.temp || ""}
          onChange={(e) => handleChange("temp", e.target.value)}
          onKeyDown={handleEnterKey}
        />

        {/* HEIGHT */}
        <input
          placeholder="Height (cm)"
          value={exam.height || ""}
          onChange={(e) => {
            const height = e.target.value;
            const bmi = computeBMI(height, exam.weight);
            setForm((prev) => ({
              ...prev,
              examination: {
                ...prev.examination,
                height,
                bmi,
              },
            }));
          }}
          onKeyDown={handleEnterKey}
        />

        {/* WEIGHT */}
        <input
          placeholder="Weight (kg)"
          value={exam.weight || ""}
          onChange={(e) => {
            const weight = e.target.value;
            const bmi = computeBMI(exam.height, weight);
            setForm((prev) => ({
              ...prev,
              examination: {
                ...prev.examination,
                weight,
                bmi,
              },
            }));
          }}
          onKeyDown={handleEnterKey}
        />

        {/* BMI */}
        <input
          placeholder="BMI"
          value={exam.bmi || ""}
          onChange={(e) => handleChange("bmi", e.target.value)}
          onKeyDown={handleEnterKey}
        />
      </div>
    </div>
  );
};

export default ExaminationStep;
