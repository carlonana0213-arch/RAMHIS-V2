import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";
import TableSkeleton from "../../components/loading/tableSkeleton";
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
  forPharmacy: "#34d399",
};
const statusLabels = {
  waiting: "Waiting",
  beingSeen: "Being Served",
  forPharmacy: "For Pharmacy",
};
const PatientQueue = ({
  patients,
  loading,
  onSelectPatient,

  search,
  setSearch,

  departmentFilter,
  setDepartmentFilter,

  currentPage,
  setCurrentPage,

  totalPatients,
  totalPages,
}) => {
  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter]);

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  const displayedPatients = patients;

  const displayedCount = Math.min(currentPage * 15, totalPatients);

  const startIndex = (currentPage - 1) * 15;

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

        {displayedPatients.length === 0 ? (
          <div className="queue-empty">No patients in this department</div>
        ) : (
          displayedPatients.map((patient, index) => (
            <div
              key={patient._id}
              className="queue-row"
              onClick={() => openPatient(patient)}
            >
              <span className="queue-number">{startIndex + index + 1}</span>

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
                {statusLabels[patient.status] || patient.status}{" "}
              </span>
            </div>
          ))
        )}
      </div>
      {totalPatients > 0 && (
        <div className="queue-pagination">
          <button
            className="queue-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </button>

          <span className="queue-pagination-text">
            {displayedCount} of {totalPatients}
          </span>

          <button
            className="queue-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientQueue;
