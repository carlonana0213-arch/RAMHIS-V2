import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/queue.css";

const departments = [
  "Pediatrics",
  "Ortho",
  "Opta",
  "Dental",
  "Cardio",
  "General",
];

const statusColors = {
  waiting: "#facc15",
  beingSeen: "#38bdf8",
};

const statusRowColors = {
  waiting: "#fef9c3",
  beingSeen: "#e0f2fe",
};

const PatientQueue = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await apiFetch("http://localhost:5000/api/patients/queue");
        setPatients(data);
      } catch (err) {
        console.error("Error loading patient queue", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  if (loading) return <p>Loading patient queue...</p>;

  const activePatients = patients.filter((p) => p.status !== "released");

  const filteredPatients = activePatients
    .filter((p) =>
      p.generalInfo.name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((p) =>
      departmentFilter === "All" ? true : p.department === departmentFilter,
    );

  const openPatient = (patient) => {
    navigate("/patient", {
      state: {
        patientId: patient._id,
        tab: "view",
      },
    });
  };

  return (
    <div className="queue-container">
      <h2>Patient Queue</h2>

      {/* SEARCH */}
      <div className="queue-search">
        <input
          placeholder="Search patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="queue-tabs">
        <button
          className={departmentFilter === "All" ? "tab active" : "tab"}
          onClick={() => setDepartmentFilter("All")}
        >
          All
        </button>

        {departments.map((dept) => (
          <button
            key={dept}
            className={departmentFilter === dept ? "tab active" : "tab"}
            onClick={() => setDepartmentFilter(dept)}
          >
            {dept}
          </button>
        ))}
      </div>
      {/* MAIN QUEUE TABLE */}

      <div className="queue-table">
        <div className="queue-header">
          <span>#</span>
          <span>Patient</span>
          <span>Age</span>
          <span>Sex</span>
          <span>Department</span>
          <span>Status</span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="queue-empty">No patients in this department</div>
        ) : (
          filteredPatients.map((patient, index) => (
            <div
              key={patient._id}
              className="queue-row"
              style={{
                backgroundColor: statusRowColors[patient.status] || "white",
              }}
              onClick={() => openPatient(patient)}
            >
              <span className="queue-number">{index + 1}</span>

              <span>{patient.generalInfo.name}</span>

              <span>{patient.generalInfo.age}</span>

              <span>{patient.generalInfo.sex}</span>

              <span>{patient.department}</span>

              <span
                className="status-badge"
                style={{ background: statusColors[patient.status] }}
              >
                {patient.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientQueue;
