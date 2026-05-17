import { useState, useEffect } from "react";
import { FiActivity } from "react-icons/fi";
import { addPatient } from "../../services/patientService";
import "../../styles/modal.css";
import GeneralStep from "../steps/GeneralStep";
import HistoryStep from "../steps/HistoryStep";
import ExaminationStep from "../steps/ExaminationStep";
import DepartmentStep from "../steps/DepartmentStep";
import PerinatalStep from "../steps/PerinatalStep";
import SummaryStep from "../steps/SummaryStep";
const getSteps = (form) => {
  const baseSteps = ["General", "History", "Examination"];

  if (form.generalInfo?.sex === "Female") {
    baseSteps.push("Perinatal & OB");
  }

  baseSteps.push("Department");
  baseSteps.push("Summary");

  return baseSteps;
};

const AddPatientModal = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [showConsent, setShowConsent] = useState(true);

  const [form, setForm] = useState({
    generalInfo: {},
    medicalHistory: [],
    familyHistory: [],
    medicalOther: "",
    familyOther: "",
    examination: {},
    obstetricHistory: {},
    perinatalHistory: {},
    department: "",
    initComplaint: "",
    isPriority: false,
  });

  const steps = getSteps(form);
  const currentStep = steps[step];

  useEffect(() => {
    const steps = getSteps(form);

    if (step >= steps.length) {
      setStep(steps.length - 1);
    }
  }, [form.generalInfo?.sex]);

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,

      medicalHistory: form.medicalHistory.map((item) =>
        item === "Other" ? form.medicalOther || "Other" : item,
      ),

      familyHistory: form.familyHistory.map((item) =>
        item === "Other" ? form.familyOther || "Other" : item,
      ),

      obstetricHistory: form.obstetricHistory || {},
      perinatalHistory: form.perinatalHistory || {},
      location: "Default Location",
      missionDate: new Date(),
    };

    await addPatient(payload);
    alert("Patient added!");
    onClose();
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

  return (
    <div className="modal-overlay">
      {showConsent ? (
        <div className="modal-overlay">
          <div className="consent-container">
            <h3>
              <FiActivity style={{ color: "var(--primary-blue)" }} />
              Pakibasa sa pasyente bago magpatuloy:
            </h3>

            <div className="consent-text">
              <p>
                Ang mga boluntaryo ng RAM (doktor, dentista, siruhano, therapist
                atbp) ay maaring hindi makapagbigay sa akin ng lahat ng mga
                serbisyo na kailangan ko.
              </p>

              <p>
                <strong>PERO</strong> nais ko pa ring kumunsulta sa RAM
                volunteer team at tumanggap ng uri ng paggamot na inaalok
                ngayon.
              </p>

              <p>
                <strong>PINALALAYA</strong> at inilabas ko ang RAM Philippines o
                sinumang tao o mga organisasyon na kumikilos para sa kanila o
                nag-sponsor o nagboluntaryo sa klinika na ito...
              </p>

              <p>
                Ibinibigay ko sa RAM at mga ahente nito ang karapatang gamitin
                ang aking mga larawan, boses, at iba pa para sa advertising or
                publishing ng mga serbisyo ng RAM.
              </p>
            </div>

            <div className="consent-actions">
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>

              <button className="primary" onClick={() => setShowConsent(false)}>
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="modal-box">
          <div className="modal-header">
            <h2>{steps[step]}</h2>

            <button
              className="close-btn"
              onClick={() => {
                setForm({
                  generalInfo: {},
                  medicalHistory: [],
                  familyHistory: [],
                  examination: {},
                  department: "",
                  initComplaint: "",
                });
                onClose();
              }}
            >
              ✕
            </button>
          </div>

          <div className="modal-container">
            <div className="progress-container">
              {steps.map((label, index) => {
                const isCompleted = index < step;
                const isActive = index === step;

                return (
                  <div
                    key={label}
                    className={`progress-step 
          ${isCompleted ? "completed" : ""}
          ${isActive ? "active" : ""}
        `}
                    onClick={() => setStep(index)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="circle">
                      {isCompleted ? "✓" : index + 1}
                    </div>

                    <span className="label">{label}</span>
                  </div>
                );
              })}
            </div>
            {/* STEP CONTENT */}
            {currentStep === "General" && (
              <GeneralStep
                form={form}
                setForm={setForm}
                handleEnterKey={handleEnterKey}
              />
            )}

            {currentStep === "History" && (
              <HistoryStep form={form} setForm={setForm} />
            )}

            {currentStep === "Examination" && (
              <ExaminationStep
                form={form}
                setForm={setForm}
                handleEnterKey={handleEnterKey}
              />
            )}

            {currentStep === "Perinatal & OB" && (
              <PerinatalStep
                form={form}
                setForm={setForm}
                handleEnterKey={handleEnterKey}
              />
            )}

            {currentStep === "Department" && (
              <DepartmentStep
                form={form}
                setForm={setForm}
                handleEnterKey={handleEnterKey}
              />
            )}
            {currentStep === "Summary" && <SummaryStep form={form} />}

            <div className="modal-actions">
              {step > 0 && <button onClick={prev}>Back</button>}

              {step < steps.length - 1 ? (
                <button className="primary next-btn" onClick={next}>
                  Next
                </button>
              ) : (
                <button className="primary" onClick={handleSubmit}>
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPatientModal;
