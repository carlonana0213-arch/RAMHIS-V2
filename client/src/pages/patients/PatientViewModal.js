import Registry from "./Registry";

const PatientViewModal = ({ patient, onClose }) => {
  if (!patient) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box registry-modal">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Patient Record</h2>

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
