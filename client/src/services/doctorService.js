import { apiFetch } from "./api";
import { API_BASE_URL } from "./apiConfig";
import db from "./localDB";
const API = `${API_BASE_URL}/api`;
const isOffline = () => !navigator.onLine;
export const loadPatientPrescriptions = async (patientId) => {
  if (isOffline()) {
    return db.prescriptions.where("patient").equals(patientId).toArray();
  }

  const data = await apiFetch(`${API}/prescriptions/patient/${patientId}`);

  // refresh local cache
  const cached = await db.prescriptions
    .where("patient")
    .equals(patientId)
    .toArray();

  for (const item of cached) {
    await db.prescriptions.delete(item._id);
  }

  await db.prescriptions.bulkPut(data);

  return data;
};

export const saveDoctorRecord = async (patientId, data) => {
  // offline
  if (isOffline()) {
    const offlineRecord = {
      ...data,
      patientId,
      createdOffline: true,
      date: new Date(),
    };

    // save locally
    await db.doctorRecords.add(offlineRecord);

    // update patient cache
    const patient = await db.patients.get(patientId);

    if (patient) {
      await db.patients.put({
        ...patient,
        doctorSheets: [...(patient.doctorSheets || []), offlineRecord],
      });
    }

    // queue sync
    await db.syncQueue.add({
      type: "SAVE_DOCTOR_RECORD",
      patientId,
      payload: data,
    });

    return {
      ...offlineRecord,
      offline: true,
    };
  }

  return apiFetch(`${API}/patients/${patientId}/doctor-record`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const deleteDoctorRecord = async (patientId, recordId, deletedBy) => {
  return apiFetch(`${API}/patients/${patientId}/doctor-record/${recordId}`, {
    method: "DELETE",
    body: JSON.stringify({
      deletedBy,
      deletedAt: new Date(),
    }),
  });
};

export const savePrescription = async (data) => {
  // offline
  if (isOffline()) {
    const offlinePrescription = {
      _id: `offline-${Date.now()}`,

      patient: data.patient,

      doctor: data.doctor,

      status: "Pending",

      createdOffline: true,

      items: data.items.map((item) => ({
        _id: `offline-item-${Date.now()}-${Math.random()}`,

        medicine: {
          _id: item.medicine,
        },

        quantity: item.quantity,

        directions: item.directions,

        isGiven: false,
      })),
    };

    // save locally
    await db.prescriptions.add(offlinePrescription);

    // queue sync
    await db.syncQueue.add({
      type: "SAVE_PRESCRIPTION",

      payload: data,
    });

    return {
      ...offlinePrescription,
      offline: true,
    };
  }

  return apiFetch(`${API}/prescriptions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const markMedicineGiven = async (prescriptionId, itemId) => {
  // OFFLINE
  if (isOffline()) {
    const prescription = await db.prescriptions.get(prescriptionId);

    if (prescription) {
      prescription.items = prescription.items.map((item) =>
        item._id === itemId
          ? {
              ...item,
              isGiven: true,
            }
          : item,
      );

      await db.prescriptions.put(prescription);
    }

    await db.syncQueue.add({
      type: "MARK_MEDICINE_GIVEN",

      prescriptionId,
      itemId,
    });

    return {
      offline: true,
    };
  }

  return apiFetch(`${API}/prescriptions/${prescriptionId}/${itemId}`, {
    method: "PATCH",
  });
};

export const updatePatientStatus = async (patientId, data) => {
  // OFFLINE
  if (isOffline()) {
    const patient = await db.patients.get(patientId);

    if (patient) {
      await db.patients.put({
        ...patient,
        ...data,
        pendingSync: true,
      });
    }

    await db.syncQueue.add({
      type: "UPDATE_PATIENT_STATUS",

      patientId,

      payload: data,
    });

    return {
      offline: true,
    };
  }

  return apiFetch(`${API}/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
