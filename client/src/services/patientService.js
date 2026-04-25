import { apiFetch } from "./api";

const API = "http://localhost:5000/api/patients";

export const getPatients = async () => {
  return apiFetch(API);
};

export const addPatient = (data) =>
  apiFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const searchPatients = async (name) => {
  return apiFetch(`${API}?name=${name}`);
};

export const updatePatient = (id, data) =>
  apiFetch(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePatient = (id) =>
  apiFetch(`${API}/${id}`, {
    method: "DELETE",
  });

export const getPatientQueue = () => apiFetch(`${API}/queue`);

export const updateUser = async (data) => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/auth/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update user");
  }

  return res.json();
};

export const getPatientById = (id) => apiFetch(`${API}/${id}`);
