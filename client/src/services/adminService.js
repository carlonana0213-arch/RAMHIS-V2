import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/admin`;
export const getAllUsers = async () => {
  const res = await fetch(`${API}/users`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};

export const approveUser = async (id) => {
  const res = await fetch(`${API}/approve/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};

export const rejectUser = async (id) => {
  const res = await fetch(`${API}/reject/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  return res.json();
};

export const updateUser = async (data) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/users/${data._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await res.json(); // 👈 get backend response

  if (!res.ok) {
    console.error("Backend error:", result);
    throw new Error(result.message || "Failed to update user");
  }

  return result;
};

export const updateUserStatus = (id, status) =>
  fetch(`${API}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      verificationStatus: status,
    }),
  });
