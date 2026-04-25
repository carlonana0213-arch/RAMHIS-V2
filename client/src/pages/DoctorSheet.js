import { useState, useEffect } from "react";
import { searchPatients, updatePatient } from "../services/patientService";
import { getMedicines } from "../services/pharmacyService";
import { apiFetch } from "../services/api";
import "../styles/doctorSheet.css";

function DoctorSheet() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [existingPrescriptions, setExistingPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState("current");
  const [showReferral, setShowReferral] = useState(false);
  const [referralDept, setReferralDept] = useState("");
  const [referralReason, setReferralReason] = useState("");

  const [recordMode, setRecordMode] = useState("view");

  const [medicineSearch, setMedicineSearch] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [newComplaint, setNewComplaint] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicine: "", quantity: "", directions: "" },
  ]);
  const handleDeleteRecord = async (recordId) => {
    if (!patient) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record? This cannot be undone.",
    );

    if (!confirmDelete) return;

    try {
      const updated = await apiFetch(
        `http://localhost:5000/api/patients/${patient._id}/doctor-record/${recordId}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            deletedBy: storedUser?.name || "Unknown User",
            deletedAt: new Date(),
          }),
        },
      );

      setPatient(updated);

      alert("Record deleted");
    } catch (err) {
      console.error("Delete record error:", err);
      alert("Failed to delete record");
    }
  };
  const [medicines, setMedicines] = useState([]);

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

  const [doctorSheet, setDoctorSheet] = useState({
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
  });

  const hasValidPrescriptions = existingPrescriptions?.some((p) =>
    p.items?.some((i) => i?.medicine),
  );

  const hasHistory =
    (patient?.doctorSheets && patient.doctorSheets.length > 0) ||
    hasValidPrescriptions;

  useEffect(() => {
    if (!hasHistory && activeTab === "history") {
      setActiveTab("current");
    }
  }, [hasHistory]);

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      if (form.elements[index + 1]) {
        form.elements[index + 1].focus();
      }
    }
  };

  useEffect(() => {
    const loadMedicines = async () => {
      const data = await getMedicines();
      setMedicines(data);
    };
    loadMedicines();
  }, []);

  const loadPatientPrescriptions = async (patientId) => {
    try {
      const data = await apiFetch(
        `http://localhost:5000/api/prescriptions/patient/${patientId}`,
      );
      setExistingPrescriptions(data);
    } catch (err) {
      console.error("Failed to load prescriptions", err);
    }
  };

  const handleSearch = async () => {
    const data = await searchPatients(search);
    setPatients(data);
  };

  const selectPatient = (p) => {
    setPatient(p);

    if (p.doctorSheets && p.doctorSheets.length > 0) {
      const latest = p.doctorSheets[p.doctorSheets.length - 1];

      setDoctorSheet({
        examination: latest.examination || emptyDoctorSheet.examination,
        initComplaint: latest.initComplaint || p.initComplaint || "",
        diagnosis: latest.diagnosis || "",
        treatment: latest.treatment || "",
        medication: latest.medication || "",
      });

      setRecordMode("view");
    } else {
      setDoctorSheet({
        ...emptyDoctorSheet,
        initComplaint: p.initComplaint || "",
      });

      setRecordMode("new");
    }

    setPrescriptionItems([{ medicine: "", quantity: "", directions: "" }]);
    loadPatientPrescriptions(p._id);
  };

  const handleRegistryChange = (section, field, value) => {
    setPatient({
      ...patient,
      [section]: {
        ...patient[section],
        [field]: value,
      },
    });
  };

  const handleDoctorChange = (section, field, value) => {
    setDoctorSheet({
      ...doctorSheet,
      [section]: {
        ...doctorSheet[section],
        [field]: value,
      },
    });
  };

  const handleGiveMedicine = async (prescriptionId, itemId) => {
    try {
      const token = localStorage.getItem("token");

      await apiFetch(
        `http://localhost:5000/api/prescriptions/${prescriptionId}/${itemId}`,
        { method: "PATCH" },
      );

      await loadPatientPrescriptions(patient._id);
      alert("Medicine given and inventory updated");
    } catch (err) {
      console.error("Error giving medicine", err);
    }
  };

  const handleSavePrescription = async () => {
    if (!patient) return;

    const validItems = prescriptionItems.filter(
      (i) => i.medicine && Number(i.quantity) > 0,
    );

    if (validItems.length === 0) {
      alert("Add at least one medicine");
      return;
    }

    try {
      await apiFetch("http://localhost:5000/api/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          patient: patient._id,
          items: validItems.map((i) => ({
            medicine: i.medicine,
            quantity: Number(i.quantity),
            directions: i.directions,
          })),
        }),
      });

      await loadPatientPrescriptions(patient._id);
      setPrescriptionItems([{ medicine: "", quantity: "", directions: "" }]);
      alert("Prescription saved");
    } catch (err) {
      console.error("Error saving prescription", err);
    }
  };

  const handleSave = async () => {
    if (!patient) return;

    const updated = await apiFetch(
      `http://localhost:5000/api/patients/${patient._id}/doctor-record`,
      {
        method: "POST",
        body: JSON.stringify({
          ...doctorSheet,
          initComplaint: newComplaint || doctorSheet.initComplaint,

          doctorName: storedUser?.name || "Doctor",
          department: patient.department || "General",

          recordType: hasHistory ? "follow-up" : "initial",
        }),
      },
    );

    alert("New record saved");

    setPatient(updated); // 🔥 IMPORTANT FIX
    setRecordMode("view");
  };

  const handleFurtherTreatment = async () => {
    if (!patient) return;
    await updatePatient(patient._id, { needsFurtherTreatment: true });
    alert("Patient flagged for further treatment");
  };

  const submitReferral = async () => {
    if (!referralDept || !referralReason) {
      alert("Please complete referral details");
      return;
    }

    try {
      const updated = await apiFetch(
        `http://localhost:5000/api/patients/${patient._id}/doctor-record`,
        {
          method: "POST",
          body: JSON.stringify({
            ...doctorSheet,
            initComplaint: newComplaint || doctorSheet.initComplaint,

            doctorName: localStorage.getItem("userName") || "Doctor",
            department: patient.department || "General",

            recordType: hasHistory ? "follow-up" : "initial",

            referral: {
              department: referralDept,
              reason: referralReason,
            },
          }),
        },
      );

      setPatient(updated);
      setShowReferral(false);
      setReferralDept("");
      setReferralReason("");
      setNewComplaint("");

      alert("Referral + record saved");
    } catch (err) {
      console.error("Referral error:", err);
    }
  };

  const handleReleased = async () => {
    if (!patient) return;
    await updatePatient(patient._id, { status: "released" });
    alert("Patient Has Been Treated");
  };

  const handleNextPatient = () => {
    if (!patients.length || !patient) return;

    const index = patients.findIndex(
      (p) => String(p._id) === String(patient._id),
    );

    if (index === -1) return;

    const next = patients[index + 1];
    if (next) selectPatient(next);
  };

  const activePrescriptions = Array.isArray(existingPrescriptions)
    ? existingPrescriptions.filter((p) => p.status !== "Completed")
    : [];

  // =========================
  // UI
  // =========================

  return (
    <form
      className="doctor-sheet-container"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="search-bar">
        <input
          placeholder="Search patient name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />

        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="search-results">
        {patients.map((p) => (
          <div
            key={p._id}
            className="search-result"
            onClick={() => selectPatient(p)}
          >
            {p.generalInfo.name}
          </div>
        ))}
      </div>

      {patient && (
        <div className="sheet-grid">
          {/* =========================
              REGISTRY DATA
          ========================= */}

          <div className="registry-data">
            <h3>General Info</h3>

            <div className="field-row">
              <label>Name</label>
              <input
                value={patient.generalInfo.name || ""}
                onChange={(e) =>
                  handleRegistryChange("generalInfo", "name", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Age</label>
              <input
                value={patient.generalInfo.age || ""}
                onChange={(e) =>
                  handleRegistryChange("generalInfo", "age", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Sex</label>
              <input
                value={patient.generalInfo.sex || ""}
                onChange={(e) =>
                  handleRegistryChange("generalInfo", "sex", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Insurance</label>
              <input
                value={patient.generalInfo.insurance || ""}
                onChange={(e) =>
                  handleRegistryChange(
                    "generalInfo",
                    "insurance",
                    e.target.value,
                  )
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Tobacco</label>
              <input
                value={patient.generalInfo.tobacco || ""}
                onChange={(e) =>
                  handleRegistryChange("generalInfo", "tobacco", e.target.value)
                }
              />
            </div>

            <div className="field-row">
              <label>Alcohol</label>
              <input
                value={patient.generalInfo.alcohol || ""}
                onChange={(e) =>
                  handleRegistryChange("generalInfo", "alcohol", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Allergies</label>
              <input
                value={patient.generalInfo.allergies || ""}
                onChange={(e) =>
                  handleRegistryChange(
                    "generalInfo",
                    "allergies",
                    e.target.value,
                  )
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Vaccine</label>
              <input
                value={patient.generalInfo.vaccine || ""}
                onChange={(e) =>
                  handleRegistryChange("generalInfo", "vaccine", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <h3>Vitals</h3>

            <div className="field-row">
              <label>BP</label>
              <input
                value={patient.examination.bp || ""}
                onChange={(e) =>
                  handleRegistryChange("examination", "bp", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Temp</label>
              <input
                value={patient.examination.temp || ""}
                onChange={(e) =>
                  handleRegistryChange("examination", "temp", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Height</label>
              <input
                value={patient.examination.height || ""}
                onChange={(e) =>
                  handleRegistryChange("examination", "height", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>Weight</label>
              <input
                value={patient.examination.weight || ""}
                onChange={(e) =>
                  handleRegistryChange("examination", "weight", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <div className="field-row">
              <label>BMI</label>
              <input
                value={patient.examination.bmi || ""}
                onChange={(e) =>
                  handleRegistryChange("examination", "bmi", e.target.value)
                }
                onKeyDown={handleEnterKey}
              />
            </div>

            <h3>Obstetric History</h3>

            <div className="field-row">
              <label>Contraception</label>
              <input
                value={patient.obstetricHistory?.contraception ? "Yes" : "No"}
                readOnly
              />
            </div>

            <div className="field-row">
              <label>Type</label>
              <input value={patient.obstetricHistory?.type || ""} readOnly />
            </div>

            <div className="field-row">
              <label>GPFPAL</label>
              <input value={patient.obstetricHistory?.gpfpal || ""} readOnly />
            </div>

            <div className="field-row">
              <label>BF</label>
              <input value={patient.obstetricHistory?.bf || ""} readOnly />
            </div>

            <div className="field-row">
              <label>Birth History</label>
              <input
                value={patient.obstetricHistory?.birthHistory || ""}
                readOnly
              />
            </div>

            <div className="field-row">
              <label>Delivery Site</label>
              <input
                value={patient.obstetricHistory?.deliverySite || ""}
                readOnly
              />
            </div>

            <div className="field-row">
              <label>LMP</label>
              <input value={patient.obstetricHistory?.lmp || ""} readOnly />
            </div>

            <h3>Perinatal History</h3>

            <div className="field-row">
              <label>Birth Weight</label>
              <input value={patient.perinatalHistory?.bw || ""} readOnly />
            </div>

            <div className="field-row">
              <label>BF</label>
              <input value={patient.perinatalHistory?.bf || ""} readOnly />
            </div>

            <div className="field-row">
              <label>Birth History</label>
              <input
                value={patient.perinatalHistory?.birthHistory || ""}
                readOnly
              />
            </div>

            <div className="field-row">
              <label>Delivery Site</label>
              <input
                value={patient.perinatalHistory?.deliverySite || ""}
                readOnly
              />
            </div>

            <div className="field-row">
              <label>Medical History</label>
              <input value={patient.medicalHistory.join(", ") || ""} readOnly />
            </div>

            <div className="field-row">
              <label>Family History</label>
              <input value={patient.familyHistory.join(", ") || ""} readOnly />
            </div>
          </div>

          {/* =========================
              DOCTOR DATA
          ========================= */}

          <div className="doctor-data">
            {/* TABS */}
            <div className="sheet-tabs">
              <button
                className={activeTab === "current" ? "active" : ""}
                onClick={() => setActiveTab("current")}
              >
                Current Record
              </button>

              <button
                className={`${activeTab === "history" ? "active" : ""} ${
                  !hasHistory ? "disabled" : ""
                }`}
                onClick={() => {
                  if (!hasHistory) return;
                  setActiveTab("history");
                }}
                disabled={!hasHistory}
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

            {activeTab === "current" && (
              <>
                {/* Examination */}
                <div className="exam-section">
                  <h3>Examination</h3>

                  <div className="examination">
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
                            onKeyDown={handleEnterKey}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Complaint */}

                <div className="complaint">
                  <h3>Complaint</h3>

                  <textarea
                    value={doctorSheet.initComplaint}
                    onChange={(e) =>
                      setDoctorSheet({
                        ...doctorSheet,
                        initComplaint: e.target.value,
                      })
                    }
                    onKeyDown={handleEnterKey}
                  />
                </div>

                {/* Diagnosis */}

                <h3>Diagnosis</h3>

                <textarea
                  value={doctorSheet.diagnosis}
                  onChange={(e) =>
                    setDoctorSheet({
                      ...doctorSheet,
                      diagnosis: e.target.value,
                    })
                  }
                  onKeyDown={handleEnterKey}
                />

                {/* Treatment */}

                <h3>Treatment</h3>

                <textarea
                  value={doctorSheet.treatment}
                  onChange={(e) =>
                    setDoctorSheet({
                      ...doctorSheet,
                      treatment: e.target.value,
                    })
                  }
                  onKeyDown={handleEnterKey}
                />

                {/* Saved Prescriptions */}

                <h4>Saved Prescriptions</h4>

                {activePrescriptions.length === 0 && (
                  <p>No existing prescriptions</p>
                )}

                {activePrescriptions.map((prescription) => (
                  <div
                    key={prescription._id}
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    {prescription.items.map((item) => (
                      <div key={item._id} style={{ marginBottom: "6px" }}>
                        <strong>
                          {item.medicine?.name || "Unknown Medicine"}{" "}
                          {item.medicine?.dosage
                            ? `(${item.medicine.dosage})`
                            : ""}
                        </strong>

                        <div>Quantity: {item.quantity}</div>

                        <div>Directions: {item.directions}</div>

                        {!item.isGiven ? (
                          <button
                            onClick={() =>
                              handleGiveMedicine(prescription._id, item._id)
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

                {/* New Prescription */}

                <h3>Prescription</h3>

                {prescriptionItems.map((item, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
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

                          const updated = [...prescriptionItems];
                          updated[index].medicine = ""; // reset until selected
                          setPrescriptionItems(updated);
                        }}
                        onFocus={() => setActiveDropdown(index)}
                      />

                      {/* 🔍 DROPDOWN RESULTS */}
                      {activeDropdown === index && medicineSearch[index] && (
                        <div className="medicine-dropdown">
                          {medicines
                            .filter((m) =>
                              m.name
                                .toLowerCase()
                                .includes(medicineSearch[index].toLowerCase()),
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
                                    [index]: `${m.name} (Stock: ${m.dosage}) (Stock: ${m.quantity})`,
                                  });

                                  setActiveDropdown(null);
                                }}
                              >
                                {m.name} {m.dosage ? `(${m.dosage})` : ""}{" "}
                                (Stock: {m.quantity})
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

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

                    <input
                      placeholder="Directions"
                      value={item.directions}
                      onChange={(e) => {
                        const updated = [...prescriptionItems];
                        updated[index].directions = e.target.value;
                        setPrescriptionItems(updated);
                      }}
                    />

                    <button
                      onClick={handleSavePrescription}
                      style={{ marginLeft: "10px" }}
                    >
                      Save Prescription
                    </button>
                  </div>
                ))}

                <button
                  onClick={() =>
                    setPrescriptionItems([
                      ...prescriptionItems,
                      { medicine: "", quantity: "", directions: "" },
                    ])
                  }
                >
                  Add Medicine
                </button>

                {/* Buttons */}

                <div className="sheet-buttons">
                  <button onClick={handleSave} disabled={recordMode !== "new"}>
                    Save Edits
                  </button>

                  <button onClick={handleReleased}>Cleared</button>

                  <button onClick={handleNextPatient}>For Pharmacy</button>

                  <button onClick={() => setShowReferral(true)}>
                    Further Treatment
                  </button>
                </div>

                <div className="referral">
                  {showReferral && (
                    <div className="referral-box">
                      <h3>Referral</h3>

                      <select
                        value={referralDept}
                        onChange={(e) => setReferralDept(e.target.value)}
                      >
                        <option value="">Select Department</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Ortho">Ortho</option>
                        <option value="Opta">Opta</option>
                        <option value="Dental">Dental</option>
                        <option value="Cardio">Cardio</option>
                        <option value="General">General</option>
                      </select>

                      <textarea
                        placeholder="Referral reason"
                        value={referralReason}
                        onChange={(e) => setReferralReason(e.target.value)}
                      />
                      {hasHistory && recordMode === "new" && (
                        <div className="new-complaint-box">
                          <h4>New Complaint (Follow-up)</h4>
                          <textarea
                            placeholder="Enter new complaint..."
                            value={newComplaint}
                            onChange={(e) => setNewComplaint(e.target.value)}
                          />
                        </div>
                      )}

                      <button onClick={submitReferral}>
                        Send to Department
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {activeTab === "history" && (
              <div className="history-view">
                <h3>Previous Records</h3>

                {patient?.doctorSheets?.length > 0 ? (
                  patient.doctorSheets.map((record, index) => (
                    <div
                      key={index}
                      className="history-card clickable"
                      onClick={() => {
                        setDoctorSheet({
                          examination:
                            record.examination || emptyDoctorSheet.examination,
                          initComplaint: record.initComplaint || "",
                          diagnosis: record.diagnosis || "",
                          treatment: record.treatment || "",
                          medication: record.medication || "",
                        });

                        setRecordMode("view");
                        setActiveTab("current");
                      }}
                    >
                      <div className="history-header">
                        <h4>{new Date(record.date).toLocaleString()}</h4>

                        <div className="history-meta">
                          <span>{record.doctorName || "Unknown Doctor"}</span>
                          <span>{record.department || "General"}</span>
                        </div>
                        <button
                          className="delete-record-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecord(record._id);
                          }}
                        >
                          Delete
                        </button>
                      </div>

                      <p>
                        <strong>Diagnosis:</strong> {record.diagnosis || "-"}
                      </p>
                      <p>
                        <strong>Treatment:</strong> {record.treatment || "-"}
                      </p>

                      <h4>Examination</h4>
                      {Object.entries(record.examination || {}).map(
                        ([key, val]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {val || "-"}
                          </div>
                        ),
                      )}

                      {record.referral?.department && (
                        <div className="referral-block">
                          <strong>Referred to:</strong>{" "}
                          {record.referral.department || "-"}
                          <br />
                          <strong>Reason:</strong>{" "}
                          {record.referral.reason || "-"}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No previous records available.</p>
                )}

                {/* PRESCRIPTIONS HISTORY */}
                <h3>Prescription History</h3>

                {existingPrescriptions.length === 0 && (
                  <p>No previous prescriptions</p>
                )}

                {existingPrescriptions.map((prescription) => (
                  <div key={prescription._id} className="history-card">
                    {prescription.items.map((item) => (
                      <div key={item._id}>
                        <strong>
                          {item.medicine?.name || "Unknown Medicine"}{" "}
                          {item.medicine?.dosage
                            ? `(${item.medicine.dosage})`
                            : ""}
                        </strong>
                        <div>Qty: {item.quantity}</div>
                        <div>{item.directions}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

export default DoctorSheet;
