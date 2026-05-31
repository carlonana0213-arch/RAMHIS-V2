import { useEffect, useMemo, useState } from "react";

import "../../styles/patientDoctorView.css";

import { getMedicines } from "../../services/pharmacyService";
import AlertModal from "../../components/AlertModal";
import ConfirmModal from "../../components/ConfirmModal";

import {
  loadPatientPrescriptions,
  saveDoctorRecord,
  savePrescription,
  markMedicineGiven,
  updatePatientStatus,
  deleteDoctorRecord,
} from "../../services/doctorService";

function PatientDoctorView({ patient, onClose, refreshQueue }) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const DEPARTMENTS = [
    "Pediatrics",
    "Ortho",
    "Opta",
    "Dental",
    "Cardio",
    "General",
  ];
  const emptyDoctorSheet = {
    examination: {
      generalAppearance: "",
      heent: "",
      pulmonary: "",
      cardiovascular: "",
      gastrointestinal: "",
      musculoskeletal: "",
      genitourinary: "",
      neuroPsych: "",
      checkupPanel: "",
    },

    initComplaint: "",

    diagnosis: "",

    treatment: "",

    medication: "",
  };

  const [doctorSheet, setDoctorSheet] = useState(emptyDoctorSheet);

  const [existingPrescriptions, setExistingPrescriptions] = useState([]);

  const [medicines, setMedicines] = useState(() => {
    const cached = sessionStorage.getItem("doctorMedicines");

    return cached ? JSON.parse(cached) : [];
  });

  const [activeTab, setActiveTab] = useState("current");

  const [showReferral, setShowReferral] = useState(false);

  const [referralDept, setReferralDept] = useState("");

  const [referralReason, setReferralReason] = useState("");

  const [newComplaint, setNewComplaint] = useState("");

  const [recordMode, setRecordMode] = useState("new");
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [medicineSearch, setMedicineSearch] = useState({});

  const [activeDropdown, setActiveDropdown] = useState(null);

  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      medicine: "",
      quantity: "",
      directions: "",
    },
  ]);

  useEffect(() => {
    initializePatient();
    loadPrescriptions();
    loadMedicines();
  }, [patient]);

  const initializePatient = () => {
    if (patient?.doctorSheets && patient.doctorSheets.length > 0) {
      const latest = patient.doctorSheets[patient.doctorSheets.length - 1];

      setDoctorSheet({
        examination: latest.examination || emptyDoctorSheet.examination,

        initComplaint: latest.initComplaint || patient.initComplaint || "",

        diagnosis: latest.diagnosis || "",

        treatment: latest.treatment || "",

        medication: latest.medication || "",
      });

      setRecordMode("view");
    } else {
      setDoctorSheet({
        ...emptyDoctorSheet,

        initComplaint: patient.initComplaint || "",
      });

      setRecordMode("new");
    }
  };

  const loadPrescriptions = async () => {
    try {
      const data = await loadPatientPrescriptions(patient._id);

      setExistingPrescriptions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMedicines = async () => {
    try {
      // already cached
      if (medicines.length > 0) {
        return;
      }

      const data = await getMedicines();

      setMedicines(data);

      sessionStorage.setItem("doctorMedicines", JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
  };

  const activePrescriptions = useMemo(() => {
    return existingPrescriptions.filter((p) => p.status !== "Completed");
  }, [existingPrescriptions]);

  const hasHistory =
    patient?.doctorSheets?.length > 0 || existingPrescriptions.length > 0;

  const handleDoctorChange = (section, field, value) => {
    setDoctorSheet({
      ...doctorSheet,

      [section]: {
        ...doctorSheet[section],

        [field]: value,
      },
    });
  };

  const handleSaveRecord = async () => {
    try {
      const result = await saveDoctorRecord(patient._id, {
        ...doctorSheet,

        initComplaint: newComplaint || doctorSheet.initComplaint,

        doctorName: storedUser?.name || "Doctor",

        department: patient.department || "General",

        recordType: hasHistory ? "follow-up" : "initial",
      });

      setAlertMessage(
        result?.offline
          ? "Record saved offline. Will sync automatically."
          : "Record saved successfully",
      );

      refreshQueue();
    } catch (err) {
      console.error(err);
      setAlertMessage(err.message || "Failed to save record");
    }
  };

  const handleSavePrescription = async () => {
    try {
      const validItems = prescriptionItems.filter(
        (i) => i.medicine && Number(i.quantity) > 0,
      );

      if (validItems.length === 0) {
        setAlertMessage("Add at least one medicine");
        return;
      }

      const saved = await savePrescription({
        patient: patient._id,

        doctor: storedUser?.id,

        items: validItems.map((i) => ({
          medicine: i.medicine,

          quantity: Number(i.quantity),

          directions: i.directions,
        })),
      });

      setExistingPrescriptions((prev) => [...prev, saved]);

      setPrescriptionItems([
        {
          medicine: "",
          quantity: "",
          directions: "",
        },
      ]);

      setAlertMessage(
        saved?.offline
          ? "Prescription saved offline. Will sync automatically."
          : "Prescription saved successfully",
      );

      setExistingPrescriptions((prev) => [...prev, saved]);

      setPrescriptionItems([
        {
          medicine: "",
          quantity: "",
          directions: "",
        },
      ]);

      setAlertMessage("Prescription saved successfully");
    } catch (err) {
      console.error(err);

      setAlertMessage(err.message || "Failed to save prescription");
    }
  };

  const handleGiveMedicine = async (prescriptionId, itemId) => {
    try {
      const result = await markMedicineGiven(prescriptionId, itemId);

      await loadPrescriptions();

      setAlertMessage(
        result?.offline
          ? "Medicine marked as given offline. Will sync automatically."
          : "Medicine marked as given",
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRelease = async () => {
    try {
      const result = await updatePatientStatus(patient._id, {
        status: "released",
      });

      setAlertMessage(
        result?.offline
          ? "Patient released offline. Will sync automatically."
          : "Patient released successfully",
      );

      refreshQueue();

      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error(err);
    }
  };

  const handleForPharmacy = async () => {
    try {
      const result = await updatePatientStatus(patient._id, {
        status: "forPharmacy",
      });

      setAlertMessage(
        result?.offline
          ? "Patient sent to pharmacy offline. Will sync automatically."
          : "Patient sent to pharmacy",
      );

      refreshQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const submitReferral = async () => {
    try {
      if (!referralDept || !referralReason) {
        setAlertMessage("Complete referral details");
        return;
      }

      // SAVE RECORD + REFERRAL

      await saveDoctorRecord(patient._id, {
        ...doctorSheet,

        initComplaint: newComplaint || doctorSheet.initComplaint,

        doctorName: storedUser?.name || "Doctor",

        department: patient.department || "General",

        recordType: hasHistory ? "follow-up" : "initial",

        referral: {
          department: referralDept,

          reason: referralReason,
        },
      });

      // MOVE PATIENT TO NEW DEPARTMENT

      const result = await updatePatientStatus(patient._id, {
        department: referralDept,

        status: "waiting",
      });

      setAlertMessage(
        result?.offline
          ? `Referral saved offline (${referralDept}). Will sync automatically.`
          : `Patient referred to ${referralDept}`,
      );

      setAlertMessage(
        result?.offline
          ? `Referral saved offline (${referralDept}). Will sync automatically.`
          : `Patient referred to ${referralDept}`,
      );

      refreshQueue();
    } catch (err) {
      console.error(err);

      setAlertMessage("Referral failed");
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await deleteDoctorRecord(patient._id, recordId, storedUser?.name);

      setAlertMessage("Record deleted successfully");

      refreshQueue();

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!patient) return null;

  return (
    <div className="doctor-modal-overlay">
      <div className="doctor-modal">
        {/* HEADER */}

        <div className="doctor-modal-header sticky">
          <div>
            <h2>{patient.generalInfo?.name}</h2>

            <p>
              {patient.generalInfo?.age} yrs •{" "}
              {patient.generalInfo?.gender || patient.generalInfo?.sex}
            </p>
          </div>

          <button
            className="close-btn"
            onClick={async () => {
              try {
                // ONLY revert if currently being seen
                if (patient.status === "beingSeen") {
                  await updatePatientStatus(patient._id, {
                    status: "waiting",
                  });

                  refreshQueue();
                }

                onClose();
              } catch (err) {
                console.error("Failed to reset patient status", err);
              }
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}

        <div className="doctor-modal-body">
          {/* SIDEBAR */}

          <div className="doctor-sidebar">
            <div className="doctor-info-card">
              <h3>General Info</h3>

              <p>Insurance: {patient.generalInfo?.insurance}</p>

              <p>Tobacco: {patient.generalInfo?.tobacco}</p>

              <p>Alcohol: {patient.generalInfo?.alcohol}</p>

              <p>Allergies: {patient.generalInfo?.allergies}</p>

              <p>Vaccines: {patient.generalInfo?.vaccine}</p>
            </div>

            <div className="doctor-info-card">
              <h3>Vitals</h3>

              <p>BP: {patient.examination?.bp}</p>

              <p>Temp: {patient.examination?.temp}</p>

              <p>Height: {patient.examination?.height}</p>

              <p>Weight: {patient.examination?.weight}</p>

              <p>BMI: {patient.examination?.bmi}</p>
            </div>

            <div className="doctor-info-card">
              <h3>Medical History</h3>

              <div className="history-tags">
                {patient.medicalHistory?.map((item, i) => (
                  <span key={i} className="history-chip">
                    {item}
                  </span>
                ))}
              </div>

              <h3>Family History</h3>

              <div className="history-tags">
                {patient.familyHistory?.map((item, i) => (
                  <span key={i} className="history-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="doctor-info-card">
              <h3>Obstetric History</h3>

              <p>Type: {patient.obstetricHistory?.type}</p>

              <p>GPFPAL: {patient.obstetricHistory?.gpfpal}</p>

              <p>LMP: {patient.obstetricHistory?.lmp}</p>
            </div>
          </div>

          {/* MAIN */}

          <div className="doctor-main-content">
            {/* TABS */}

            <div className="doctor-tabs">
              <button
                className={activeTab === "current" ? "active" : ""}
                onClick={() => setActiveTab("current")}
              >
                Current Record
              </button>

              <button
                className={activeTab === "history" ? "active" : ""}
                onClick={() => setActiveTab("history")}
              >
                Previous Records
              </button>

              <button
                onClick={() => {
                  setDoctorSheet(emptyDoctorSheet);

                  setRecordMode("new");

                  setActiveTab("current");
                }}
              >
                + New Record
              </button>
            </div>

            {/* CURRENT */}

            {activeTab === "current" && (
              <>
                {/* EXAMINATION */}

                <div className="doctor-section">
                  <h3>Examination</h3>

                  <div className="exam-grid">
                    {Object.entries(doctorSheet.examination).map(
                      ([key, val]) => (
                        <div key={key}>
                          <label>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>

                          <textarea
                            value={val}
                            onChange={(e) =>
                              handleDoctorChange(
                                "examination",
                                key,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* COMPLAINT */}

                <div className="doctor-section">
                  <h3>Complaint</h3>

                  <textarea
                    value={doctorSheet.initComplaint}
                    onChange={(e) =>
                      setDoctorSheet({
                        ...doctorSheet,

                        initComplaint: e.target.value,
                      })
                    }
                  />
                </div>

                {/* DIAGNOSIS */}

                <div className="doctor-section">
                  <h3>Diagnosis</h3>

                  <textarea
                    value={doctorSheet.diagnosis}
                    onChange={(e) =>
                      setDoctorSheet({
                        ...doctorSheet,

                        diagnosis: e.target.value,
                      })
                    }
                  />
                </div>

                {/* TREATMENT */}

                <div className="doctor-section">
                  <h3>Treatment</h3>

                  <textarea
                    value={doctorSheet.treatment}
                    onChange={(e) =>
                      setDoctorSheet({
                        ...doctorSheet,

                        treatment: e.target.value,
                      })
                    }
                  />
                </div>

                {/* ACTIVE PRESCRIPTIONS */}

                <div className="doctor-section">
                  <h3>Active Prescriptions</h3>

                  {activePrescriptions.map((prescription) => (
                    <div key={prescription._id} className="prescription-card">
                      {prescription.items.map((item) => (
                        <div key={item._id} className="prescription-item">
                          <strong>{item.medicine?.names?.join(", ")}</strong>

                          <p>Qty: {item.quantity}</p>

                          <p>{item.directions}</p>

                          {!item.isGiven ? (
                            <button
                              className="give-med-btn"
                              onClick={() =>
                                setConfirmState({
                                  message: "Mark this medicine as given?",
                                  onConfirm: async () => {
                                    await handleGiveMedicine(
                                      prescription._id,
                                      item._id,
                                    );

                                    setConfirmState(null);
                                  },
                                })
                              }
                            >
                              Give Now
                            </button>
                          ) : (
                            <span>✅ Given</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* NEW PRESCRIPTION */}

                <div className="doctor-section">
                  <h3>New Prescription</h3>

                  {prescriptionItems.map((item, index) => (
                    <div key={index} className="prescription-row">
                      {/* MEDICINE SEARCH */}

                      <div className="medicine-autocomplete">
                        <input
                          placeholder="Type medicine name..."
                          value={medicineSearch[index] || ""}
                          onChange={(e) => {
                            const value = e.target.value;

                            setMedicineSearch({
                              ...medicineSearch,

                              [index]: value,
                            });

                            setActiveDropdown(index);

                            // IMPORTANT:
                            // reset medicine selection while typing

                            const updated = [...prescriptionItems];

                            updated[index].medicine = "";

                            setPrescriptionItems(updated);
                          }}
                          onFocus={() => setActiveDropdown(index)}
                        />

                        {/* DROPDOWN */}

                        {activeDropdown === index && medicineSearch[index] && (
                          <div className="medicine-dropdown">
                            {medicines
                              .filter((m) =>
                                m.names?.some((name) =>
                                  name
                                    .toLowerCase()
                                    .includes(
                                      medicineSearch[index].toLowerCase(),
                                    ),
                                ),
                              )
                              .slice(0, 5)
                              .map((m) => (
                                <div
                                  key={m._id}
                                  className="medicine-option"
                                  onClick={() => {
                                    const updated = [...prescriptionItems];

                                    updated[index].medicine = m._id;

                                    setPrescriptionItems(updated);

                                    setMedicineSearch({
                                      ...medicineSearch,

                                      [index]: `
${m.names?.join(", ")}
${m.dosage ? ` (${m.dosage})` : ""}
(Stock: ${m.quantity})
                        `.trim(),
                                    });

                                    setActiveDropdown(null);
                                  }}
                                >
                                  <strong>{m.names?.join(", ")}</strong>

                                  {m.dosage && ` (${m.dosage})`}

                                  <div className="medicine-stock">
                                    Stock: {m.quantity}
                                  </div>
                                </div>
                              ))}

                            {medicines.filter((m) =>
                              m.names?.some((name) =>
                                name
                                  .toLowerCase()
                                  .includes(
                                    medicineSearch[index].toLowerCase(),
                                  ),
                              ),
                            ).length === 0 && (
                              <div className="medicine-empty">
                                No medicines found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* QUANTITY */}

                      <input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];

                          updated[index].quantity = e.target.value;

                          setPrescriptionItems(updated);
                        }}
                      />

                      {/* DIRECTIONS */}

                      <input
                        placeholder="Directions"
                        value={item.directions}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];

                          updated[index].directions = e.target.value;

                          setPrescriptionItems(updated);
                        }}
                      />

                      {/* REMOVE */}

                      {prescriptionItems.length > 1 && (
                        <button
                          className="add-med-btn"
                          onClick={() => {
                            const updated = prescriptionItems.filter(
                              (_, i) => i !== index,
                            );

                            setPrescriptionItems(updated);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {/* ACTIONS */}

                  <div className="prescription-actions">
                    <button
                      onClick={() =>
                        setPrescriptionItems([
                          ...prescriptionItems,

                          {
                            medicine: "",
                            quantity: "",
                            directions: "",
                          },
                        ])
                      }
                    >
                      Add Medicine
                    </button>

                    <button
                      className="save-prescription-btn"
                      onClick={handleSavePrescription}
                    >
                      Save Prescription
                    </button>
                  </div>
                </div>

                {/* REFERRAL */}

                <div className="doctor-section">
                  <div className="referral-toggle">
                    <label>Further Treatment?</label>

                    <div className="referral-options">
                      <label>
                        <input
                          type="radio"
                          name="referral"
                          checked={!showReferral}
                          onChange={() => setShowReferral(false)}
                        />
                        No
                      </label>

                      <label>
                        <input
                          type="radio"
                          name="referral"
                          checked={showReferral}
                          onChange={() => setShowReferral(true)}
                        />
                        Yes
                      </label>
                    </div>
                  </div>

                  {showReferral && (
                    <div className="referral-box">
                      <h3>Referral</h3>

                      <select
                        value={referralDept}
                        onChange={(e) => setReferralDept(e.target.value)}
                      >
                        <option value="">Select Department</option>

                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>

                      <textarea
                        placeholder="Referral Reason"
                        value={referralReason}
                        onChange={(e) => setReferralReason(e.target.value)}
                      />

                      {hasHistory && (
                        <textarea
                          placeholder="New Complaint"
                          value={newComplaint}
                          onChange={(e) => setNewComplaint(e.target.value)}
                        />
                      )}

                      <button
                        onClick={() =>
                          setConfirmState({
                            message: "Send this patient for referral?",
                            onConfirm: async () => {
                              await submitReferral();
                              setConfirmState(null);
                            },
                          })
                        }
                      >
                        Send Referral
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* HISTORY */}

            {activeTab === "history" && (
              <div className="history-container">
                {patient.doctorSheets?.map((record, index) => (
                  <div key={index} className="history-card">
                    <div className="history-header">
                      <div>
                        <h4>{new Date(record.date).toLocaleString()}</h4>

                        <p>
                          {record.doctorName}
                          {" • "}
                          {record.department}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setConfirmState({
                            message:
                              "Are you sure you want to delete this doctor record?",
                            onConfirm: async () => {
                              await handleDeleteRecord(record._id);
                              setConfirmState(null);
                            },
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>

                    <p>
                      <strong>Complaint:</strong> {record.initComplaint}
                    </p>

                    <p>
                      <strong>Diagnosis:</strong> {record.diagnosis}
                    </p>

                    <p>
                      <strong>Treatment:</strong> {record.treatment}
                    </p>

                    {record.referral?.department && (
                      <div className="referral-history">
                        <strong>Referred To:</strong>{" "}
                        {record.referral.department}
                        <br />
                        <strong>Reason:</strong> {record.referral.reason}
                      </div>
                    )}

                    <div className="exam-history-grid">
                      {Object.entries(record.examination || {}).map(
                        ([key, val]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {val}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="doctor-modal-footer sticky">
          <button className="save-btn" onClick={handleSaveRecord}>
            Save Record
          </button>

          <button
            className="pharmacy-btn"
            onClick={() =>
              setConfirmState({
                message: "Send this patient to pharmacy?",
                onConfirm: async () => {
                  await handleForPharmacy();
                  setConfirmState(null);
                },
              })
            }
          >
            For Pharmacy
          </button>

          <button
            className="release-btn"
            onClick={() =>
              setConfirmState({
                message: "Are you sure you want to release this patient?",
                onConfirm: async () => {
                  await handleRelease();
                  setConfirmState(null);
                },
              })
            }
          >
            Release Patient
          </button>
        </div>
      </div>
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => {
            setAlertMessage("");
          }}
        />
      )}
    </div>
  );
}

export default PatientDoctorView;
