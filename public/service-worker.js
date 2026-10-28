// Replaces the Qwik prefetch service worker that returning visitors may still have installed:
// unregister it and delete Qwik's cache. The site does not register a service worker any more.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("QwikBuild")).map((key) => caches.delete(key)));
      await self.registration.unregister();
    })(),
  );
});
