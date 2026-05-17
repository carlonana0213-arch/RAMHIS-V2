import { apiFetch } from "./api";

const API = "http://localhost:5000/api/dashboard";

export const getDashboardSummary = () => apiFetch(`${API}/summary`);

export const getPatientTrends = () => apiFetch(`${API}/patient-trends`);

export const getDiagnosisDistribution = () =>
  apiFetch(`${API}/diagnosis-distribution`);

export const getTopMedicines = () => apiFetch(`${API}/top-medicines`);
