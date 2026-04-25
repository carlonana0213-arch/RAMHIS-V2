import { useEffect, useState } from "react";
import {
  getAllUsers,
  approveUser,
  rejectUser,
  updateUser,
} from "../services/adminService";

import "../styles/admin.css";
import { registerUser } from "../services/authService";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("All");

  const [tab, setTab] = useState("pending");
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Doctor",
    specialization: "",
    licenseNumber: "",
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const loadUsers = async () => {
    try {
      const data = await getAllUsers();

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("Unexpected response:", data);
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  const handleCreateUser = async () => {
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      };

      if (newUser.role === "Doctor") {
        payload.doctorInfo = {
          specialization: newUser.specialization,
          licenseNumber: newUser.licenseNumber,
        };
      }

      const res = await registerUser(payload);

      alert("User created successfully");

      setShowCreateModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "Doctor",
        specialization: "",
        licenseNumber: "",
      });

      loadUsers(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 🔐 OPEN MODAL INSTEAD OF DIRECT APPROVE
  const handleApproveClick = (id) => {
    setSelectedUserId(id);
    setShowModal(true);
  };

  const confirmApprove = async () => {
    if (!adminPassword) {
      alert("Please enter admin password");
      return;
    }

    try {
      await approveUser(selectedUserId, adminPassword); // pass password if backend supports
      setShowModal(false);
      setAdminPassword("");
      setSelectedUserId(null);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Approval failed");
    }
  };
  const handleUpdateUser = async () => {
    try {
      await updateUser(editUser);

      alert("User updated");

      setSelectedUser(null);
      setIsEditing(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };
  const handleReject = async (id) => {
    await rejectUser(id);
    loadUsers();
  };

  const filteredUsers = users.filter((user) => {
    if (tab === "pending") {
      return user.verificationStatus === "Pending";
    }

    if (tab === "active") {
      return user.verificationStatus === "Approved";
    }

    return true;
  });

  return (
    <div className="admin-container">
      <button className="approve-btn" onClick={() => setShowCreateModal(true)}>
        + Add User
      </button>
      <div className="admin-tabs">
        <button
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          Active Users
        </button>

        <button
          className={tab === "pending" ? "active" : ""}
          onClick={() => setTab("pending")}
        >
          Pending
        </button>
      </div>
      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New User</h3>

            <input
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />

            <input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />

            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="Doctor">Doctor</option>
              <option value="Volunteer">Volunteer</option>
            </select>

            {newUser.role === "Doctor" && (
              <>
                <input
                  placeholder="Specialization"
                  value={newUser.specialization}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      specialization: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="License Number"
                  value={newUser.licenseNumber}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      licenseNumber: e.target.value,
                    })
                  }
                />
              </>
            )}

            <div className="modal-actions">
              <button onClick={handleCreateUser} className="approve-btn">
                Create
              </button>

              <button
                onClick={() => setShowCreateModal(false)}
                className="reject-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>{tab === "pending" ? "Pending User Approvals" : "Active Users"}</h2>

      <div className="admin-filter">
        <label>Filter:</label>

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Doctor">Doctor</option>
          <option value="Volunteer">Volunteer</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <p>No pending users</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user._id}
                className="clickable-row"
                onClick={() => {
                  setSelectedUser(user);
                  setEditUser(user);
                  setIsEditing(false);
                }}
              >
                <td>{user.name}</td>
                <td>{user.role}</td>

                <td>
                  <span className="status pending">
                    {user.verificationStatus}
                  </span>
                </td>

                <td onClick={(e) => e.stopPropagation()}>
                  {tab === "pending" && (
                    <>
                      <button
                        className="approve-btn"
                        onClick={() => handleApproveClick(user._id)}
                      >
                        Approve
                      </button>

                      <button
                        className="reject-btn"
                        onClick={() => handleReject(user._id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>User Details</h3>

            <label>Name</label>
            <input
              value={editUser?.name || ""}
              disabled={!isEditing}
              onChange={(e) =>
                setEditUser({ ...editUser, name: e.target.value })
              }
            />

            <label>Email</label>
            <input
              value={editUser?.email || ""}
              disabled={!isEditing}
              onChange={(e) =>
                setEditUser({ ...editUser, email: e.target.value })
              }
            />

            <label>Role</label>
            <select
              value={editUser?.role || ""}
              disabled={!isEditing}
              onChange={(e) =>
                setEditUser({ ...editUser, role: e.target.value })
              }
            >
              <option value="Doctor">Doctor</option>
              <option value="Volunteer">Volunteer</option>
            </select>

            {editUser?.role === "Doctor" && (
              <>
                <label>Specialization</label>
                <input
                  value={editUser?.doctorInfo?.specialization || ""}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setEditUser({
                      ...editUser,
                      doctorInfo: {
                        ...editUser.doctorInfo,
                        specialization: e.target.value,
                      },
                    })
                  }
                />

                <label>License Number</label>
                <input
                  value={editUser?.doctorInfo?.licenseNumber || ""}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setEditUser({
                      ...editUser,
                      doctorInfo: {
                        ...editUser.doctorInfo,
                        licenseNumber: e.target.value,
                      },
                    })
                  }
                />
              </>
            )}

            <div className="modal-actions">
              {!isEditing ? (
                <button
                  className="approve-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              ) : (
                <button
                  className="approve-btn"
                  onClick={() => handleUpdateUser()}
                >
                  Save Changes
                </button>
              )}

              <button
                className="reject-btn"
                onClick={() => handleReject(selectedUser._id)}
              >
                Reject
              </button>

              <button onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL PASSWORD MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Approval</h3>
            <p>Enter admin password to approve this user:</p>

            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin Password"
            />

            <div className="modal-actions">
              <button onClick={confirmApprove} className="approve-btn">
                Confirm
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setAdminPassword("");
                }}
                className="reject-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
