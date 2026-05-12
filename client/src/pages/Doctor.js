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

  const loadQueue = async () => {
    try {
      const queue = await getPatientQueue();

      const filtered = queue.filter(
        (p) => p.department === doctorDepartment && p.status !== "released",
      );

      setPatients(filtered);
      setFilteredPatients(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    let filtered = patients.filter((p) =>
      p.generalInfo?.name?.toLowerCase().includes(search.toLowerCase()),
    );

    if (queueFilter === "priority") {
      filtered = filtered.filter((p) => p.isPriority);
    }

    filtered.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return 0;
    });

    setFilteredPatients(filtered);
  }, [search, patients, queueFilter]);

  const openDoctorView = (patient) => {
    setSelectedPatient(patient);
    setShowDoctorView(true);
  };

  return (
    <div className="doctor-page">
      <div className="doctor-header">
        <h1>Doctors Queue</h1>
      </div>

      {/* TOP CARDS */}

      <div className="doctor-card-row">
        {filteredPatients.slice(0, 4).map((patient) => (
          <PatientCard
            key={patient._id}
            patient={patient}
            onSelect={openDoctorView}
          />
        ))}
      </div>

      {/* TABLE */}

      <DoctorQueue
        patients={filteredPatients}
        search={search}
        setSearch={setSearch}
        queueFilter={queueFilter}
        setQueueFilter={setQueueFilter}
        onOpenDoctorView={openDoctorView}
      />

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
