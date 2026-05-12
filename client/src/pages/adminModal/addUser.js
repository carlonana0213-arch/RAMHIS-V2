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
    <div className="modal-overlay">
      {" "}
      <div className="modal">
        {" "}
        <h3>Create User</h3>
        {error && <p className="error">{error}</p>}
        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="Doctor">Doctor</option>
          <option value="Volunteer">Volunteer</option>
        </select>
        {/* VOLUNTEER */}
        {form.role === "Volunteer" && (
          <input
            name="volunteerType"
            placeholder="Volunteer Type"
            onChange={handleChange}
          />
        )}
        {/* DOCTOR */}
        {form.role === "Doctor" && (
          <>
            <input
              name="specialization"
              placeholder="Specialization"
              onChange={handleChange}
            />

            <input
              name="licenseNumber"
              placeholder="License Number"
              onChange={handleChange}
            />

            <input
              name="proofOfLicense"
              placeholder="Proof of License (link)"
              onChange={handleChange}
            />

            <input
              name="proofOfDoctorate"
              placeholder="Proof of Doctorate (link)"
              onChange={handleChange}
            />
          </>
        )}
        <div className="modal-actions">
          <button className="createbtn" onClick={() => setShowConfirm(true)}>
            Create
          </button>
          <button onClick={onClose}>Cancel</button>
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
    </div>
  );
}

export default AddUser;
