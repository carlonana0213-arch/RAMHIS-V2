import { useState, useEffect, useCallback } from "react";
import { getPatientQueue, getQueueSummary } from "../services/patientService";
import PatientQueue from "./patients/PatientQueue";
import PatientDashboard from "./patients/PatientDashboard";
import AddPatientModal from "./patients/AddPatientModal";
import PatientViewModal from "./patients/PatientViewModal";
import "../styles/patient.css";
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

  const [currentMission, setCurrentMission] = useState(null);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);
  const getAuthHeaders = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      storedUser.token ||
      storedUser.accessToken;

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const loadCurrentMission = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/current-mission`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (data?.data?.hasOngoingMission) {
        setCurrentMission(data.data.event);
      } else {
        setCurrentMission(null);
        setShowAllRecords(false);
      }
    } catch (err) {
      console.error("Failed to load current mission:", err);
    }
  }, []);

  const fetchQueue = useCallback(
    async (options = {}) => {
      const useAllRecords =
        typeof options.all === "boolean" ? options.all : showAllRecords;

      setLoading(true);
      console.time("queue-load");

      try {
        const [data, summary] = await Promise.all([
          getPatientQueue({
            page: currentPage,
            search: debouncedSearch,
            department: departmentFilter,
            all: useAllRecords,
          }),
          getQueueSummary({
            all: useAllRecords,
          }),
        ]);

        setPatients(data.patients || []);
        setTotalPatients(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setQueueSummary(summary);
      } catch (err) {
        console.error(err);
      } finally {
        console.timeEnd("queue-load");
        setLoading(false);
      }
    },
    [currentPage, debouncedSearch, departmentFilter, showAllRecords],
  );

  useEffect(() => {
    loadCurrentMission();
  }, [loadCurrentMission]);

  useEffect(() => {
    fetchQueue();

    const handleQueueUpdated = () => {
      fetchQueue();
    };

    const handleMissionStarted = (data) => {
      setCurrentPage(1);
      setShowAllRecords(false);
      loadCurrentMission();
      fetchQueue({ all: false });

      alert(
        `Mission started: ${data.eventTitle}\nPatient list has been reset for new mission.`,
      );
    };

    const handleMissionCompleted = () => {
      setCurrentPage(1);
      setShowAllRecords(false);
      loadCurrentMission();
      fetchQueue({ all: false });
    };

    socket.on("queueUpdated", handleQueueUpdated);
    socket.on("mission_started", handleMissionStarted);
    socket.on("mission_completed", handleMissionCompleted);

    const fallbackTimer = setInterval(() => {
      if (!document.hidden) {
        loadCurrentMission();
        fetchQueue();
      }
    }, 60000);

    return () => {
      clearInterval(fallbackTimer);
      socket.off("queueUpdated", handleQueueUpdated);
      socket.off("mission_started", handleMissionStarted);
      socket.off("mission_completed", handleMissionCompleted);
    };
  }, [fetchQueue, loadCurrentMission]);

  const handleToggleRecords = () => {
    setCurrentPage(1);
    setShowAllRecords((prev) => !prev);
  };

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

      {/* MISSION STATUS BANNER */}
      {currentMission ? (
        <div className="mission-status-banner mission-status-ongoing">
          <div>
            <strong>🔴 LIVE {currentMission.title} - Ongoing</strong>
            <p>
              {showAllRecords
                ? "Showing all waiting patients from all missions."
                : "Patient list showing current mission records only. Past records are hidden."}
            </p>
          </div>

          <button
            type="button"
            className="mission-records-toggle-btn"
            onClick={handleToggleRecords}
          >
            {showAllRecords
              ? "Show Current Mission Only"
              : "View All Historical Records"}
          </button>
        </div>
      ) : (
        <div className="mission-status-banner mission-status-all">
          <strong>📋 Showing all patient records</strong>
          <p>No active mission currently.</p>
        </div>
      )}

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
        <AddPatientModal
          onClose={() => {
            setShowAddModal(false);
            fetchQueue();
          }}
        />
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
