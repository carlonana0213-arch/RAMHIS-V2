import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import PatientQueue from "./patients/PatientQueue";
import PatientDashboard from "./patients/PatientDashboard";
import AddPatientModal from "./patients/AddPatientModal";
import PatientViewModal from "./patients/PatientViewModal";
import "../styles/patient.css";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "../services/apiConfig";

const Patient = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  useEffect(() => {
    const fetchQueue = async () => {
      console.time("queue-load");

      try {
        const data = await apiFetch(`${API_BASE_URL}/api/patients/queue`);

        setPatients(data);
      } catch (err) {
        console.error(err);
      } finally {
        console.timeEnd("queue-load");
        setLoading(false);
      }
    };

    fetchQueue();

    const interval = setInterval(() => {
      fetchQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, []);
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
        <PatientDashboard patients={patients} loading={loading} />

        <PatientQueue
          patients={patients}
          loading={loading}
          onSelectPatient={setSelectedPatient}
        />
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
