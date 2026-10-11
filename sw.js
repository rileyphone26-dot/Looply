// Nova service worker
// Minimal worker for reliable PWABuilder detection.
// Offline caching can be added back after detection is confirmed.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
