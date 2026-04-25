const PerinatalStep = ({ form, setForm, handleEnterKey }) => {
  const handleChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  return (
    <div className="step-wrapper" onKeyDown={handleEnterKey}>
      {/* OBSTETRIC HISTORY */}
      <div className="card">
        <h3>Obstetric History</h3>

        <div className="field-group">
          <label>
            <input
              type="checkbox"
              checked={form.obstetricHistory?.contraception || false}
              onChange={(e) =>
                handleChange(
                  "obstetricHistory",
                  "contraception",
                  e.target.checked,
                )
              }
            />
            Contraception
          </label>
        </div>

        <div className="field-group">
          <input
            placeholder="Type"
            value={form.obstetricHistory?.type || ""}
            onChange={(e) =>
              handleChange("obstetricHistory", "type", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            placeholder="G/P (F/P/A/L)"
            value={form.obstetricHistory?.gpfpal || ""}
            onChange={(e) =>
              handleChange("obstetricHistory", "gpfpal", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            placeholder="BF"
            value={form.obstetricHistory?.bf || ""}
            onChange={(e) =>
              handleChange("obstetricHistory", "bf", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            placeholder="Birth History"
            value={form.obstetricHistory?.birthHistory || ""}
            onChange={(e) =>
              handleChange("obstetricHistory", "birthHistory", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            placeholder="Delivery Site"
            value={form.obstetricHistory?.deliverySite || ""}
            onChange={(e) =>
              handleChange("obstetricHistory", "deliverySite", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            type="date"
            value={form.obstetricHistory?.lmp || ""}
            onChange={(e) =>
              handleChange("obstetricHistory", "lmp", e.target.value)
            }
          />
        </div>
      </div>

      {/* PERINATAL HISTORY */}
      <div className="card">
        <h3>Perinatal History</h3>

        <div className="field-group">
          <input
            placeholder="Birth Weight"
            value={form.perinatalHistory?.bw || ""}
            onChange={(e) =>
              handleChange("perinatalHistory", "bw", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            placeholder="BF"
            value={form.perinatalHistory?.bf || ""}
            onChange={(e) =>
              handleChange("perinatalHistory", "bf", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            placeholder="Birth History"
            value={form.perinatalHistory?.birthHistory || ""}
            onChange={(e) =>
              handleChange("perinatalHistory", "birthHistory", e.target.value)
            }
          />
        </div>

        <div className="field-group">
          <input
            placeholder="Delivery Site"
            value={form.perinatalHistory?.deliverySite || ""}
            onChange={(e) =>
              handleChange("perinatalHistory", "deliverySite", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PerinatalStep;
