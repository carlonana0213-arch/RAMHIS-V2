import { FaUserInjured, FaUsers, FaCapsules } from "react-icons/fa";

function DashboardCards({ summary }) {
  const patientDiff = summary.patientIncrease || 0;

  const userDiff = summary.userIncrease || 0;
  return (
    <div className="dashboard-cards">
      {/* PATIENTS */}
      <div className="summary-card">
        <div className="summary-card-top">
          <div>
            <h3>Total Patients</h3>

            <h1>{summary.totalPatients}</h1>

            <p
              className={`summary-subtext ${
                patientDiff >= 0 ? "positive" : "negative"
              }`}
            >
              +{summary.currentPatients || 0} patients added this month
            </p>
          </div>

          <div className="card-icon-box patient-icon">
            <FaUserInjured />
          </div>
        </div>
      </div>

      {/* USERS */}
      <div className="summary-card">
        <div className="summary-card-top">
          <div>
            <h3>Total Volunteers</h3>

            <h1>{summary.totalUsers}</h1>

            <p
              className={`summary-subtext ${
                userDiff >= 0 ? "positive" : "negative"
              }`}
            >
              {userDiff >= 0 ? "+" : ""}
              {userDiff} compared to previous month
            </p>
          </div>

          <div className="card-icon-box user-icon">
            <FaUsers />
          </div>
        </div>
      </div>

      {/* MEDICINES */}
      <div className="summary-card">
        <div className="summary-card-top">
          <div>
            <h3>Total Medicines</h3>

            <h1>{summary.totalMedicines}</h1>

            <div className="medicine-summary-row">
              <span className="low-stock-text">
                Low Stock: {summary.lowStock}
              </span>

              <span className="out-stock-text">
                Out of Stock: {summary.outOfStock}
              </span>
            </div>
          </div>

          <div className="card-icon-box medicine-icon">
            <FaCapsules />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCards;
