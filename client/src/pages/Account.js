import { useEffect, useState } from "react";
import { updateUser } from "../services/patientService";
import "../styles/account.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Account() {
  const [formData, setFormData] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          password: "",
          confirmPassword: "",
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

  if (!formData) return <p>Loading account...</p>;

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      const dataToSend = { ...formData };

      Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] === "") {
          delete dataToSend[key];
        }
      });

      if (
        dataToSend.password &&
        dataToSend.password !== dataToSend.confirmPassword
      ) {
        alert("Passwords do not match");
        return;
      }

      delete dataToSend.confirmPassword;

      const updated = await updateUser(dataToSend);

      localStorage.setItem("user", JSON.stringify(updated));

      alert("Account updated successfully");
    } catch (err) {
      console.error("Account update error:", err);
    }
  };

  return (
    <div className="account-container">
      <h2>Account Settings</h2>

      {/* PROFILE SECTION */}
      <div className="account-card profile-card">
        <div className="profile-left">
          <div className="avatar">
            {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>

        <div className="profile-actions">
          <button className="upload-btn">Upload</button>
          <button className="remove-btn">Remove</button>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="account-card form-card">
        <div className="form-grid">
          {/* NAME */}
          <div className="form-group">
            <label>Name</label>
            <input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label>Email</label>
            <input
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          {/* ROLE */}
          <div className="form-group">
            <label>Role</label>
            <input value={formData.role} disabled />
          </div>

          {/* AGE */}
          <div className="form-group">
            <label>Age</label>
            <input
              value={formData.age}
              onChange={(e) => handleChange("age", e.target.value)}
            />
          </div>

          {/* BIRTHDAY */}
          <div className="form-group">
            <label>Birthday</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => handleChange("birthday", e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group full">
            <label>New Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />

              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="form-group full">
            <label>Confirm Password</label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
              />

              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="account-footer">
        <div className="left-actions">
          <button onClick={handleSave}>Save Changes</button>
          <button className="cancel-btn">Cancel</button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Account;
