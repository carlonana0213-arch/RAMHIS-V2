export const permissions = {
  registry: ["admin", "volunteer", "doctor"],
  doctorSheet: ["admin", "doctor"],
  pharmacy: ["admin", "volunteer", "doctor"],
  queue: ["admin", "doctor", "volunteer", "pharmacist"],
  accounts: ["admin", "doctor", "volunteer", "pharmacist"],
  admin: ["admin"],
  patient: ["doctor", "admin", "volunteer"],
  analytics: ["admin"],
  dashboard: ["admin"],
};
