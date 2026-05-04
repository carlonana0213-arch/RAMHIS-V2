import { useState, useEffect } from "react";
import { addPatient } from "../../services/patientService";
import "../../styles/modal.css";
import GeneralStep from "../steps/GeneralStep";
import MedicalStep from "../steps/MedicalStep";
import FamilyStep from "../steps/FamilyStep";
import ExaminationStep from "../steps/ExaminationStep";
import DepartmentStep from "../steps/DepartmentStep";
import PerinatalStep from "../steps/PerinatalStep";
import SummaryStep from "../steps/SummaryStep";

const getSteps = (form) => {
  const baseSteps = ["General", "Medical", "Family", "Examination"];

  if (form.generalInfo?.sex === "Female") {
    baseSteps.push("Perinatal & OB");
  }

  baseSteps.push("Department");
  baseSteps.push("Summary");

  return baseSteps;
};

const AddPatientModal = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    generalInfo: {},
    medicalHistory: [],
    familyHistory: [],
    examination: {},
    obstetricHistory: {},
    perinatalHistory: {},
    department: "",
    initComplaint: "",
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
      obstetricHistory: form.obstetricHistory || {},
      perinatalHistory: form.perinatalHistory || {},
      location: "Default Location", // or from user input
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
            {steps.map((label, index) => (
              <div
                key={label}
                className={`progress-step 
        ${index < step ? "completed" : ""} 
        ${index === step ? "active" : ""}`}
              >
                <div className="circle">{index + 1}</div>
                <span className="label">{label}</span>
              </div>
            ))}
          </div>
          {/* STEP CONTENT */}
          {currentStep === "General" && (
            <GeneralStep
              form={form}
              setForm={setForm}
              handleEnterKey={handleEnterKey}
            />
          )}

          {currentStep === "Medical" && (
            <MedicalStep
              form={form}
              setForm={setForm}
              handleEnterKey={handleEnterKey}
            />
          )}

          {currentStep === "Family" && (
            <FamilyStep
              form={form}
              setForm={setForm}
              handleEnterKey={handleEnterKey}
            />
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
    </div>
  );
};

export default AddPatientModal;
