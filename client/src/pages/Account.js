import { useEffect, useState } from "react";
import { updateUser } from "../services/patientService";
import "../styles/account.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ConfirmModal from "../components/ConfirmModal";

function Account() {
  const [formData, setFormData] = useState(null);

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = await res.json();

        setFormData({
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          age: user.age || "",
          birthday: user.birthday ? user.birthday.split("T")[0] : "",
        });
      } catch (err) {
        console.error("Failed to load account:", err);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.location.href = "/";
  };

  if (!formData) return <p className="account-loading">Loading account...</p>;

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData({
      ...passwordData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        age: formData.age,
        birthday: formData.birthday,
      };

      Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] === "") {
          delete dataToSend[key];
        }
      });

      const updated = await updateUser(dataToSend);

      localStorage.setItem("user", JSON.stringify(updated));

      alert("Account updated successfully");
    } catch (err) {
      console.error("Account update error:", err);
    }
  };

  const handlePasswordSave = async () => {
    try {
      if (!passwordData.password || !passwordData.confirmPassword) {
        alert("Please fill in both password fields.");
        return;
      }

      if (passwordData.password !== passwordData.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      await updateUser({
        password: passwordData.password,
      });

      setPasswordData({
        password: "",
        confirmPassword: "",
      });

      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowPasswordModal(false);

      alert("Password updated successfully");
    } catch (err) {
      console.error("Password update error:", err);
    }
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1>Profile & Account</h1>
        <p>View your personal information and account details</p>
      </div>

      <div className="account-layout">
        {/* LEFT COLUMN */}
        <div className="account-left-column">
          <div className="account-card account-profile-card">
            <div className="account-avatar">
              {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
            </div>

            <h2>{formData.name || "User"}</h2>
            <p>{formData.role || "User"}</p>
          </div>

          <div className="account-card password-reset-card">
            <h3>Password Reset</h3>

            <button
              type="button"
              className="change-password-btn"
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="account-right-column">
          <div className="account-card account-info-card">
            <h3>Personal Information</h3>

            <div className="info-list">
              <div className="info-row">
                <span>Name</span>

                <input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>

              <div className="info-row">
                <span>Email Address</span>

                <input
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>

              <div className="info-row">
                <span>Role</span>

                <input value={formData.role} disabled />
              </div>
            </div>
          </div>

          <div className="account-card account-info-card">
            <h3>Account Details</h3>

            <div className="info-list">
              <div className="info-row">
                <span>Age</span>

                <input
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                />
              </div>

              <div className="info-row">
                <span>Birthday</span>

                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => handleChange("birthday", e.target.value)}
                />
              </div>

              <div className="account-note">
                <strong>Account managed by administrator</strong>

                <p>
                  Your account details are managed by the system administrator.
                  Update only the necessary information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="account-footer">
        <div className="left-actions">
          <button
            className="save-btn"
            onClick={() => {
              setConfirmState({
                message: "Are you sure you want to save these changes?",
                onConfirm: () => {
                  handleSave();
                  setConfirmState(null);
                },
              });
            }}
          >
            Save Changes
          </button>

          <button className="cancel-btn">Cancel</button>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            setConfirmState({
              message: "Are you sure you want to log out?",
              onConfirm: () => {
                handleLogout();
                setConfirmState(null);
              },
            });
          }}
        >
          Logout
        </button>
      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <h2>Change Password</h2>

            <p>
              Enter your new password below. Make sure both password fields
              match before saving.
            </p>

            <div className="password-modal-field">
              <label>New Password</label>

              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.password}
                  onChange={(e) =>
                    handlePasswordChange("password", e.target.value)
                  }
                />

                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="password-modal-field">
              <label>Confirm Password</label>

              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    handlePasswordChange("confirmPassword", e.target.value)
                  }
                />

                <span
                  className="eye-icon"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="password-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setPasswordData({
                    password: "",
                    confirmPassword: "",
                  });

                  setShowPasswordModal(false);
                }}
              >
                Cancel
              </button>

              <button className="save-btn" onClick={handlePasswordSave}>
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}

export default Account;