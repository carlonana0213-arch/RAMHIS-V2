import { useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  approveUser,
  rejectUser,
  updateUser,
  updateUserStatus,
} from "../services/adminService";
import { registerUser } from "../services/authService";
import AlertModal from "../components/AlertModal";
import AddUser from "./adminModal/addUser";
import EditUser from "./adminModal/editUser";
import UserDashboard from "./analytics/userDashboard";
import "../styles/admin.css";
import ConfirmModal from "../components/ConfirmModal";
import CardsSkeleton from "../components/loading/cardSkeleton";
import TableSkeleton from "../components/loading/tableSkeleton";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [alertMessage, setAlertMessage] = useState("");

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
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

  const loadUsers = async () => {
    try {
      setLoading(true);

      const data = await getAllUsers();

      setUsers(
        Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
      );
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      let matchesTab = false;

      // PENDING
      if (tab === "pending") {
        matchesTab =
          user.verificationStatus === "Pending" || user.status === "pending";
      }

      // ACTIVE
      else if (tab === "active") {
        matchesTab =
          user.verificationStatus === "Approved" || user.status === "active";
      }

      // DEACTIVATED
      else if (tab === "deactivated") {
        matchesTab =
          user.verificationStatus === "Deactivated" ||
          user.verificationStatus === "Rejected" ||
          user.status === "deactivated";
      }

      const matchesFilter = filter === "All" || user.role === filter;

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
      alert(err.message || "Failed to create user");
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
      setAlertMessage("User approved successfully");
      loadUsers();
    } catch (err) {
      console.error(err);
      setAlertMessage("Approval failed");
    }
  };

  // 🔹 REJECT
  const handleReject = async (id) => {
    try {
      await rejectUser(id);

      setAlertMessage("User rejected successfully");

      loadUsers();
    } catch (err) {
      console.error(err);

      setAlertMessage("Failed to reject user");
    }
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

      setAlertMessage("User deactivated successfully");

      loadUsers();
    } catch (err) {
      console.error(err);

      setAlertMessage("Failed to deactivate user");
    }
  };

  const handleReactivate = async (id) => {
    try {
      await updateUserStatus(id, "Approved");

      setAlertMessage("User reactivated successfully");

      loadUsers();
    } catch (err) {
      console.error(err);

      setAlertMessage("Failed to reactivate user");
    }
  };

  return (
    <div className="admin-container">
      <div className="users-header">
        <h2>Account Management</h2>
      </div>
      {loading ? <CardsSkeleton /> : <UserDashboard users={users} />}

      {/* TOP BAR */}
      <div className="topbar">
        <input
          className="search-input"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* STATUS */}
        <div className="filter-group">
          <button
            className={tab === "active" ? "active" : ""}
            onClick={() => setTab("active")}
          >
            Active
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

        {/* ROLE */}
        <div className="filter-group">
          <button
            className={filter === "All" ? "active" : ""}
            onClick={() => setFilter("All")}
          >
            All
          </button>
          <button
            className={filter === "Doctor" ? "active" : ""}
            onClick={() => setFilter("Doctor")}
          >
            Doctors
          </button>
          <button
            className={filter === "Volunteer" ? "active" : ""}
            onClick={() => setFilter("Volunteer")}
          >
            Volunteers
          </button>
        </div>

        <button
          className="add-user-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Add User
        </button>
      </div>

      <h2>
        {tab === "pending"
          ? "Pending Users"
          : tab === "deactivated"
            ? "Deactivated Users"
            : "Active Users"}
      </h2>

      {/* TABLE */}
      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date Added</th>
              <th>License Proof</th>
              <th>Doctorate Proof</th>
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
                <td>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  {user.role === "Doctor" && user.doctorInfo?.proofOfLicense ? (
                    <a
                      href={user.doctorInfo.proofOfLicense}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {user.role === "Doctor" &&
                  user.doctorInfo?.proofOfDoctorate ? (
                    <a
                      href={user.doctorInfo.proofOfDoctorate}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td onClick={(e) => e.stopPropagation()}>
                  {/* PENDING */}
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
                        onClick={() => {
                          setConfirmMessage(
                            "Are you sure you want to reject this user?",
                          );

                          setConfirmAction(() => async () => {
                            await handleReject(user._id);
                          });
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* ACTIVE */}
                  {tab === "active" && (
                    <button
                      className="deactivate-btn"
                      onClick={() => {
                        setConfirmMessage(
                          "Are you sure you want to deactivate this user?",
                        );

                        setConfirmAction(() => async () => {
                          await handleDeactivate(user._id);
                        });
                      }}
                    >
                      Deactivate
                    </button>
                  )}

                  {/* DEACTIVATED */}
                  {tab === "deactivated" && (
                    <button
                      className="reactivate-btn"
                      onClick={() => {
                        setConfirmMessage(
                          "Are you sure you want to reactivate this user?",
                        );

                        setConfirmAction(() => async () => {
                          await handleReactivate(user._id);
                        });
                      }}
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {confirmAction && (
        <ConfirmModal
          message={confirmMessage}
          onConfirm={async () => {
            await confirmAction();

            setConfirmAction(null);
            setConfirmMessage("");
          }}
          onCancel={() => {
            setConfirmAction(null);
            setConfirmMessage("");
          }}
        />
      )}
      {/* EDIT MODAL */}
      {selectedUser && (
        <EditUser
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={loadUsers}
        />
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
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage("")}
        />
      )}
    </div>
  );
}

export default UserManagement;
