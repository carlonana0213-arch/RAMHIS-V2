export const permissions = {
  registry: ["Admin", "Volunteer", "Doctor"],
  doctorSheet: ["Admin", "Doctor"],
  pharmacy: ["Admin", "Volunteer", "Doctor"],
  queue: ["Admin", "Doctor", "Volunteer", "Pharmacist"],
  accounts: ["Admin", "Doctor", "Volunteer", "Pharmacist"],
  admin: ["Admin"],
  patient: ["Doctor", "Admin", "Volunteer"],
};
