function PatientCard({ patient, onSelect, onNextPatient }) {
  if (!patient) {
    return (
      <div className="patient-queue-card current-patient-card empty-patient-card">
        <h2>No Patients</h2>

        <p>No patients currently in queue.</p>
      </div>
    );
  }
  return (
    <div className="patient-queue-card current-patient-card">
      <div className="patient-avatar"></div>

      <div className="patient-card-content">
        <h2>{patient.generalInfo?.name}</h2>

        <p>Age: {patient.generalInfo?.age || "--"}</p>

        <p>
          Gender:{" "}
          {patient.generalInfo?.gender || patient.generalInfo?.sex || "--"}
        </p>

        <p className="complaint-preview">
          {patient.initComplaint || "No complaint"}
        </p>

        <div className="patient-card-buttons">
          <button
            className="queue-action-btn"
            onClick={() => onSelect(patient)}
          >
            Open Sheet
          </button>

          <button className="next-patient-btn" onClick={onNextPatient}>
            Next Patient
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientCard;
