import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import PatientQueue from "./patients/PatientQueue";
import PatientDashboard from "./patients/PatientDashboard";
import AddPatientModal from "./patients/AddPatientModal";
import PatientViewModal from "./patients/PatientViewModal";
import "../styles/patient.css";
import { API_BASE_URL } from "../services/apiConfig";

const Patient = () => {
  const [patients, setPatients] = useState([]);
  const [ongoingEvent, setOngoingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await apiFetch(`${API_BASE_URL}/api/patients/queue`);

      /*
        New backend response:
        {
          ongoingEvent: {...} or null,
          patients: [...]
        }

        Fallback support:
        If backend still returns an array, this will not break.
      */
      if (Array.isArray(data)) {
        setPatients(data);
        setOngoingEvent(null);
      } else {
        setPatients(data.patients || []);
        setOngoingEvent(data.ongoingEvent || null);
      }
    } catch (err) {
      console.error("Failed to load patient queue:", err);
      setPatients([]);
      setOngoingEvent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();

    const interval = setInterval(() => {
      fetchQueue(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchQueue]);
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

      {/* ADD PATIENT MODAL */}
      {showAddModal && ongoingEvent && (
        <AddPatientModal
          ongoingEvent={ongoingEvent}
          onClose={() => {
            setShowAddModal(false);
            fetchQueue(true);
          }}
        />
      )}
    </div>
  );
};

export default Patient;
