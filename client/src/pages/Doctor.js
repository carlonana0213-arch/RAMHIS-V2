import { useEffect, useState, useRef, useMemo } from "react";
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
  const hasLoadedRef = useRef(false);

  const loadQueue = async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      const queue = await getDoctorQueue({
        page: currentPage,
        search,
        queueFilter,

        department: doctorDepartment,

        role: storedUser?.role,
      });

      setPatients(queue.patients);

      setTotalPatients(queue.total);

      setTotalPages(queue.totalPages);

      hasLoadedRef.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const safeLoadQueue = async () => {
      if (!isMounted || isFetching) return;

      isFetching = true;

      try {
        await loadQueue();
      } finally {
        isFetching = false;
      }
    };

    safeLoadQueue();

    // socket updates
    socket.on("queueUpdated", () => {
      safeLoadQueue();
    });

    // fallback refresh every minute
    const fallbackTimer = setInterval(() => {
      if (!document.hidden) {
        safeLoadQueue();
      }
    }, 60000);

    return () => {
      isMounted = false;

      clearInterval(fallbackTimer);

      socket.off("queueUpdated");
    };
  }, [currentPage, search, queueFilter]);

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

  const openDoctorView = async (patient) => {
    try {
      const fullPatient = await getPatientById(patient._id);

      setCurrentPatient(fullPatient || patient);
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
