const permissions = {
  registry: ["Volunteer", "Doctor", "Admin"],
  pharmacy: ["Volunteer", "Doctor", "Admin"],
  queue: ["Volunteer", "Doctor", "Admin"],
  doctorSheet: ["Doctor", "Admin"],
  prescriptions: ["Doctor", "Volunteer", "Admin"],
  analytics: ["Admin"],
};

module.exports = permissions;
