import { useState } from "react";
import { updateUser } from "../../services/adminService";
import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";
import { API_BASE_URL } from "../../services/apiConfig";
function EditUser({ user, onClose, onSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(user);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };
  const [alertMessage, setAlertMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const handleDoctorChange = (field, value) => {
    setForm({
      ...form,
      doctorInfo: {
        ...form.doctorInfo,
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    try {
      await updateUser({
        _id: form._id,
        name: form.name,
        email: form.email,
        role: form.role,
        age: form.age,
        birthday: form.birthday,
        verificationStatus: form.verificationStatus,
        volunteerType: form.volunteerType,
        doctorInfo: form.doctorInfo,
      });

      setAlertMessage("User updated successfully");
      setIsEditing(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      setAlertMessage("Update failed");
    }
  };

  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async () => {
    try {
      setResetLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/admin/reset-password/${form._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setAlertMessage(`✅ Reset link sent to ${form.email}`);
    } catch (err) {
      console.error(err);

      setAlertMessage("❌ Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      {" "}
      <div className="modal">
        {" "}
        <h3>Edit User</h3>
        <input
          value={form.name || ""}
          disabled={!isEditing}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <input
          value={form.email || ""}
          disabled={!isEditing}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        <select
          disabled={!isEditing}
          value={form.role || ""}
          onChange={(e) => handleChange("role", e.target.value)}
        >
          <option value="Doctor">Doctor</option>
          <option value="Volunteer">Volunteer</option>
          <option value="Pharmacist">Pharmacist</option>
          <option value="Admin">Admin</option>
        </select>
        <input
          placeholder="Age"
          value={form.age || ""}
          disabled={!isEditing}
          onChange={(e) => handleChange("age", e.target.value)}
        />
        <input
          placeholder="Birthday"
          value={form.birthday || ""}
          disabled={!isEditing}
          onChange={(e) => handleChange("birthday", e.target.value)}
        />
        {/* Volunteer */}
        {form.role === "Volunteer" && (
          <input
            placeholder="Volunteer Type"
            value={form.volunteerType || ""}
            disabled={!isEditing}
            onChange={(e) => handleChange("volunteerType", e.target.value)}
          />
        )}
        {/* Doctor */}
        {form.role === "Doctor" && (
          <>
            <input
              placeholder="Specialization"
              value={form.doctorInfo?.specialization || ""}
              disabled={!isEditing}
              onChange={(e) =>
                handleDoctorChange("specialization", e.target.value)
              }
            />

            <input
              placeholder="License Number"
              value={form.doctorInfo?.licenseNumber || ""}
              disabled={!isEditing}
              onChange={(e) =>
                handleDoctorChange("licenseNumber", e.target.value)
              }
            />
          </>
        )}
        <div className="modal-actions">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)}>Edit</button>
          ) : (
            <button onClick={() => setShowConfirm(true)}>Save</button>
          )}

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetLoading}
          >
            {resetLoading ? "Sending..." : "Reset Password"}
          </button>

          <button onClick={onClose}>Close</button>
        </div>
      </div>
      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to save changes to this user?"
          onConfirm={async () => {
            setShowConfirm(false);
            await handleSave();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showResetConfirm && (
        <ConfirmModal
          message="Are you sure you want to send a password reset link to this user?"
          onConfirm={async () => {
            setShowResetConfirm(false);
            await handleResetPassword();
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => {
            setAlertMessage("");
            setIsEditing(false);
            onSuccess();
          }}
        />
      )}
    </div>
  );
}

export default EditUser;
