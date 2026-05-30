import { apiFetch } from "./api";

import { API_BASE_URL } from "./apiConfig";
import db from "./localDB";
const API = `${API_BASE_URL}/api/patients`;
const isOffline = () => !navigator.onLine;
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

export const addPatient = async (data) => {
  // offline
  if (isOffline()) {
    const offlinePatient = {
      ...data,

      _id: `offline-${Date.now()}`,

      pendingSync: true,
    };

    await db.patients.add(offlinePatient);

    await db.syncQueue.add({
      type: "ADD_PATIENT",
      payload: data,
    });

    return offlinePatient;
  }

  const patient = await apiFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return patient;
};

export const searchPatients = async (name, birthdate) => {
  // offline
  // offline
  if (isOffline()) {
    const patients = await db.patients.toArray();

    return patients.filter((p) => {
      const patientName = p.generalInfo?.name?.toLowerCase()?.trim() || "";

      const searchName = name?.toLowerCase()?.trim() || "";

      const patientBirthdate = p.generalInfo?.birthdate || "";

      const matchesName = patientName === searchName;

      const matchesBirthdate = birthdate && patientBirthdate === birthdate;

      return matchesName && (!birthdate || matchesBirthdate);
    });
  }

  const params = new URLSearchParams({
    name,
  });

  if (birthdate) {
    params.append("birthdate", birthdate);
  }

  return apiFetch(`${API}/search?${params.toString()}`);
};

export const updatePatient = async (id, data) => {
  // offline
  if (isOffline()) {
    const patient = await db.patients.get(id);

    if (patient) {
      await db.patients.put({
        ...patient,
        ...data,
        pendingSync: true,
      });
    }

    await db.syncQueue.add({
      type: "UPDATE_PATIENT",
      patientId: id,
      payload: data,
    });

    return;
  }

  return apiFetch(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deletePatient = (id) =>
  apiFetch(`${API}/${id}`, {
    method: "DELETE",
  });

export const getPatientQueue = async () => {
  try {
    // offline
    if (isOffline()) {
      return await db.patients.toArray();
    }

    // online
    const data = await apiFetch(`${API}/queue`);

    await db.patients.clear();

    await db.patients.bulkPut(data);

    return data;
  } catch (err) {
    console.error("Queue fetch failed, using cache", err);

    return await db.patients.toArray();
  }
};

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

export const getPatientById = async (id) => {
  // offline
  if (isOffline()) {
    return await db.patients.get(id);
  }

  return apiFetch(`${API}/${id}`);
};
