import { useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  approveUser,
  rejectUser,
  updateUser,
  updateUserStatus,
} from "../services/adminService";
import { registerUser } from "../services/authService";
import AddUser from "./adminModal/addUser";
import UserDashboard from "./analytics/userDashboard";
import "../styles/admin.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("pending");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Doctor",
    specialization: "",
    licenseNumber: "",
  });

  // 🔹 LOAD USERS
  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 🔹 FILTER + SEARCH + TAB (FIXED)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // TAB FILTER
      let matchesTab = false;

      if (tab === "pending") {
        matchesTab = user.verificationStatus === "Pending";
      } else if (tab === "active") {
        matchesTab = user.verificationStatus === "Approved";
      } else if (tab === "deactivated") {
        matchesTab = user.verificationStatus === "Deactivated";
      }

      // ROLE FILTER
      const matchesFilter = filter === "All" || user.role === filter;

      // SEARCH
      const matchesSearch =
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesFilter && matchesSearch;
    });
  }, [users, tab, filter, search]);

  // 🔹 CREATE USER
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

      await registerUser(payload);

      alert("User created successfully");
      setShowCreateModal(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    }
  };

  // 🔹 APPROVE
  const handleApproveClick = (id) => {
    setSelectedUserId(id);
    setShowModal(true);
  };

  const confirmApprove = async () => {
    try {
      await approveUser(selectedUserId, adminPassword);
      setShowModal(false);
      setAdminPassword("");
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Approval failed");
    }
  };

  // 🔹 REJECT
  const handleReject = async (id) => {
    await rejectUser(id);
    loadUsers();
  };

  // 🔹 UPDATE USER
  const handleUpdateUser = async () => {
    try {
      await updateUser(editUser);
      alert("User updated");
      setIsEditing(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  // 🔹 DEACTIVATE
  const handleDeactivate = async (id) => {
    try {
      await updateUserStatus(id, "Deactivated");
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate user");
    }
  };

  const handleReactivate = async (id) => {
    try {
      await updateUserStatus(id, "Approved");
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate user");
    }
  };

  return (
    <div className="admin-container">
      <UserDashboard users={users} />
      {/* TOP BAR */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={() => setShowCreateModal(true)}>+ Add User </button>

        <input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Doctor">Doctor</option>
          <option value="Volunteer">Volunteer</option>
        </select>
      </div>

      {/* TABS */}
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
        <button
          className={tab === "deactivated" ? "active" : ""}
          onClick={() => setTab("deactivated")}
        >
          Deactivated
        </button>
      </div>

      <h2>{tab === "pending" ? "Pending Users" : "Active Users"}</h2>

      {/* TABLE */}
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
              onClick={() => {
                setSelectedUser(user);
                setEditUser(user);
                setIsEditing(false);
              }}
            >
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>{user.verificationStatus}</td>

              <td onClick={(e) => e.stopPropagation()}>
                {/* PENDING */}
                {tab === "pending" && (
                  <>
                    <button onClick={() => handleApproveClick(user._id)}>
                      Approve
                    </button>
                    <button onClick={() => handleReject(user._id)}>
                      Reject
                    </button>
                  </>
                )}

                {/* ACTIVE */}
                {tab === "active" && (
                  <button onClick={() => handleDeactivate(user._id)}>
                    Deactivate
                  </button>
                )}

                {/* DEACTIVATED */}
                {tab === "deactivated" && (
                  <button onClick={() => handleReactivate(user._id)}>
                    Reactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* EDIT MODAL */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>User Details</h3>

            <input
              value={editUser?.name || ""}
              disabled={!isEditing}
              onChange={(e) =>
                setEditUser({ ...editUser, name: e.target.value })
              }
            />

            <input
              value={editUser?.email || ""}
              disabled={!isEditing}
              onChange={(e) =>
                setEditUser({ ...editUser, email: e.target.value })
              }
            />

            <div className="modal-actions">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)}>Edit</button>
              ) : (
                <button onClick={handleUpdateUser}>Save Changes</button>
              )}

              <button onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Admin Password</h3>

            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />

            <button onClick={confirmApprove}>Confirm</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <AddUser
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadUsers}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
