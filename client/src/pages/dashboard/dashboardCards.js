import { FaUserInjured, FaUsers } from "react-icons/fa";

function DashboardCards({ summary }) {
  return (
    <div className="dashboard-cards">
      <div className="summary-card">
        <div className="summary-card-top">
          <div>
            <h3>Total Patients</h3>
            <h1>{summary.totalPatients}</h1>
          </div>

          <div className="card-icon-box patient-icon">
            <FaUserInjured />
          </div>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card-top">
          <div>
            <h3>Total Users</h3>
            <h1>{summary.totalUsers}</h1>
          </div>

          <div className="card-icon-box user-icon">
            <FaUsers />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCards;
