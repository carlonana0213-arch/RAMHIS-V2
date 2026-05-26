import { apiFetch } from "./api";

import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/patients`;

export const getPatients = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(API, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch patients");

    return await res.json();
  } catch (error) {
    console.error("Error fetching patients:", error);
    return [];
  }
};

export const addPatient = (data) =>
  apiFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const searchPatients = async (name, birthdate) => {
  const params = new URLSearchParams({
    name,
  });

  if (birthdate) {
    params.append("birthdate", birthdate);
  }

  return apiFetch(`${API}/search?${params.toString()}`);
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

  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
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
