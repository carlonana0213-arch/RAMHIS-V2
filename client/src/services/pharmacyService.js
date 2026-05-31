import { apiFetch } from "./api";
import db from "./localDB";
import { API_BASE_URL } from "./apiConfig";

const API_URL = `${API_BASE_URL}/pharmacy`;

export const getMedicines = async () => {
  try {
    if (!navigator.onLine) {
      return db.medicines ? await db.medicines.toArray() : [];
    }

    const data = await apiFetch(API_URL);

    if (db.medicines) {
      await db.medicines.clear();

      await db.medicines.bulkPut(data);
    }

    return data;
  } catch (err) {
    console.error(err);

    return db.medicines ? await db.medicines.toArray() : [];
  }
};

export const addMedicine = async (data) => {
  // OFFLINE
  if (!navigator.onLine) {
    const offlineMedicine = {
      _id: `offline-${Date.now()}`,
      ...data,
      quantity: Number(data.quantity || 0),
      isOffline: true,
    };

    await db.medicines.put(offlineMedicine);

    await db.syncQueue.add({
      type: "ADD_MEDICINE",
      payload: data,
    });

    return {
      offline: true,
    };
  }

  // ONLINE
  return apiFetch(`${API_URL}/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const deleteMedicine = async (id) => {
  return apiFetch(`${API_URL}/delete/${id}`, {
    method: "DELETE",
  });
};

export const updateMedicine = async (id, data) => {
  // OFFLINE
  if (!navigator.onLine) {
    const medicine = await db.medicines.get(id);

    if (medicine) {
      await db.medicines.put({
        ...medicine,
        ...data,
      });
    }

    await db.syncQueue.add({
      type: "UPDATE_MEDICINE",

      medicineId: id,

      payload: data,
    });

    return {
      offline: true,
    };
  }

  // ONLINE
  return apiFetch(`${API_URL}/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
