import { useState } from "react";
import Registry from "./Registry";
import { updatePatient } from "../../services/patientService";
const PatientViewModal = ({ patient, onClose }) => {
  const [isPriority, setIsPriority] = useState(patient.isPriority || false);
  if (!patient) return null;
  const handlePriorityToggle = async () => {
    try {
      const updated = !isPriority;

      const result = await updatePatient(patient._id, {
        isPriority: updated,
      });

      setIsPriority(updated);

      alert(
        result?.offline
          ? "Priority updated offline. Will sync automatically."
          : "Patient priority updated",
      );
    } catch (err) {
      console.error("Failed to update priority", err);
    }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box registry-modal">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Patient Record</h2>
          <div className="patient-priority-toggle">
            <span>{isPriority ? "Priority Patient" : "Regular Patient"}</span>

            <label className="priority-switch">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={handlePriorityToggle}
              />

              <span className="priority-slider"></span>
            </label>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="modal-container registry-container">
          <Registry patientIdFromQueue={patient._id} />
        </div>
      </div>
    </div>
  );
};

export default PatientViewModal;
