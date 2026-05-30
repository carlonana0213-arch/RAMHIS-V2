import Dexie from "dexie";

const db = new Dexie("RAMHIS_DB");

db.version(1).stores({
  patients: "_id, status, department",
  doctorRecords: "++id, patientId",
  prescriptions: "++id, patient",
  syncQueue: "++id, type",
});
export default db;
