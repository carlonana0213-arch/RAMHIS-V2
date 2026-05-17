import { useEffect, useState } from "react";

import "../styles/doctor.css";

import { getPatientQueue } from "../services/patientService";

import DoctorQueue from "./doctor/doctorQueue";
import PatientCard from "./doctor/patientCard";
import PatientDoctorView from "./doctor/patientDoctorView";

function Doctor() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const doctorDepartment = storedUser?.doctorInfo?.specialization || "General";

  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [showDoctorView, setShowDoctorView] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const loadQueue = async () => {
    try {
      const queue = await getPatientQueue();

      // REMOVE RELEASED PATIENTS
      const activePatients = queue.filter((p) => p.status !== "released");

      // ONLY STORE RAW PATIENTS
      setPatients(activePatients);
    } catch (err) {
      console.error(err);
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
    if (filteredPatients.length === 0) return;

    setQueueIndex((prev) => {
      if (prev >= filteredPatients.length - 1) {
        return 0;
      }

      return prev + 1;
    });
  };
  return (
    <div className="doctor-page">
      <div className="doctor-header">
        <h1>Doctors Queue</h1>
      </div>

      <div className="doctor-main-layout">
        {/* CURRENT PATIENT CARD */}
        <PatientCard
          patient={currentPatient}
          onSelect={openDoctorView}
          onNextPatient={handleNextPatient}
        />

        {/* TABLE */}

        <DoctorQueue
          patients={filteredPatients}
          search={search}
          setSearch={setSearch}
          queueFilter={queueFilter}
          setQueueFilter={setQueueFilter}
          onOpenDoctorView={openDoctorView}
        />
      </div>

      {/* MODAL */}

      {showDoctorView && (
        <PatientDoctorView
          patient={selectedPatient}
          onClose={() => setShowDoctorView(false)}
          refreshQueue={loadQueue}
        />
      )}
    </div>
  );
}

export default Doctor;
