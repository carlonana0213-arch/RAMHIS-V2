import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [patients, setPatients] = useState([]);
  const [ongoingEvent, setOngoingEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [showDoctorView, setShowDoctorView] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);

  const hasLoadedRef = useRef(false);

  const loadQueue = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      const queueResponse = await getPatientQueue();

      /*
        Supports both response formats:

        Old:
        [patients]

        New:
        {
          ongoingEvent,
          patients
        }
      */
      const patientList = Array.isArray(queueResponse)
        ? queueResponse
        : queueResponse?.patients || [];

      const currentEvent = Array.isArray(queueResponse)
        ? null
        : queueResponse?.ongoingEvent || null;

      const activePatients = patientList.filter(
        (patient) => patient.status !== "released"
      );

      setPatients(activePatients);
      setOngoingEvent(currentEvent);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to load doctor queue:", err);
      setPatients([]);
      setOngoingEvent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();

    const interval = setInterval(() => {
      loadQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadQueue]);

  const filteredPatients = useMemo(() => {
    let filtered = [...patients];

    if (search.trim() !== "") {
      filtered = filtered.filter((patient) =>
        (patient.generalInfo?.name || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (queueFilter === "priority") {
      filtered = filtered.filter((patient) => patient.isPriority);
    }

    return filtered;
  }, [patients, search, queueFilter]);

  useEffect(() => {
    setQueueIndex(0);
  }, [search, queueFilter, patients.length]);

  const openDoctorView = async (patient) => {
    try {
      setSelectedPatient({
        ...patient,
        status: "beingSeen",
      });

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

  const currentPatient = filteredPatients[queueIndex] || null;

  const handleNextPatient = () => {
    if (!currentPatient) return;

    setShowReleaseConfirm(true);
  };

  const confirmReleaseAndNext = async () => {
    try {
      if (!currentPatient) return;

      await updatePatientStatus(currentPatient._id, {
        status: "released",
      });

      await loadQueue();

      setQueueIndex(0);
      setShowReleaseConfirm(false);
    } catch (err) {
      console.error("Failed to release patient", err);
    }
  };

  return (
    <div className="doctor-page">
      <div className="doctor-header">
        <div>
          <h1>Doctors Queue</h1>

          {ongoingEvent ? (
            <p className="doctor-current-event">
              Current Mission: <strong>{ongoingEvent.title}</strong> —{" "}
              {ongoingEvent.location}
            </p>
          ) : (
            <p className="doctor-current-event no-event">
              No ongoing event. Showing unfinished patients from previous
              missions.
            </p>
          )}
        </div>
      </div>

      <div className="doctor-main-layout">
        {loading ? (
          <PatientCardSkeleton />
        ) : (
          <PatientCard
            patient={currentPatient}
            onSelect={openDoctorView}
            onNextPatient={handleNextPatient}
          />
        )}

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

      {showDoctorView && selectedPatient && (
        <PatientDoctorView
          patient={selectedPatient}
          onClose={() => {
            setShowDoctorView(false);
            setSelectedPatient(null);
            loadQueue();
          }}
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