import { useEffect } from "react";

const GeneralStep = ({ form, setForm }) => {
  const general = form.generalInfo || {};

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo,
        [field]: value,
      },
    }));
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
    } else {
      document.querySelector(".next-btn")?.click();
    }
  };

  const handleBirthdateChange = (birthdate) => {
    let age = "";

    if (birthdate) {
      const today = new Date();
      const birth = new Date(birthdate);

      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    setForm((prev) => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo,
        birthdate,
        age,
      },
    }));
  };

  return (
    <div className="step-wrapper">
      {/* GENERAL INFO CARD */}
      <div className="card">
        <h3>General Information</h3>

        <div className="form-grid">
          {/* Name */}
          <div className="field-group full">
            <label>Name</label>
            <input
              value={general.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>

          {/* Birthdate */}
          <div className="field-group">
            <label>Birthdate</label>
            <input
              type="date"
              value={general.birthdate || ""}
              onChange={(e) => handleBirthdateChange(e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>

          {/* Age */}
          <div className="field-group">
            <label>Age</label>
            <input
              value={general.age || ""}
              readOnly
              onKeyDown={handleEnterKey}
            />
          </div>

          {/* Sex */}
          <div className="field-group full">
            <label>Sex</label>
            <div className="button-group">
              {["Male", "Female"].map((sex) => (
                <button
                  key={sex}
                  type="button"
                  className={general.sex === sex ? "active" : ""}
                  onClick={() => handleChange("sex", sex)}
                  onKeyDown={handleEnterKey}
                >
                  {sex}
                </button>
              ))}
            </div>
          </div>

          {/* Insurance */}
          <div className="field-group full">
            <label>Insurance</label>
            <input
              value={general.insurance || ""}
              onChange={(e) => handleChange("insurance", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>

          {/* Tobacco */}
          <div className="field-group">
            <label>Tobacco</label>
            <div className="button-group">
              {["Yes", "No"].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={general.tobacco === val ? "active" : ""}
                  onClick={() => handleChange("tobacco", val)}
                  onKeyDown={handleEnterKey}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Alcohol */}
          <div className="field-group">
            <label>Alcohol</label>
            <div className="button-group">
              {["Yes", "No"].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={general.alcohol === val ? "active" : ""}
                  onClick={() => handleChange("alcohol", val)}
                  onKeyDown={handleEnterKey}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="field-group full">
            <label>Allergies</label>
            <input
              value={general.allergies || ""}
              onChange={(e) => handleChange("allergies", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>

          {/* Vaccine */}
          <div className="field-group full">
            <label>Vaccine</label>
            <input
              value={general.vaccine || ""}
              onChange={(e) => handleChange("vaccine", e.target.value)}
              onKeyDown={handleEnterKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralStep;
