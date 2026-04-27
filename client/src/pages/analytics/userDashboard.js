import { useMemo } from "react";
import "../../styles/admin.css";

function UserDashboard({ users }) {
  const stats = useMemo(() => {
    let active = 0;
    let pending = 0;
    let deactivated = 0;

    users.forEach((u) => {
      if (u.verificationStatus === "Approved") active++;
      else if (u.verificationStatus === "Pending") pending++;
      else if (u.verificationStatus === "Deactivated") deactivated++;
    });

    return { active, pending, deactivated };
  }, [users]);

  return (
    <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
      {" "}
      <div style={cardStyle}>
        {" "}
        <h4>Active Users</h4> <p>{stats.active}</p>{" "}
      </div>
      <div style={cardStyle}>
        <h4>Pending Users</h4>
        <p>{stats.pending}</p>
      </div>
      <div style={cardStyle}>
        <h4>Deactivated Users</h4>
        <p>{stats.deactivated}</p>
      </div>
    </div>
  );
}

const cardStyle = {
  flex: 1,
  background: "#fff",
  padding: "15px",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  textAlign: "center",
};

export default UserDashboard;
