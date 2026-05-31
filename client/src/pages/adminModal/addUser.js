import { useState } from "react";
import { registerUser } from "../../services/authService";
import "../../styles/admin.css";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";

function AddUser({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthday: "",

    email: "",
    password: "",

    role: "Doctor",
    volunteerType: "",

    specialization: "",
    licenseNumber: "",

    proofOfLicense: "",
    proofOfDoctorate: "",
  });

  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const firstName = form.firstName?.trim();
    const lastName = form.lastName?.trim();

    const email = form.email?.trim();
    const birthday = form.birthday?.trim();

    /* ---------- GENERAL REQUIRED ---------- */

    if (!firstName) {
      setAlertMessage("First name is required");
      return;
    }

    if (!lastName) {
      setAlertMessage("Last name is required");
      return;
    }

    if (!birthday) {
      setAlertMessage("Birthday is required");
      return;
    }

    if (!email) {
      setAlertMessage("Email address is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setAlertMessage("Please enter a valid email address");
      return;
    }

    /* ---------- DOCTOR REQUIRED ---------- */

    if (form.role === "Doctor") {
      if (!form.specialization?.trim()) {
        setAlertMessage("Specialization is required for doctors");
        return;
      }

      if (!form.licenseNumber?.trim()) {
        setAlertMessage("License number is required for doctors");
        return;
      }

      if (!form.proofOfLicense?.trim()) {
        setAlertMessage("Proof of license is required for doctors");
        return;
      }

      if (!form.proofOfDoctorate?.trim()) {
        setAlertMessage("Proof of doctorate is required for doctors");
        return;
      }
    }
    try {
      setError("");

      const fullName = [
        form.firstName?.trim(),
        form.middleName?.trim(),
        form.lastName?.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const dataToSend = {
        name: fullName,
        email: form.email,
        birthdate: form.birthday,

        role: form.role,
      };

      if (form.role === "Volunteer") {
        dataToSend.volunteerType = form.volunteerType;
      }

      if (form.role === "Doctor") {
        dataToSend.doctorInfo = {
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          proofOfLicense: form.proofOfLicense,
          proofOfDoctorate: form.proofOfDoctorate,
        };
      }

      await registerUser(dataToSend);

      setAlertMessage("User created successfully");
    } catch (err) {
      console.error(err);
      setAlertMessage("User Creation Error");
    }
  };

  return (
    <>
      <div className="medicine-modal-overlay">
        <div className="medicine-modal">
          <h3>Create User</h3>

          {error && <p className="error">{error}</p>}

          <div className="medicine-form-grid">
            <div className="form-group">
              <label>First Name *</label>

              <input
                name="firstName"
                value={form.firstName}
                placeholder="Enter first name"
                onChange={handleChange}
              />
            </div>

            {/* Middle Name */}
            <div className="form-group">
              <label>Middle Name</label>

              <input
                name="middleName"
                value={form.middleName}
                placeholder="Optional"
                onChange={handleChange}
              />
            </div>

            {/* Last Name */}
            <div className="form-group full-width">
              <label>Last Name *</label>

              <input
                name="lastName"
                value={form.lastName}
                placeholder="Enter last name"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>

              <input
                name="email"
                placeholder="Enter email"
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Birthday *</label>

              <input
                type="date"
                name="birthday"
                value={form.birthday}
                max={new Date().toISOString().split("T")[0]}
                onChange={handleChange}
              />
            </div>
            <div className="form-group full-width">
              <label>Role</label>

              <select name="role" value={form.role} onChange={handleChange}>
                <option value="Doctor">Doctor</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>

            {/* VOLUNTEER */}
            {form.role === "Volunteer" && (
              <div className="form-group full-width">
                <label>Volunteer Type</label>

                <input
                  name="volunteerType"
                  placeholder="Enter volunteer type"
                  onChange={handleChange}
                />
              </div>
            )}

            {/* DOCTOR */}
            {form.role === "Doctor" && (
              <>
                <div className="form-group">
                  <label>Specialization</label>

                  <input
                    name="specialization"
                    placeholder="Enter specialization"
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>License Number</label>

                  <input
                    name="licenseNumber"
                    placeholder="Enter license number"
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Proof of License</label>

                  <input
                    name="proofOfLicense"
                    placeholder="Paste proof link"
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Proof of Doctorate</label>

                  <input
                    name="proofOfDoctorate"
                    placeholder="Paste proof link"
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>

            <button className="save-btn" onClick={() => setShowConfirm(true)}>
              Create User
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to create this user?"
          onConfirm={async () => {
            setShowConfirm(false);
            await handleSubmit();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => {
            const isSuccess = alertMessage === "User created successfully";

            setAlertMessage("");

            if (isSuccess) {
              onSuccess();
              onClose();
            }
          }}
        />
      )}
    </>
  );
}

export default AddUser;
