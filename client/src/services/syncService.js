import db from "./localDB";
import { apiFetch } from "./api";

const API = `${process.env.REACT_APP_API_URL}/api/patients`;

export const syncOfflineTransactions = async () => {
  if (!navigator.onLine) return;

  try {
    const queue = await db.syncQueue.toArray();

    if (!queue.length) return;

    console.log(`Syncing ${queue.length} offline actions...`);

    for (const item of queue) {
      try {
        switch (item.type) {
          case "ADD_PATIENT": {
            await apiFetch(API, {
              method: "POST",
              body: JSON.stringify(item.payload),
            });

            break;
          }

          case "UPDATE_PATIENT": {
            await apiFetch(`${API}/${item.patientId}`, {
              method: "PUT",
              body: JSON.stringify(item.payload),
            });

            break;
          }

          case "SAVE_DOCTOR_RECORD": {
            await apiFetch(`${API}/${item.patientId}/doctor-record`, {
              method: "POST",
              body: JSON.stringify(item.payload),
            });

            break;
          }

          case "SAVE_PRESCRIPTION": {
            await apiFetch(
              `${process.env.REACT_APP_API_URL}/api/prescriptions`,
              {
                method: "POST",
                body: JSON.stringify(item.payload),
              },
            );

            break;
          }

          case "ADD_MEDICINE": {
            await apiFetch(
              `${process.env.REACT_APP_API_URL}/api/pharmacy/add`,
              {
                method: "POST",
                body: JSON.stringify(item.payload),
              },
            );

            break;
          }

          case "UPDATE_MEDICINE": {
            await apiFetch(
              `${process.env.REACT_APP_API_URL}/api/pharmacy/update/${item.medicineId}`,
              {
                method: "PUT",
                body: JSON.stringify(item.payload),
              },
            );

            break;
          }

          case "DELETE_MEDICINE": {
            await apiFetch(
              `${process.env.REACT_APP_API_URL}/api/pharmacy/delete/${item.medicineId}`,
              {
                method: "DELETE",
              },
            );

            break;
          }

          default:
            break;
        }

        // remove completed item
        await db.syncQueue.delete(item.id);
      } catch (err) {
        console.error("Sync item failed", err);
      }
    }

    console.log("Offline sync complete");
  } catch (err) {
    console.error("Sync failed", err);
  }
};
