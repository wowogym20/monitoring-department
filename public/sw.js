// Service Worker: Dashboard Integrasi Tazakka
const CACHE_NAME = "tazakka-pwa-v1"
const STATIC_ASSETS = [
  "/",
  "/login",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA pre-cache warning:", err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // Hanya proses GET requests
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  // Jangan cache API routes atau Supabase auth/data requests
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return
  }

  // Strategi Network First dengan Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache aset statis gambar & icon
        if (
          networkResponse.status === 200 &&
          (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2)$/) ||
            url.pathname.startsWith("/icons/"))
        ) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return networkResponse
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }
        // Fallback untuk navigasi dokumen
        if (event.request.mode === "navigate") {
          const fallbackHome = await caches.match("/")
          if (fallbackHome) return fallbackHome
        }
        return new Response("Koneksi offline", { status: 503, statusText: "Offline" })
      })
  )
})
