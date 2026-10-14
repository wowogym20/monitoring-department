"use client"

import { useEffect, useState, useRef, useTransition } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useIsFetching } from "@tanstack/react-query"

export function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFetching = useIsFetching()
  const [isPending] = useTransition()

  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isNavigatingRef = useRef(false)

  // Fungsi untuk memulai animasi progress
  const startProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setVisible(true)
    setProgress(15)

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current)
          return prev
        }
        // Kenaikan bertahap mendekati 85%
        const step = Math.max(1, (85 - prev) * 0.1)
        return Math.min(85, prev + step)
      })
    }, 150)
  }

  // Fungsi untuk menyelesaikan progress ke 100% dan menghilang
  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgress(100)
    setTimeout(() => {
      setVisible(false)
      setTimeout(() => setProgress(0), 200)
      isNavigatingRef.current = false
    }, 250)
  }

  // Deteksi klik pada tautan internal untuk memicu loading bar seketika
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a")
      if (!target) return

      const href = target.getAttribute("href")
      if (!href) return

      // Lewatkan tautan eksternal, anchor hash, new tab, atau download
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      // Pastikan domain sama
      try {
        const targetUrl = new URL(href, window.location.origin)
        if (targetUrl.origin !== window.location.origin) return

        const currentUrl = new URL(window.location.href)
        // Jika target sama persis dengan URL saat ini, jangan picu
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return
        }

        isNavigatingRef.current = true
        startProgress()
      } catch {
        // Abaikan URL tidak valid
      }
    }

    document.addEventListener("click", handleDocumentClick)
    return () => {
      document.removeEventListener("click", handleDocumentClick)
    }
  }, [])

  // Selesaikan animasi saat rute berubah
  useEffect(() => {
    queueMicrotask(() => {
      completeProgress()
    })
  }, [pathname, searchParams])

  // Picu progress saat React Query sedang fetching atau useTransition aktif
  useEffect(() => {
    queueMicrotask(() => {
      if (isFetching > 0 || isPending) {
        startProgress()
      } else if (!isNavigatingRef.current) {
        completeProgress()
      }
    })
  }, [isFetching, isPending])

  // Dengarkan custom event manual jika ada aksi asinkron khusus
  useEffect(() => {
    const handleStart = () => startProgress()
    const handleStop = () => completeProgress()

    window.addEventListener("app:loading:start", handleStart)
    window.addEventListener("app:loading:stop", handleStop)

    return () => {
      window.removeEventListener("app:loading:start", handleStart)
      window.removeEventListener("app:loading:stop", handleStop)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Indikator pemuatan halaman"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease-in-out",
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
        style={{
          width: `${progress}%`,
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  )
}
