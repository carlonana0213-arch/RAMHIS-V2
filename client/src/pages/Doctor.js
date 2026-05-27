import { useEffect, useState, useRef, useMemo } from "react";
import "../styles/doctor.css";
import { updatePatientStatus } from "../services/doctorService";
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
    let interval;

    const fetchData = async () => {
      if (!isMounted) return;

      await loadQueue();

      if (!interval) {
        interval = setInterval(() => {
          loadQueue();
        }, 3000);
      }
    };

    fetchData();

    return () => {
      isMounted = false;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const filteredPatients = useMemo(() => {
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
      filtered = filtered.filter(
        (p) => p.isPriority && p.status !== "unconsulted",
      );
    }
    // ALL TAB = exclude unconsulted
    if (queueFilter === "all") {
      filtered = filtered.filter((p) => p.status !== "unconsulted");
    }
    // UNCONSULTED FILTER
    if (queueFilter === "unconsulted") {
      filtered = filtered.filter((p) => p.status === "unconsulted");
    }

    filtered.sort((a, b) => {
      if (currentPatient && a._id === currentPatient._id) return -1;

      if (currentPatient && b._id === currentPatient._id) return 1;

      return 0;
    });

    return filtered;
  }, [
    patients,
    search,
    queueFilter,
    doctorDepartment,
    storedUser?.role,
    currentPatient,
  ]);

  useEffect(() => {
    if (filteredPatients.length === 0) {
      setCurrentPatient(null);
      return;
    }

    setCurrentPatient((prev) => {
      // if patient is already top row, preserve it
      if (prev && filteredPatients[0]?._id === prev._id) {
        return prev;
      }

      // otherwise follow top row
      return filteredPatients[0];
    });
  }, [filteredPatients]);

  const openDoctorView = async (patient) => {
    try {
      const updatedPatient = {
        ...patient,
        status: "beingSeen",
      };

      // fill patient card
      setCurrentPatient(updatedPatient);

      // open modal
      setSelectedPatient(updatedPatient);
      setShowDoctorView(true);

      await updatePatientStatus(patient._id, {
        status: "beingSeen",
      });

      await loadQueue();
    } catch (err) {
      console.error("Failed to update patient status", err);

      alert("Failed to update patient status");

      setShowDoctorView(false);
      setSelectedPatient(null);
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
            onSelect={openDoctorView}
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
            patients={filteredPatients}
            search={search}
            setSearch={setSearch}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
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
