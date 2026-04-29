import { useState } from "react";
import { updateUser } from "../../services/adminService";

function EditUser({ user, onClose, onSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(user);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

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

      alert("User updated");
      setIsEditing(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/reset-password/${form._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();

      alert("Temporary password reset and emailed to user");
    } catch (err) {
      console.error(err);
      alert("Failed to reset password");
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
            <button onClick={handleSave}>Save</button>
          )}

          <button onClick={handleResetPassword}>Reset Password</button>

          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
