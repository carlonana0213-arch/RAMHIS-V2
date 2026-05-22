const permissions = {
  registry: [
    "volunteer",
    "doctor",
    "admin",
  ],

  pharmacy: [
    "volunteer",
    "doctor",
    "admin",
  ],

  queue: [
    "volunteer",
    "doctor",
    "admin",
  ],

  doctorSheet: [
    "doctor",
    "admin",
  ],

  prescriptions: [
    "doctor",
    "volunteer",
    "admin",
  ],

  analytics: [
    "admin",
  ],
};

module.exports = permissions;