import { apiFetch } from "./api";

import { API_BASE_URL } from "./apiConfig";
import db from "./localDB";

const API = `${API_BASE_URL}/api/patients`;

const isOffline = () => !navigator.onLine;

export const getPatients = async ({ all = false } = {}) => {
  try {
    const token = localStorage.getItem("token");

    const query = all ? "?all=true" : "";

    const res = await fetch(`${API}${query}`, {
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

    return {
      ...offlinePatient,
      offline: true,
    };
  }

  const patient = await apiFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return patient;
};

export const searchPatients = async (name, birthdate) => {
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

    return {
      offline: true,
    };
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

export const getPatientQueue = async ({
  page = 1,
  limit = 15,
  search = "",
  department = "All",
  all = false,
  currentMission = null,
} = {}) => {
  try {
    // OFFLINE MODE
    if (isOffline()) {
      let patients = await db.patients.toArray();

      // remove released
      patients = patients.filter((p) => p.status !== "released");

      // mission filter (offline)
      if (!all && currentMission?._id) {
        patients = patients.filter((p) => {
          return p.eventId === currentMission._id;
        });
      }

      // search
      if (search.trim()) {
        const searchLower = search.toLowerCase();

        patients = patients.filter((p) =>
          p.generalInfo?.name?.toLowerCase()?.includes(searchLower),
        );
      }

      // department filter
      if (department !== "All") {
        patients = patients.filter((p) => p.department === department);
      }

      // priority sort
      patients.sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;

        if (!a.isPriority && b.isPriority) return 1;

        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const total = patients.length;

      const startIndex = (page - 1) * limit;

      const paginated = patients.slice(startIndex, startIndex + limit);

      return {
        patients: paginated,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    }

    // ONLINE MODE
    const params = new URLSearchParams({
      page,
      limit,
      search,
      department,
    });

    if (all) {
      params.append("all", "true");
    }

    const data = await apiFetch(`${API}/queue?${params.toString()}`);

    // keep offline cache fresh
    syncOfflineQueue({ all: true });

    return data;
  } catch (err) {
    console.error("Queue fetch failed", err);

    // fallback cache if request fails
    const cachedPatients = await db.patients.toArray();

    return {
      patients: cachedPatients,
      total: cachedPatients.length,
      totalPages: 1,
      currentPage: 1,
    };
  }
};

export const syncOfflineQueue = async ({ all = false } = {}) => {
  try {
    if (isOffline()) return;

    const query = all ? "?all=true" : "";

    const fullQueue = await apiFetch(`${API}/queue-sync${query}`);

    await db.patients.clear();

    await db.patients.bulkPut(fullQueue);
  } catch (err) {
    console.error("Offline sync failed", err);
  }
};

export const getQueueSummary = async ({ all = false } = {}) => {
  try {
    // offline
    if (isOffline()) {
      const patients = await db.patients.toArray();

      const active = patients.filter((p) => p.status !== "released");

      return {
        Pediatrics: active.filter((p) => p.department === "Pediatrics").length,

        Ortho: active.filter((p) => p.department === "Ortho").length,

        Opta: active.filter((p) => p.department === "Opta").length,

        Dental: active.filter((p) => p.department === "Dental").length,

        Cardio: active.filter((p) => p.department === "Cardio").length,

        General: active.filter((p) => p.department === "General").length,
      };
    }

    const query = all ? "?all=true" : "";

    return apiFetch(`${API}/queue-summary${query}`);
  } catch (err) {
    console.error(err);

    return {
      Pediatrics: 0,
      Ortho: 0,
      Opta: 0,
      Dental: 0,
      Cardio: 0,
      General: 0,
    };
  }
};

export const getDoctorQueue = async ({
  page = 1,
  limit = 15,
  search = "",
  queueFilter = "all",
  department = "General",
  role = "doctor",
  all = false,
  currentMission = null,
} = {}) => {
  try {
    // OFFLINE MODE
    if (isOffline()) {
      let patients = await db.patients.toArray();

      // remove released
      patients = patients.filter((p) => p.status !== "released");

      // mission filter
      if (!all && currentMission?._id) {
        patients = patients.filter((p) => p.eventId === currentMission._id);
      }

      // department logic
      if (role !== "admin" && !search.trim()) {
        patients = patients.filter((p) => p.department === department);
      }

      // search
      if (search.trim()) {
        const searchLower = search.toLowerCase();

        patients = patients.filter((p) =>
          p.generalInfo?.name?.toLowerCase()?.includes(searchLower),
        );
      }

      // queue filters
      // ONLY apply if no search
      if (!search.trim()) {
        if (queueFilter === "priority") {
          patients = patients.filter(
            (p) =>
              p.isPriority &&
              p.status !== "unconsulted" &&
              p.status !== "released",
          );
        }

        if (queueFilter === "all") {
          patients = patients.filter((p) => p.status !== "unconsulted");
        }

        if (queueFilter === "unconsulted") {
          patients = patients.filter((p) => p.status === "unconsulted");
        }
      }

      // sort
      patients.sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;

        if (!a.isPriority && b.isPriority) return 1;

        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const total = patients.length;

      const startIndex = (page - 1) * limit;

      const paginated = patients.slice(startIndex, startIndex + limit);

      return {
        patients: paginated,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    }

    // ONLINE MODE
    const params = new URLSearchParams({
      page,
      limit,
      search,
      queueFilter,
      department,
      role,
    });

    if (all) {
      params.append("all", "true");
    }

    return apiFetch(`${API}/doctor-queue?${params.toString()}`);
  } catch (err) {
    console.error("Doctor queue failed", err);

    const cached = await db.patients.toArray();

    return {
      patients: cached,
      total: cached.length,
      totalPages: 1,
      currentPage: 1,
    };
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
