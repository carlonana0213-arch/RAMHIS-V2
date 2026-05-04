import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  addPatient,
  searchPatients,
  updatePatient,
  deletePatient,
  getPatientById,
} from "../../services/patientService";
import "../../styles/registry.css";
import "../../styles/registry-modern.css";

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

const emptyForm = {
  generalInfo: {
    name: "",
    age: "",
    birthdate: "",
    sex: "",
    insurance: "",
    tobacco: "",
    alcohol: "",
    allergies: "",
    vaccine: "",
  },
  examination: {
    bp: "",
    temp: "",
    height: "",
    weight: "",
    bmi: "",
  },
  obstetricHistory: {
    contraception: false,
    type: "",
    gpfpal: "",
    bf: "",
    birthHistory: "",
    deliverySite: "",
    lmp: "",
  },
  perinatalHistory: {
    bw: "",
    bf: "",
    birthHistory: "",
    deliverySite: "",
  },
  medicalHistory: [],
  familyHistory: [],
  department: "",
  initComplaint: "",
};

function Registry({ patientIdFromQueue }) {
  const [form, setForm] = useState(emptyForm);
  const [patientId, setPatientId] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const handleButtonGroupKey = (e, options, currentValue, setValue) => {
    const currentIndex = options.indexOf(currentValue);

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = options[(currentIndex + 1) % options.length];
      setValue(next);
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        options[(currentIndex - 1 + options.length) % options.length];
      setValue(prev);
    }

    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleChange = (section, field, value) => {
    setForm({
      ...form,
      [section]: {
        ...form[section],
        [field]: value,
      },
    });
  };

  const toggleCheckbox = (section, value) => {
    setForm({
      ...form,
      [section]: form[section].includes(value)
        ? form[section].filter((v) => v !== value)
        : [...form[section], value],
    });
  };

  const handleSearch = async () => {
    const data = await searchPatients(search);
    setResults(data);
  };

  const selectPatient = (patient) => {
    setPatientId(patient._id);
    setForm({
      generalInfo: patient.generalInfo || emptyForm.generalInfo,
      examination: patient.examination || emptyForm.examination,
      obstetricHistory: {
        ...emptyForm.obstetricHistory,
        ...patient.obstetricHistory,
        contraception: !!patient.obstetricHistory?.contraception,
      },
      perinatalHistory: {
        ...emptyForm.perinatalHistory,
        ...patient.perinatalHistory,
      },
      medicalHistory: patient.medicalHistory || [],
      familyHistory: patient.familyHistory || [],
      department: patient.department || emptyForm.department,
      initComplaint: patient.initComplaint || "",
    });
    setResults([]);
  };

  const clearForm = () => {
    setForm(emptyForm);
    setPatientId(null);
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      if (e.target.placeholder === "Search patient name") return;

      e.preventDefault();

      const form = e.target.form;
      const elements = Array.from(
        form.querySelectorAll("input, select, textarea, .button-group"),
      );

      const index = elements.indexOf(
        e.target.closest(".button-group") || e.target,
      );

      const next = elements[index + 1];

      if (next) {
        if (next.classList.contains("button-group")) {
          next.focus();

          // 👇 auto-focus first button inside
          const firstBtn = next.querySelector("button");
          if (firstBtn) firstBtn.focus();
        } else {
          next.focus();
        }
      }
    }
  };

  const computeBMI = (height, weight) => {
    if (!height || !weight) return "";
    const h = height / 100;
    return (weight / (h * h)).toFixed(1);
  };

  //add butt
  const handleAdd = async () => {
    try {
      const payload = {
        generalInfo: {
          name: form.generalInfo.name || "",
          age:
            form.generalInfo.age === ""
              ? undefined
              : Number(form.generalInfo.age),

          birthdate: form.generalInfo.birthdate || "",
          sex: form.generalInfo.sex || "",
          insurance: form.generalInfo.insurance || "",
          tobacco: form.generalInfo.tobacco || "",
          alcohol: form.generalInfo.alcohol || "",
          allergies: form.generalInfo.allergies || "",
          vaccine: form.generalInfo.vaccine || "",
        },
        examination: {
          bp: form.examination.bp || "",
          temp: form.examination.temp || "",
          height: form.examination.height || "",
          weight: form.examination.weight || "",
          bmi: form.examination.bmi || "",
        },
        obstetricHistory: {
          contraception: !!form.obstetricHistory.contraception,
          type: form.obstetricHistory.type || "",
          gpfpal: form.obstetricHistory.gpfpal || "",
          bf: form.obstetricHistory.bf || "",
          birthHistory: form.obstetricHistory.birthHistory || "",
          deliverySite: form.obstetricHistory.deliverySite || "",
          lmp: form.obstetricHistory.lmp || "",
        },
        perinatalHistory: {
          bw: form.perinatalHistory.bw || "",
          bf: form.perinatalHistory.bf || "",
          birthHistory: form.perinatalHistory.birthHistory || "",
          deliverySite: form.perinatalHistory.deliverySite || "",
        },
        medicalHistory: form.medicalHistory || [],
        familyHistory: form.familyHistory || [],
        department: form.department || "",
        initComplaint: form.initComplaint || "",
      };

      const res = await addPatient(payload);
      console.log("Add patient response:", res);
      alert("Patient added successfully");
      clearForm();
    } catch (err) {
      console.error("Error adding patient:", err);
      alert("Failed to add patient. See console for details.");
    }
  };

  //edit butt
  const handleEdit = async () => {
    if (!patientId) return;

    const confirmEdit = window.confirm(
      "Are you sure you want to save changes to this patient?",
    );

    if (!confirmEdit) return;

    try {
      const payload = {
        generalInfo: {
          ...form.generalInfo,
          age:
            form.generalInfo.age === ""
              ? undefined
              : Number(form.generalInfo.age),
        },
        examination: { ...form.examination },
        obstetricHistory: {
          ...form.obstetricHistory,
          contraception: !!form.obstetricHistory.contraception,
        },
        perinatalHistory: { ...form.perinatalHistory },
        medicalHistory: form.medicalHistory || [],
        familyHistory: form.familyHistory || [],
        initComplaint: form.initComplaint || "",
        department: form.department || "",
      };

      const res = await updatePatient(patientId, payload);
      console.log("Update patient response:", res);
      alert("Patient updated successfully");
      clearForm();
    } catch (err) {
      console.error("Error updating patient:", err);
      alert("Failed to update patient. See console for details.");
    }
  };

  const location = useLocation();

  useEffect(() => {
    const loadPatient = async () => {
      const id = patientIdFromQueue || location.state?.patientId;

      if (!id) return;

      try {
        const patient = await getPatientById(id);

        if (patient && patient._id) {
          selectPatient(patient);
        }
      } catch (err) {
        console.error("Error loading patient:", err);
      }
    };

    loadPatient();
  }, [patientIdFromQueue, location.state]);

  return (
    <form className="registry-modern" onSubmit={(e) => e.preventDefault()}>
      {/* search */}
      <div className="header-card">
        <div className="patient-info">
          <h2>{form.generalInfo.name || "New Patient"}</h2>
          <p>
            {form.generalInfo.age || "--"} yrs • {form.generalInfo.sex || "--"}
          </p>
        </div>

        <div className="search-box">
          <input
            placeholder="Search patient name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                handleSearch();
              }
            }}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
      </div>

      {results.map((p) => (
        <div
          key={p._id}
          className="search-result"
          onClick={() => selectPatient(p)}
        >
          {p.generalInfo.name}
        </div>
      ))}

      <div className="main-grid">
        <div className="left-column">
          {/* GENERAL INFO */}
          <div className="card">
            <h3>General Information</h3>

            <div className="general-grid">
              <div className="field-group full-width">
                <label>Name</label>
                <input
                  value={form.generalInfo.name}
                  onChange={(e) =>
                    handleChange("generalInfo", "name", e.target.value)
                  }
                  onKeyDown={handleEnterKey}
                />
              </div>

              <div className="field-group full-width">
                <label>Birthday</label>
                <input
                  placeholder="Birthday"
                  type="date"
                  value={form.generalInfo.birthdate}
                  onChange={(e) => {
                    const birthdate = e.target.value;

                    let age = "";
                    if (birthdate) {
                      const today = new Date();
                      const birth = new Date(birthdate);
                      age = today.getFullYear() - birth.getFullYear();
                      const m = today.getMonth() - birth.getMonth();
                      if (
                        m < 0 ||
                        (m === 0 && today.getDate() < birth.getDate())
                      ) {
                        age--;
                      }
                    }

                    setForm({
                      ...form,
                      generalInfo: {
                        ...form.generalInfo,
                        birthdate,
                        age,
                      },
                    });
                  }}
                  onKeyDown={handleEnterKey}
                />
              </div>

              <div className="field-group full-width">
                <label>Age</label>
                <input
                  value={form.generalInfo.age}
                  readOnly
                  onKeyDown={handleEnterKey}
                />
              </div>

              <div className="field-group">
                <label>Sex</label>
                <div
                  className="button-group"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    handleEnterKey(e);
                    handleButtonGroupKey(
                      e,
                      ["Male", "Female"],
                      form.generalInfo.sex,
                      (val) => handleChange("generalInfo", "sex", val),
                    );
                  }}
                >
                  <button
                    type="button"
                    className={form.generalInfo.sex === "Male" ? "active" : ""}
                    onClick={() => handleChange("generalInfo", "sex", "Male")}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    className={
                      form.generalInfo.sex === "Female" ? "active" : ""
                    }
                    onClick={() => handleChange("generalInfo", "sex", "Female")}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="field-group full-width">
                <label>Insurance</label>

                <input
                  value={form.generalInfo.insurance}
                  onChange={(e) =>
                    handleChange("generalInfo", "insurance", e.target.value)
                  }
                  onKeyDown={handleEnterKey}
                />
              </div>

              {/* TOBACCO */}
              <div className="field-group">
                <label>Tobacco</label>
                <div
                  className="button-group"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    handleEnterKey(e);
                    handleButtonGroupKey(
                      e,
                      ["Yes", "No"],
                      form.generalInfo.tobacco,
                      (val) => handleChange("generalInfo", "tobacco", val),
                    );
                  }}
                >
                  <button
                    type="button"
                    className={
                      form.generalInfo.tobacco === "Yes" ? "active" : ""
                    }
                    onClick={() =>
                      handleChange("generalInfo", "tobacco", "Yes")
                    }
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    className={
                      form.generalInfo.tobacco === "No" ? "active" : ""
                    }
                    onClick={() => handleChange("generalInfo", "tobacco", "No")}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* ALCOHOL */}
              <div className="field-group">
                <label>Alcohol</label>
                <div
                  className="button-group"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    handleEnterKey(e);
                    handleButtonGroupKey(
                      e,
                      ["Yes", "No"],
                      form.generalInfo.alcohol,
                      (val) => handleChange("generalInfo", "alcohol", val),
                    );
                  }}
                >
                  <button
                    type="button"
                    className={
                      form.generalInfo.alcohol === "Yes" ? "active" : ""
                    }
                    onClick={() =>
                      handleChange("generalInfo", "alcohol", "Yes")
                    }
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    className={
                      form.generalInfo.alcohol === "No" ? "active" : ""
                    }
                    onClick={() => handleChange("generalInfo", "alcohol", "No")}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="field-group full-width">
                <label>Allergies</label>
                <input
                  value={form.generalInfo.allergies}
                  onChange={(e) =>
                    handleChange("generalInfo", "allergies", e.target.value)
                  }
                  onKeyDown={handleEnterKey}
                />
              </div>

              <div className="field-group full-width">
                <label>Vaccine</label>
                <input
                  value={form.generalInfo.vaccine}
                  onChange={(e) =>
                    handleChange("generalInfo", "vaccine", e.target.value)
                  }
                  onKeyDown={handleEnterKey}
                />
              </div>
            </div>
          </div>

          {/* COMPLAINT */}
          <div className="card">
            <h3>Complaint</h3>
            <textarea
              placeholder="Complaint"
              value={form.initComplaint}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  initComplaint: e.target.value,
                }))
              }
              onKeyDown={handleEnterKey}
            />
          </div>

          {/* DEPARTMENT */}
          <div className="card">
            <h3>Department</h3>
            <select
              value={form.department}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  department: e.target.value,
                }))
              }
              onKeyDown={handleEnterKey}
            >
              <option value="" disabled>
                Select Department
              </option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Ortho">Ortho</option>
              <option value="Opta">Opta</option>
              <option value="Dental">Dental</option>
              <option value="Cardio">Cardio</option>
              <option value="General">General</option>
            </select>
          </div>

          {form.generalInfo.sex === "Female" && (
            <>
              <div className="card">
                <div className="ObsHist">
                  <h3>Obstetric History</h3>

                  <div className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={form.obstetricHistory.contraception}
                      onChange={(e) =>
                        handleChange(
                          "obstetricHistory",
                          "contraception",
                          e.target.checked,
                        )
                      }
                    />
                    <span>Contraception</span>
                  </div>

                  <input
                    placeholder="Type"
                    value={form.obstetricHistory.type}
                    onChange={(e) =>
                      handleChange("obstetricHistory", "type", e.target.value)
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    placeholder="G/P (F/P/A/L)"
                    value={form.obstetricHistory.gpfpal}
                    onChange={(e) =>
                      handleChange("obstetricHistory", "gpfpal", e.target.value)
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    placeholder="BF"
                    value={form.obstetricHistory.bf}
                    onChange={(e) =>
                      handleChange("obstetricHistory", "bf", e.target.value)
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    placeholder="Birth History"
                    value={form.obstetricHistory.birthHistory}
                    onChange={(e) =>
                      handleChange(
                        "obstetricHistory",
                        "birthHistory",
                        e.target.value,
                      )
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    placeholder="Delivery Site"
                    value={form.obstetricHistory.deliverySite}
                    onChange={(e) =>
                      handleChange(
                        "obstetricHistory",
                        "deliverySite",
                        e.target.value,
                      )
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    type="date"
                    value={form.obstetricHistory.lmp}
                    onChange={(e) =>
                      handleChange("obstetricHistory", "lmp", e.target.value)
                    }
                    onKeyDown={handleEnterKey}
                  />
                </div>
              </div>

              <div className="card">
                <h3>Perinatal History</h3>

                <div className="perinatal-grid">
                  <input
                    placeholder="Birth Weight"
                    value={form.perinatalHistory.bw}
                    onChange={(e) =>
                      handleChange("perinatalHistory", "bw", e.target.value)
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    placeholder="BF"
                    value={form.perinatalHistory.bf}
                    onChange={(e) =>
                      handleChange("perinatalHistory", "bf", e.target.value)
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    placeholder="Birth History"
                    value={form.perinatalHistory.birthHistory}
                    onChange={(e) =>
                      handleChange(
                        "perinatalHistory",
                        "birthHistory",
                        e.target.value,
                      )
                    }
                    onKeyDown={handleEnterKey}
                  />

                  <input
                    placeholder="Delivery Site"
                    value={form.perinatalHistory.deliverySite}
                    onChange={(e) =>
                      handleChange(
                        "perinatalHistory",
                        "deliverySite",
                        e.target.value,
                      )
                    }
                    onKeyDown={handleEnterKey}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="right-column">
          <div className="card">
            <h3>Medical History</h3>
            {HISTORY_OPTIONS.map((opt) => (
              <div
                key={opt}
                className={
                  form.medicalHistory.includes(opt) ? "chip active" : "chip"
                }
                onClick={() => toggleCheckbox("medicalHistory", opt)}
              >
                {opt}
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Family History</h3>
            {HISTORY_OPTIONS.map((opt) => (
              <div
                key={opt}
                className={
                  form.familyHistory.includes(opt) ? "chip active" : "chip"
                }
                onClick={() => toggleCheckbox("familyHistory", opt)}
              >
                {opt}
              </div>
            ))}
          </div>

          {/* EXAMINATION */}
          <div className="card">
            <h3>Examination</h3>

            <div className="bp-group">
              <input
                placeholder="Systolic"
                value={form.examination.bp.split("/")[0] || ""}
                onChange={(e) => {
                  const sys = e.target.value;
                  const dia = form.examination.bp.split("/")[1] || "";
                  handleChange("examination", "bp", `${sys}/${dia}`);
                }}
                onKeyDown={handleEnterKey}
              />
              <span>/</span>
              <input
                placeholder="Diastolic"
                value={form.examination.bp.split("/")[1] || ""}
                onChange={(e) => {
                  const dia = e.target.value;
                  const sys = form.examination.bp.split("/")[0] || "";
                  handleChange("examination", "bp", `${sys}/${dia}`);
                }}
                onKeyDown={handleEnterKey}
              />
            </div>

            <input
              placeholder="Temperature"
              value={form.examination.temp}
              onChange={(e) =>
                handleChange("examination", "temp", e.target.value)
              }
              onKeyDown={handleEnterKey}
            />

            <input
              placeholder="Height"
              value={form.examination.height}
              onChange={(e) => {
                const height = e.target.value;
                const bmi = computeBMI(height, form.examination.weight);
                setForm({
                  ...form,
                  examination: { ...form.examination, height, bmi },
                });
              }}
              onKeyDown={handleEnterKey}
            />

            <input
              placeholder="Weight"
              value={form.examination.weight}
              onChange={(e) => {
                const weight = e.target.value;
                const bmi = computeBMI(form.examination.height, weight);
                setForm({
                  ...form,
                  examination: { ...form.examination, weight, bmi },
                });
              }}
              onKeyDown={handleEnterKey}
            />

            <input
              placeholder="BMI"
              value={form.examination.bmi}
              onChange={(e) =>
                handleChange("examination", "bmi", e.target.value)
              }
              onKeyDown={handleEnterKey}
            />
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button
          disabled={!patientId}
          onClick={() => {
            if (!patientId) return;

            setConfirmState({
              message: "Save changes to this patient?",
              onConfirm: async () => {
                await handleEdit();
                setConfirmState(null);
              },
            });
          }}
        >
          Save Changes
        </button>
        <button
          className="danger"
          disabled={!patientId}
          onClick={() => {
            if (!patientId) return;

            setConfirmState({
              message:
                "Are you sure you want to DELETE this patient? This cannot be undone.",
              onConfirm: async () => {
                await deletePatient(patientId);
                alert("Patient deleted successfully");
                clearForm();
                setConfirmState(null);
              },
            });
          }}
        >
          Delete
        </button>
        <button className="ghost" onClick={clearForm}>
          Clear
        </button>
      </div>
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </form>
  );
}

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <p>{message}</p>

        <div className="confirm-actions">
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>

          <button className="danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Registry;
