import { apiFetch } from "./api";

const API = "http://localhost:5000/api";

export const loadPatientPrescriptions = async (patientId) => {
  return apiFetch(`${API}/prescriptions/patient/${patientId}`);
};

export const saveDoctorRecord = async (patientId, data) => {
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
  return apiFetch(`${API}/prescriptions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const markMedicineGiven = async (prescriptionId, itemId) => {
  return apiFetch(`${API}/prescriptions/${prescriptionId}/${itemId}`, {
    method: "PATCH",
  });
};

export const updatePatientStatus = async (patientId, data) => {
  return apiFetch(`${API}/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
