"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Service worker baru terpasang
                }
              })
            }
          })
        })
        .catch((error) => {
          console.warn("Registrasi Service Worker gagal:", error)
        })
    }
  }, [])

  return null
}
