import { useEffect, useState } from "react";
import { syncOfflineTransactions } from "../services/syncService";
function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const online = async () => {
      setIsOnline(true);

      await syncOfflineTransactions();
    };

    const offline = () => setIsOnline(false);

    window.addEventListener("online", online);

    window.addEventListener("offline", offline);
    const loadPending = async () => {
      const db = (await import("../services/localDB")).default;

      const count = await db.syncQueue.count();

      setPendingSync(count);
    };

    loadPending();
    return () => {
      window.removeEventListener("online", online);

      window.removeEventListener("offline", offline);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        padding: "8px 14px",
        borderRadius: "999px",
        fontWeight: 600,
        fontSize: "0.85rem",
        color: "#fff",
        background: isOnline ? "#16a34a" : "#dc2626",
      }}
    >
      {isOnline
        ? `🟢 Online ${pendingSync ? `(${pendingSync} syncing)` : ""}`
        : `🔴 Offline ${pendingSync ? `(${pendingSync} pending)` : ""}`}
    </div>
  );
}

export default ConnectionStatus;
