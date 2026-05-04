import { useState, useEffect } from "react";
import PatientQueue from "./patients/PatientQueue";
import AddPatientModal from "./patients/AddPatientModal";
import PatientViewModal from "./patients/PatientViewModal";
import "../styles/patient.css";
import { useLocation } from "react-router-dom";

const Patient = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  return (
    <div className="patient-page">
      {/* HEADER */}
      <div className="patient-header">
        <h2>Patient Queue</h2>

        <button
          className="add-patient-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Patient
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="patient-content">
        <PatientQueue onSelectPatient={setSelectedPatient} />
      </div>

      {/* MODAL */}
      {showAddModal && (
        <AddPatientModal onClose={() => setShowAddModal(false)} />
      )}

      {selectedPatient && (
        <PatientViewModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
};

export default Patient;
