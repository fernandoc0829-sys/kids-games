// Dino Diet service worker: makes the game work offline once it has been opened online.
// Bump VERSION whenever index.html or any file in assets/ changes so devices re-download.
const VERSION = "v1";
const CACHE = `dino-diet-${VERSION}`;
const FONT_CACHE = "dino-diet-fonts";

const SPECIES = ["compsognathus", "stegosaurus", "triceratops", "oviraptor", "velociraptor", "trex", "spinosaurus"];
const STAGES = ["baby", "juvenile", "adult", "giant"];
const PRECACHE = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png",
  ...SPECIES.flatMap((s) => [
    `./assets/bg-${s}.webp`, `./assets/bg-${s}-wide.webp`,
    ...STAGES.map((t) => `./assets/${s}-${t}.webp`),
  ]),
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One missing file must not break the whole install (art is optional in this game).
    await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("dino-diet-") && k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: serve from cache, refresh in the background (works offline after first visit).
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(req);
      const refresh = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || refresh;
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Page navigations: network first (so updates arrive), fall back to the cached page offline.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put("./index.html", res.clone());
        return res;
      } catch (e) {
        return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  // Everything else (art, icons, manifest): cache first, then network (and remember it).
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (e) {
      return Response.error(); // e.g. missing optional art offline: the game falls back to vector art
    }
  })());
});
