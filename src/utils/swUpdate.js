/**
 * Unregisters the service worker and clears Cache Storage, then reloads.
 * This is deliberately narrower than "clear site data": Cache Storage and
 * the service worker are completely separate from localStorage, so this
 * can never touch the saved token or progress history — only the cached
 * app shell (HTML/JS/CSS), which is exactly what goes stale after a deploy.
 */
export async function forceUpdate() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  window.location.reload();
}
