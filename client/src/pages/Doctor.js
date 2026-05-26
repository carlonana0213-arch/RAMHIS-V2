import { useEffect, useState, useRef } from "react";

import "../styles/doctor.css";

import { getPatientQueue } from "../services/patientService";
import ConfirmModal from "../components/ConfirmModal";

import DoctorQueue from "./doctor/doctorQueue";
import PatientCard from "./doctor/patientCard";
import PatientDoctorView from "./doctor/patientDoctorView";
import TableSkeleton from "../components/loading/tableSkeleton";
import PatientCardSkeleton from "../components/loading/patientCardSkeleton";

function Doctor() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const doctorDepartment = storedUser?.doctorInfo?.specialization || "General";

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredPatients, setFilteredPatients] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [showDoctorView, setShowDoctorView] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadQueue = async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      const queue = await getPatientQueue();

      const activePatients = queue.filter((p) => p.status !== "released");

      setPatients(activePatients);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;

      await loadQueue();
    };

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let filtered = [...patients];

    // ADMIN SEES EVERYTHING
    if (storedUser?.role !== "admin") {
      // NORMAL VIEW = OWN DEPARTMENT ONLY
      if (search.trim() === "") {
        filtered = filtered.filter((p) => p.department === doctorDepartment);
      }
    }

    // SEARCH ALL PATIENTS
    if (search.trim() !== "") {
      filtered = filtered.filter((p) =>
        p.generalInfo?.name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // PRIORITY FILTER
    if (queueFilter === "priority") {
      filtered = filtered.filter((p) => p.isPriority);
    }

    setFilteredPatients(filtered);
  }, [patients, search, queueFilter, doctorDepartment, storedUser?.role]);

  const openDoctorView = async (patient) => {
    try {
      const { updatePatientStatus } = await import("../services/doctorService");

      await updatePatientStatus(patient._id, {
        status: "beingSeen",
      });

      await loadQueue();

      setSelectedPatient({
        ...patient,
        status: "beingSeen",
      });

      setShowDoctorView(true);
    } catch (err) {
      console.error("Failed to update patient status", err);
    }
  };
  const currentPatient = filteredPatients[queueIndex];
  const handleNextPatient = () => {
    if (!currentPatient) return;

    setShowReleaseConfirm(true);
  };
  const confirmReleaseAndNext = async () => {
    try {
      await import("../services/doctorService").then(
        async ({ updatePatientStatus }) => {
          await updatePatientStatus(currentPatient._id, {
            status: "released",
          });
        },
      );

      await loadQueue();

      setQueueIndex((prev) => {
        const updatedLength = filteredPatients.length - 1;

        if (updatedLength <= 0) return 0;

        if (prev >= updatedLength) {
          return 0;
        }

        return prev;
      });

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
            onSelect={openDoctorView}
            onNextPatient={handleNextPatient}
          />
        )}

        {/* TABLE */}

        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : (
          <DoctorQueue
            patients={filteredPatients}
            search={search}
            setSearch={setSearch}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
            onOpenDoctorView={openDoctorView}
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
