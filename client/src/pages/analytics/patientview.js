import "../../styles/analytics.css";

const PatientViewFinal = ({ patient, onClose }) => {
  if (!patient) return null;

  return (
    <div className="modal-overlay">
      <div className="patient-view-modal">
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2>{patient.generalInfo?.name}</h2>

            <p>
              {patient.generalInfo?.age || "--"} yrs •{" "}
              {patient.generalInfo?.gender || patient.generalInfo?.sex || "--"}
            </p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="patient-view-content">
          {/* LEFT SIDE */}
          <div className="patient-view-left">
            {/* GENERAL INFO */}
            <div className="view-card">
              <h3>General Information</h3>

              <div className="view-grid">
                <p>
                  <strong>Insurance:</strong>{" "}
                  {patient.generalInfo?.insurance || "-"}
                </p>

                <p>
                  <strong>Birthdate:</strong>{" "}
                  {patient.generalInfo?.birthdate || "-"}
                </p>

                <p>
                  <strong>Tobacco:</strong>{" "}
                  {patient.generalInfo?.tobacco || "-"}
                </p>

                <p>
                  <strong>Alcohol:</strong>{" "}
                  {patient.generalInfo?.alcohol || "-"}
                </p>

                <p>
                  <strong>Allergies:</strong>{" "}
                  {patient.generalInfo?.allergies || "-"}
                </p>

                <p>
                  <strong>Vaccines:</strong>{" "}
                  {patient.generalInfo?.vaccine || "-"}
                </p>
              </div>
            </div>

            {/* VITALS */}
            <div className="view-card">
              <h3>Vitals</h3>

              <div className="view-grid">
                <p>
                  <strong>BP:</strong> {patient.examination?.bp || "-"}
                </p>

                <p>
                  <strong>Temp:</strong> {patient.examination?.temp || "-"}
                </p>

                <p>
                  <strong>Height:</strong> {patient.examination?.height || "-"}
                </p>

                <p>
                  <strong>Weight:</strong> {patient.examination?.weight || "-"}
                </p>

                <p>
                  <strong>BMI:</strong> {patient.examination?.bmi || "-"}
                </p>
              </div>
            </div>

            {/* HISTORY */}
            <div className="view-card">
              <h3>Medical History</h3>

              <div className="history-tags">
                {patient.medicalHistory?.length > 0 ? (
                  patient.medicalHistory.map((item, i) => (
                    <span key={i} className="history-chip">
                      {item}
                    </span>
                  ))
                ) : (
                  <p>No medical history</p>
                )}
              </div>

              <h3 style={{ marginTop: "20px" }}>Family History</h3>

              <div className="history-tags">
                {patient.familyHistory?.length > 0 ? (
                  patient.familyHistory.map((item, i) => (
                    <span key={i} className="history-chip">
                      {item}
                    </span>
                  ))
                ) : (
                  <p>No family history</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="patient-view-right">
            <div className="view-card">
              <h3>Doctor Records</h3>

              {patient.doctorSheets?.length > 0 ? (
                patient.doctorSheets
                  .slice()
                  .reverse()
                  .map((record, index) => (
                    <div key={index} className="doctor-record-card">
                      <div className="record-header">
                        <strong>
                          {new Date(record.date).toLocaleString()}
                        </strong>

                        <span>
                          {record.doctorName} • {record.department}
                        </span>
                      </div>

                      <p>
                        <strong>Complaint:</strong>{" "}
                        {record.initComplaint || "-"}
                      </p>

                      <p>
                        <strong>Diagnosis:</strong> {record.diagnosis || "-"}
                      </p>

                      <p>
                        <strong>Treatment:</strong> {record.treatment || "-"}
                      </p>

                      {record.referral?.department && (
                        <div className="referral-box">
                          <strong>Referral:</strong>{" "}
                          {record.referral.department}
                          <br />
                          <strong>Reason:</strong> {record.referral.reason}
                        </div>
                      )}

                      <div className="exam-grid">
                        {Object.entries(record.examination || {}).map(
                          ([key, value]) => (
                            <div key={key}>
                              <strong>
                                {key
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (s) => s.toUpperCase())}
                                :
                              </strong>{" "}
                              {value || "-"}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <p>No doctor records available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientViewFinal;
