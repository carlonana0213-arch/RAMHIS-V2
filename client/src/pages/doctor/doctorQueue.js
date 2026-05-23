import { useEffect, useState } from "react";
function DoctorQueue({
  patients,
  search,
  setSearch,
  onOpenDoctorView,
  queueFilter,
  setQueueFilter,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
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
  const totalPatients = patients.length;

  const totalPages = Math.ceil(totalPatients / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = startIndex + ITEMS_PER_PAGE;

  const displayedPatients = patients.slice(startIndex, endIndex);

  const displayedCount = Math.min(endIndex, totalPatients);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, queueFilter]);
  return (
    <div className="doctor-queue-container">
      <div className="doctor-topbar">
        <input
          type="text"
          placeholder="Search Patient"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="doctor-search-input"
        />

        <div className="doctor-filter-group">
          <button
            className={queueFilter === "all" ? "active" : ""}
            onClick={() => setQueueFilter("all")}
          >
            All
          </button>

          <button
            className={queueFilter === "priority" ? "active" : ""}
            onClick={() => setQueueFilter("priority")}
          >
            Priority
          </button>
        </div>
      </div>
      <div className="doctor-queue-table-wrapper">
        <table className="doctor-queue-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Complaint</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table">
                  No patients found
                </td>
              </tr>
            ) : (
              displayedPatients.map((patient) => (
                <tr
                  key={patient._id}
                  className={patient.isPriority ? "priority-row" : ""}
                >
                  <td>
                    <div className="patient-name-cell">
                      {patient.generalInfo?.name}

                      {patient.isPriority && (
                        <span className="priority-badge">PRIORITY</span>
                      )}
                    </div>
                  </td>

                  <td>{patient.generalInfo?.age}</td>

                  <td>
                    {patient.generalInfo?.gender || patient.generalInfo?.sex}
                  </td>

                  <td>{patient.initComplaint}</td>

                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background: statusColors[patient.status] || "#cbd5e1",
                      }}
                    >
                      {statusLabels[patient.status] || patient.status}{" "}
                    </span>
                  </td>

                  <td>
                    <button
                      className="queue-action-btn"
                      onClick={() => onOpenDoctorView(patient)}
                    >
                      Open Sheet
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPatients > 0 && (
          <div className="doctor-pagination">
            <button
              className="doctor-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span className="doctor-pagination-text">
              {displayedCount} of {totalPatients}
            </span>

            <button
              className="doctor-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorQueue;
