import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";

import "../../styles/queue.css";

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

const PatientQueue = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

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
    )
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return 0;
    });

  const openPatient = (patient) => {
    onSelectPatient(patient);
  };

  return (
    <div className="queue-container">
      {/* SEARCH */}
      <div className="queue-toolbar">
        <input
          className="queue-search-input"
          placeholder="Search patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="department-dropdown"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="All">All Departments</option>

          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
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
                backgroundColor: patient.isPriority
                  ? "#fee2e2"
                  : statusRowColors[patient.status] || "white",

                borderLeft: patient.isPriority
                  ? "5px solid #dc2626"
                  : "5px solid transparent",
              }}
              onClick={() => openPatient(patient)}
            >
              <span className="queue-number">{index + 1}</span>

              <span className="queue-patient-name">
                {patient.generalInfo.name}

                {patient.isPriority && (
                  <span className="queue-priority-badge">PRIORITY</span>
                )}
              </span>

              <span>{patient.generalInfo.age}</span>

              <span>
                {patient.generalInfo.sex || patient.generalInfo.gender || "--"}
              </span>

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
