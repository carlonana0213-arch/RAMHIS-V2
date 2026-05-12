import { useMemo } from "react";
import "../../styles/admin.css";

import { FaUsers, FaUserCheck, FaUserClock, FaUserSlash } from "react-icons/fa";

function UserDashboard({ users = [] }) {
  const stats = useMemo(() => {
    let active = 0;
    let pending = 0;
    let deactivated = 0;

    users.forEach((u) => {
      if (u.verificationStatus === "Approved") active++;
      else if (u.verificationStatus === "Pending") pending++;
      else if (u.verificationStatus === "Deactivated") deactivated++;
    });

    return {
      total: users.length,
      active,
      pending,
      deactivated,
    };
  }, [users]);

  return (
    <div className="dashboard-cards">
      {/* TOTAL USERS */}
      <div className="dashboard-card">
        <div className="icon-box total">
          <FaUsers />
        </div>

        <div className="card-content">
          <h4>Total Users</h4>
          <p>{stats.total}</p>
        </div>
      </div>

      {/* ACTIVE USERS */}
      <div className="dashboard-card">
        <div className="icon-box approved">
          <FaUserCheck />
        </div>

        <div className="card-content">
          <h4>Active Users</h4>
          <p>{stats.active}</p>
        </div>
      </div>

      {/* PENDING USERS */}
      <div className="dashboard-card">
        <div className="icon-box pending">
          <FaUserClock />
        </div>

        <div className="card-content">
          <h4>Pending Users</h4>
          <p>{stats.pending}</p>
        </div>
      </div>

      {/* DEACTIVATED USERS */}
      <div className="dashboard-card">
        <div className="icon-box deactivated">
          <FaUserSlash />
        </div>

        <div className="card-content">
          <h4>Deactivated Users</h4>
          <p>{stats.deactivated}</p>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
