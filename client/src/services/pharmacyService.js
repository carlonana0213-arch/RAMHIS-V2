import { apiFetch } from "./api";

import { API_BASE_URL } from "./apiConfig";

const API_URL = `${API_BASE_URL}/pharmacy`;

export const getMedicines = async () => {
  return apiFetch(API_URL);
};

export const addMedicine = async (data) => {
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
  return apiFetch(`${API_URL}/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
