function PatientCard({ patient, onSelect }) {
  return (
    <div className="patient-queue-card" onClick={() => onSelect(patient)}>
      <div className="patient-avatar"></div>

      <div className="patient-card-content">
        <h3>{patient.generalInfo?.name}</h3>

        <p>Age: {patient.generalInfo?.age || "--"}</p>

        <p>
          Gender:{" "}
          {patient.generalInfo?.gender || patient.generalInfo?.sex || "--"}
        </p>

        <p className="complaint-preview">
          {patient.initComplaint || "No complaint"}
        </p>
      </div>
    </div>
  );
}

export default PatientCard;
