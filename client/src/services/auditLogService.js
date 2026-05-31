import { apiFetch } from "./api";
import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/audit-logs`;

export const getAuditLogs = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "All") {
      params.append(key, value);
    }
  });

  return apiFetch(`${API}?${params.toString()}`);
};

export const getAuditLocations = () => {
  return apiFetch(`${API}/locations`);
};