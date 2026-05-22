import { useState } from "react";
import { registerUser } from "../../services/authService";
import "../../styles/admin.css";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";

function AddUser({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
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
    try {
      setError("");

      const dataToSend = {
        name: form.name,
        email: form.email,

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

      onSuccess();
      onClose();
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
              <label>Full Name</label>

              <input
                name="name"
                placeholder="Enter full name"
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
            setAlertMessage("");
            onSuccess();
            onClose();
          }}
        />
      )}
    </>
  );
}

export default AddUser;