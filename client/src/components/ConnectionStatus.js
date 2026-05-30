import { useEffect, useState } from "react";

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online = () => setIsOnline(true);

    const offline = () => setIsOnline(false);

    window.addEventListener("online", online);

    window.addEventListener("offline", offline);

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
      {isOnline ? "🟢 Online" : "🔴 Offline"}
    </div>
  );
}

export default ConnectionStatus;
