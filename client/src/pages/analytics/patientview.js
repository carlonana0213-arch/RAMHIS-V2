import "../../styles/analytics.css";

const PatientViewFinal = ({ patient, onClose }) => {
  if (!patient) return null;

  return (
    <div className="modal-overlay">
      <div className="patient-view-modal">
        <div className="modal-header">
          <div>
            <h2>{patient.generalInfo?.name}</h2>
            <p>
              Patient File Reference • {patient.generalInfo?.age || "--"} Years
              Old •{" "}
              {patient.generalInfo?.gender || patient.generalInfo?.sex || "--"}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="patient-view-content">
          <div className="patient-view-left">
            <div className="view-card">
              <h3>General Identification</h3>
              <div className="view-grid">
                <p>
                  <strong>Insurance Provider:</strong>{" "}
                  {patient.generalInfo?.insurance || "—"}
                </p>
                <p>
                  <strong>Date of Birth:</strong>{" "}
                  {patient.generalInfo?.birthdate || "—"}
                </p>
                <p>
                  <strong>Tobacco Exposure:</strong>{" "}
                  {patient.generalInfo?.tobacco || "—"}
                </p>
                <p>
                  <strong>Alcohol Consumption:</strong>{" "}
                  {patient.generalInfo?.alcohol || "—"}
                </p>
                <p>
                  <strong>Allergies Documented:</strong>{" "}
                  {patient.generalInfo?.allergies || "—"}
                </p>
                <p>
                  <strong>Immunization Status:</strong>{" "}
                  {patient.generalInfo?.vaccine || "—"}
                </p>
              </div>
            </div>

            <div className="view-card">
              <h3>Vitals Baseline</h3>
              <div className="view-grid">
                <p>
                  <strong>Blood Pressure:</strong>{" "}
                  {patient.examination?.bp || "—"}
                </p>
                <p>
                  <strong>Core Temp:</strong> {patient.examination?.temp || "—"}
                </p>
                <p>
                  <strong>Height Metric:</strong>{" "}
                  {patient.examination?.height || "—"}
                </p>
                <p>
                  <strong>Weight Metric:</strong>{" "}
                  {patient.examination?.weight || "—"}
                </p>
                <p>
                  <strong>Calculated BMI:</strong>{" "}
                  {patient.examination?.bmi || "—"}
                </p>
              </div>
            </div>

            <div className="view-card">
              <h3>Historical Manifestations</h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "0.85rem",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Medical Indications
                  </h4>
                  <div className="history-tags">
                    {patient.medicalHistory?.length > 0 ? (
                      patient.medicalHistory.map((item, i) => (
                        <span key={i} className="history-chip">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span
                        className="history-chip"
                        style={{ background: "#f1f5f9", color: "#64748b" }}
                      >
                        No historical files
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "0.85rem",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Hereditary Strain Indicators
                  </h4>
                  <div className="history-tags">
                    {patient.familyHistory?.length > 0 ? (
                      patient.familyHistory.map((item, i) => (
                        <span key={i} className="history-chip">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span
                        className="history-chip"
                        style={{ background: "#f1f5f9", color: "#64748b" }}
                      >
                        Negative History
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="patient-view-right">
            <div
              className="view-card"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3>Physician Consultation History</h3>
              <div style={{ flexGrow: 1, overflowY: "auto", pr: "4px" }}>
                {patient.doctorSheets?.length > 0 ? (
                  patient.doctorSheets
                    .slice()
                    .reverse()
                    .map((record, index) => (
                      <div key={index} className="doctor-record-card">
                        <div className="record-header">
                          <strong>
                            {new Date(record.date).toLocaleDateString()}
                          </strong>
                          <span>
                            {record.doctorName} ({record.department})
                          </span>
                        </div>

                        <p>
                          <strong>Chief Complaint:</strong>{" "}
                          {record.initComplaint || "—"}
                        </p>
                        <p>
                          <strong>Primary Diagnosis:</strong>{" "}
                          {record.diagnosis || "—"}
                        </p>
                        <p>
                          <strong>Treatment Directives:</strong>{" "}
                          {record.treatment || "—"}
                        </p>

                        {record.referral?.department && (
                          <div className="referral-box">
                            <strong>Transfer Routing:</strong>{" "}
                            {record.referral.department}
                            <br />
                            <strong>Routing Diagnosis:</strong>{" "}
                            {record.referral.reason}
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
                                {value || "—"}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p
                    style={{
                      color: "#64748b",
                      fontStyle: "italic",
                      fontSize: "0.9rem",
                    }}
                  >
                    No structural clinical records loaded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientViewFinal;
