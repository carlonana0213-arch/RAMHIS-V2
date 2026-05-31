import React, { useEffect, useRef, useState, useCallback } from "react";
import "../styles/doctor.css";
import { updatePatientStatus } from "../services/doctorService";
import { getDoctorQueue, getPatientById } from "../services/patientService";
import ConfirmModal from "../components/ConfirmModal";

import DoctorQueue from "./doctor/doctorQueue";
import PatientCard from "./doctor/patientCard";
import PatientDoctorView from "./doctor/patientDoctorView";
import TableSkeleton from "../components/loading/tableSkeleton";
import PatientCardSkeleton from "../components/loading/patientCardSkeleton";
import socket from "../services/socket";
import { API_BASE_URL } from "../services/apiConfig";

function Doctor() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const doctorDepartment = storedUser?.doctorInfo?.specialization || "General";

  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [totalPatients, setTotalPatients] = useState(0);

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [showDoctorView, setShowDoctorView] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);

  const [currentMission, setCurrentMission] = useState(null);
  const [showAllRecords, setShowAllRecords] = useState(false);

  const hasLoadedRef = useRef(false);

  const getAuthHeaders = () => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      savedUser.token ||
      savedUser.accessToken;

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

  const loadQueue = useCallback(
    async (options = {}) => {
      try {
        const useAllRecords =
          typeof options.all === "boolean" ? options.all : showAllRecords;

        if (!hasLoadedRef.current) {
          setLoading(true);
        }

        const queue = await getDoctorQueue({
          page: currentPage,
          search,
          queueFilter,
          department: doctorDepartment,
          role: storedUser?.role,
          all: useAllRecords,
          currentMission,
        });

        setPatients(queue.patients || []);

        setTotalPatients(queue.total || 0);

        setTotalPages(queue.totalPages || 1);

        hasLoadedRef.current = true;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      search,
      queueFilter,
      doctorDepartment,
      storedUser?.role,
      showAllRecords,
    ],
  );

  useEffect(() => {
    loadCurrentMission();
  }, [loadCurrentMission]);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const safeLoadQueue = async (options = {}) => {
      if (!isMounted || isFetching) return;

      isFetching = true;

      try {
        await loadQueue(options);
      } finally {
        isFetching = false;
      }
    };

    safeLoadQueue();

    const handleQueueUpdated = () => {
      safeLoadQueue();
    };

    const handleMissionStarted = (data) => {
      setCurrentPage(1);
      setShowAllRecords(false);
      setCurrentPatient(null);
      loadCurrentMission();
      safeLoadQueue({ all: false });

      alert(
        `Mission started: ${data.eventTitle}\nDoctor queue has been reset for the new mission.`,
      );
    };

    const handleMissionCompleted = () => {
      setCurrentPage(1);
      setShowAllRecords(false);
      setCurrentPatient(null);
      loadCurrentMission();
      safeLoadQueue({ all: false });
    };

    // socket updates
    socket.on("queueUpdated", handleQueueUpdated);
    socket.on("mission_started", handleMissionStarted);
    socket.on("mission_completed", handleMissionCompleted);

    // fallback refresh every minute
    const fallbackTimer = setInterval(() => {
      if (!document.hidden) {
        loadCurrentMission();
        safeLoadQueue();
      }
    }, 60000);

    return () => {
      isMounted = false;

      clearInterval(fallbackTimer);

      socket.off("queueUpdated", handleQueueUpdated);
      socket.off("mission_started", handleMissionStarted);
      socket.off("mission_completed", handleMissionCompleted);
    };
  }, [currentPage, search, queueFilter, loadQueue, loadCurrentMission]);

  useEffect(() => {
    if (patients.length === 0) {
      setCurrentPatient(null);

      return;
    }

    setCurrentPatient((prev) => {
      if (prev && patients[0]?._id === prev._id) {
        return prev;
      }

      return patients[0];
    });
  }, [patients]);

  const handleToggleRecords = () => {
    setCurrentPage(1);
    setShowAllRecords((prev) => !prev);
  };

  const openDoctorView = async (patient) => {
    try {
      const fullPatient = await getPatientById(patient._id);

      const selected = fullPatient || patient;

      // fill patient card
      setCurrentPatient(selected);

      // move consulted patient to top of queue
      setPatients((prev) => {
        const remaining = prev.filter((p) => p._id !== patient._id);

        return [selected, ...remaining];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextPatient = () => {
    if (!currentPatient) return;

    setShowReleaseConfirm(true);
  };

  const confirmReleaseAndNext = async () => {
    try {
      await updatePatientStatus(currentPatient._id, {
        status: "released",
      });

      setCurrentPatient(null);

      await loadQueue();

      setShowReleaseConfirm(false);
    } catch (err) {
      console.error("Failed to release patient", err);
    }
  };

  return (
    <div className="doctor-page">
      <div className="doctor-header">
        <h1>Doctors Queue</h1>
      </div>

      {/* MISSION STATUS BANNER */}
      {currentMission ? (
        <div className="mission-status-banner mission-status-ongoing">
          <div>
            <strong>🔴 LIVE {currentMission.title} - Ongoing</strong>
            <p>
              {showAllRecords
                ? "Showing all historical doctor queue records."
                : "Doctor queue showing current mission records only. Past records are hidden."}
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
          <strong>📋 Showing all doctor queue records</strong>
          <p>No active mission currently.</p>
        </div>
      )}

      <div className="doctor-main-layout">
        {/* CURRENT PATIENT CARD */}
        {loading ? (
          <PatientCardSkeleton />
        ) : (
          <PatientCard
            patient={currentPatient}
            onSelect={async () => {
              if (!currentPatient) return;

              try {
                // load full patient
                const fullPatient = await getPatientById(currentPatient._id);

                // online status update only
                if (navigator.onLine && currentPatient.status === "waiting") {
                  await updatePatientStatus(currentPatient._id, {
                    status: "beingSeen",
                  });
                }

                setSelectedPatient({
                  ...(fullPatient || currentPatient),

                  status: navigator.onLine
                    ? "beingSeen"
                    : currentPatient.status,
                });

                setShowDoctorView(true);
              } catch (err) {
                console.error("Failed to open doctor sheet", err);
              }
            }}
            onNextPatient={handleNextPatient}
            refreshQueue={loadQueue}
            setCurrentPatient={setCurrentPatient}
          />
        )}

        {/* TABLE */}

        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : (
          <DoctorQueue
            patients={patients}
            search={search}
            setSearch={setSearch}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPatients={totalPatients}
            totalPages={totalPages}
            onOpenDoctorView={openDoctorView}
            setCurrentPatient={setCurrentPatient}
          />
        )}
      </div>

      {/* MODAL */}

      {showDoctorView && (
        <PatientDoctorView
          patient={selectedPatient}
          onClose={() => setShowDoctorView(false)}
          refreshQueue={loadQueue}
        />
      )}

      {showReleaseConfirm && (
        <ConfirmModal
          message="Are you sure you want to proceed and release current patient? This will remove the patient from the list."
          onConfirm={confirmReleaseAndNext}
          onCancel={() => setShowReleaseConfirm(false)}
        />
      )}
    </div>
  );
}

export default Doctor;
