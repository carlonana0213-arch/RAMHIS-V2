import React from "react";
import "../styles/confirmModal.css";

const DuplicatePatientModal = ({
  patient,
  onReuse,
  onUpdate,
  onCreateNew,
  onCancel,
}) => {
  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <h3>Patient already exists</h3>

        <p>
          <strong>{patient.generalInfo?.name}</strong>
        </p>

        <p>
          {patient.generalInfo?.age} yrs • {patient.generalInfo?.sex}
        </p>

        <p>Last Updated: {new Date(patient.updatedAt).toLocaleDateString()}</p>

        <div
          className="confirm-actions"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <button onClick={onReuse}>Keep Old Record & Add To Queue</button>

          <button onClick={onUpdate}>Update Existing Information</button>

          <button className="ghost" onClick={onCreateNew}>
            Create New Patient Anyway
          </button>

          <button className="danger" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicatePatientModal;
