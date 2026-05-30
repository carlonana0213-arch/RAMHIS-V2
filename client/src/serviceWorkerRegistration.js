export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("PWA service worker registered");
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    });
  }
}
