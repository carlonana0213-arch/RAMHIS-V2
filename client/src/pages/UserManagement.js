import { useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserStatus,
} from "../services/adminService";
import AlertModal from "../components/AlertModal";
import AddUser from "./adminModal/addUser";
import EditUser from "./adminModal/editUser";
import UserDashboard from "./analytics/userDashboard";
import "../styles/admin.css";
import ConfirmModal from "../components/ConfirmModal";

function UserManagement() {
  const [users, setUsers] = useState([]);
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : [];

      setUsers(list);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const status = String(user.verificationStatus || user.status || "")
        .toLowerCase()
        .trim();

      const role = String(user.role || user.account_type || "")
        .toLowerCase()
        .trim();

      const name = String(user.name || user.full_name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const query = search.toLowerCase();

      let matchesTab = false;

      if (tab === "pending") {
        matchesTab = status === "pending";
      } else if (tab === "active") {
        matchesTab = status === "approved" || status === "active";
      } else if (tab === "deactivated") {
        matchesTab = status === "deactivated";
      }

      const matchesFilter =
        filter === "All" || role === filter.toLowerCase();

      const matchesSearch = name.includes(query) || email.includes(query);

      return matchesTab && matchesFilter && matchesSearch;
    });
  }, [users, tab, filter, search]);

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

      <UserDashboard users={users} />

      <div className="topbar">
        <input
          className="search-input"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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

      <h2>{tab === "pending" ? "Pending Users" : "Active Users"}</h2>

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
          {filteredUsers.map((user) => {
            const role = String(user.role || "").toLowerCase();
            const createdDate = user.createdAt || user.created_at;

            return (
              <tr
                key={user._id}
                onClick={() => {
                  setSelectedUser(user);
                }}
              >
                <td>{user.name || user.full_name || "-"}</td>
                <td>{user.role || "-"}</td>
                <td>{user.verificationStatus || user.status || "-"}</td>

                <td>
                  {createdDate
                    ? new Date(createdDate).toLocaleDateString()
                    : "N/A"}
                </td>

                <td>
                  {role === "doctor" && user.doctorInfo?.proofOfLicense ? (
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
                  {role === "doctor" && user.doctorInfo?.proofOfDoctorate ? (
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
                            "Are you sure you want to reject this user?"
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

                  {tab === "active" && (
                    <button
                      className="deactivate-btn"
                      onClick={() => {
                        setConfirmMessage(
                          "Are you sure you want to deactivate this user?"
                        );

                        setConfirmAction(() => async () => {
                          await handleDeactivate(user._id);
                        });
                      }}
                    >
                      Deactivate
                    </button>
                  )}

                  {tab === "deactivated" && (
                    <button
                      className="reactivate-btn"
                      onClick={() => {
                        setConfirmMessage(
                          "Are you sure you want to reactivate this user?"
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
            );
          })}
        </tbody>
      </table>

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

      {selectedUser && (
        <EditUser
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={loadUsers}
        />
      )}

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