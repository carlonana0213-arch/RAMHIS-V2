import { useState, useEffect } from "react";
import { getPatientQueue, getQueueSummary } from "../services/patientService";
import PatientQueue from "./patients/PatientQueue";
import PatientDashboard from "./patients/PatientDashboard";
import AddPatientModal from "./patients/AddPatientModal";
import PatientViewModal from "./patients/PatientViewModal";
import "../styles/patient.css";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "../services/apiConfig";
import socket from "../services/socket";

const Patient = () => {
  const [patients, setPatients] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");

  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [totalPatients, setTotalPatients] = useState(0);

  const [totalPages, setTotalPages] = useState(1);
  const [queueSummary, setQueueSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  useEffect(() => {
    let isFetching = false;

    const fetchQueue = async () => {
      if (isFetching) return;

      isFetching = true;
      console.time("queue-load");

      try {
        const [data, summary] = await Promise.all([
          getPatientQueue({
            page: currentPage,
            search,
            department: departmentFilter,
          }),
          getQueueSummary(),
        ]);
        setPatients(data.patients);
        setTotalPatients(data.total);
        setTotalPages(data.totalPages);
        setQueueSummary(summary);
      } catch (err) {
        console.error(err);
      } finally {
        console.timeEnd("queue-load");
        setLoading(false);
        isFetching = false;
      }
    };
    fetchQueue();

    let fallbackTimer;

    socket.on("queueUpdated", () => {
      fetchQueue();
    });

    fallbackTimer = setInterval(() => {
      if (!document.hidden) {
        fetchQueue();
      }
    }, 60000);

    return () => {
      clearInterval(fallbackTimer);
      socket.off("queueUpdated");
    };
  }, [currentPage, search, departmentFilter]);
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
        <PatientDashboard summary={queueSummary} loading={loading} />

        <PatientQueue
          patients={patients}
          loading={loading}
          onSelectPatient={setSelectedPatient}
          search={search}
          setSearch={setSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPatients={totalPatients}
          totalPages={totalPages}
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
