function DoctorQueue({
  patients,
  search,
  setSearch,
  onOpenDoctorView,
  queueFilter,
  setQueueFilter,
}) {
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
            {patients.map((patient) => (
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

                <td>{patient.status}</td>

                <td>
                  <button
                    className="queue-action-btn"
                    onClick={() => onOpenDoctorView(patient)}
                  >
                    Open Sheet
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DoctorQueue;
