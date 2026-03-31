export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration failure and keep the app usable.
    })
  })
}
