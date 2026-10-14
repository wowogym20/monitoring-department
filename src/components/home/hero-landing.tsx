"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  LogIn,
  LayoutDashboard,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeroLandingProps {
  isLoggedIn: boolean
  userEmail?: string | null
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function HeroLanding({ isLoggedIn, userEmail }: HeroLandingProps) {
  // State PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      // 1. Cek apakah aplikasi sudah berjalan dalam mode standalone (sudah terinstall)
      const nav = window.navigator as unknown as { standalone?: boolean }
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        nav.standalone === true ||
        document.referrer.includes("android-app://")

      if (isStandalone) {
        setIsInstalled(true)
      }

      // 2. Cek apakah perangkat adalah iOS Safari
      const userAgent = window.navigator.userAgent.toLowerCase()
      const win = window as unknown as { MSStream?: unknown }
      const isIosDevice =
        /iphone|ipad|ipod/.test(userAgent) && !win.MSStream
      setIsIos(isIosDevice)

      // 3. Cek penyimpanan lokal
      try {
        if (localStorage.getItem("tazakka-pwa-installed") === "true") {
          setIsInstalled(true)
        }
      } catch {
        // Abaikan
      }
    })

    // 4. Tangani event beforeinstallprompt (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // 5. Tangani event appinstalled saat proses instalasi selesai
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      try {
        localStorage.setItem("tazakka-pwa-installed", "true")
      } catch {
        // Abaikan jika localStorage tidak diizinkan
      }
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    )
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isInstalled) return

    if (deferredPrompt) {
      // Android / Chromium Desktop
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (isIos) {
      // iOS Safari panduan manual
      setShowIosGuide(true)
    } else {
      // Fallback peramban desktop lainnya (misal: menu browser)
      setShowIosGuide(true)
    }
  }

  return (
    <main className="h-dvh max-h-dvh w-full overflow-hidden flex flex-col justify-between items-center relative select-none bg-background text-foreground px-4 py-2 sm:px-6 sm:py-6 md:px-8 md:py-8">
      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 size-72 sm:size-96 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 size-72 sm:size-96 rounded-full bg-amber-500/15 dark:bg-amber-500/10 blur-3xl"
      />

      {/* TOP BAR / HEADER MINIMALIS */}
      <header className="w-full max-w-6xl flex items-center justify-between z-10 shrink-0 pt-4 sm:pt-6 md:pt-8">
        <div className="flex items-center gap-2">
          <div className="relative size-8 sm:size-10 rounded-lg overflow-hidden border border-emerald-600/30 bg-background/80 shadow-xs flex items-center justify-center p-1">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Tazakka"
              width={36}
              height={36}
              priority
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground leading-none">
              Pondok Modern Tazakka
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5">
              Portal Standarisasi Mutu
            </span>
          </div>
        </div>

        {/* Action Controls: Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* HERO SECTION TENGAH */}
      <section className="w-full max-w-4xl flex flex-col items-center justify-center text-center my-auto px-2 z-10 shrink">
        {/* Glowing Institutional Tag */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-sm font-medium mb-2 sm:mb-4 shadow-xs">
          <Sparkles className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
          <span>Sistem Informasi Terpadu & Terintegrasi</span>
        </div>

        {/* Main Big Centered Heading */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12] max-w-3xl mb-2 sm:mb-3">
          Dashboard Integrasi{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 dark:from-emerald-400 dark:via-emerald-300 dark:to-amber-400">
            Tazakka
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-xl sm:max-w-2xl leading-relaxed mb-4 sm:mb-8 font-normal">
          Portal terpadu pemantauan kinerja, standarisasi penilaian mutu, dan
          pelaporan periodik seluruh departemen di lingkungan Pondok Modern
          Tazakka.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full max-w-md">
          {/* Tombol Utama: Login (jika belum login) atau Buka Dashboard (jika sudah login) */}
          {isLoggedIn ? (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto min-w-[180px] h-10 sm:h-12 text-xs sm:text-base font-semibold bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md shadow-emerald-700/20 gap-2 rounded-xl"
            >
              <Link href="/dashboard" id="btn-hero-dashboard">
                <LayoutDashboard className="size-4 sm:size-5" />
                <span>Buka Dashboard</span>
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto min-w-[180px] h-10 sm:h-12 text-xs sm:text-base font-semibold bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md shadow-emerald-700/20 gap-2 rounded-xl"
            >
              <Link href="/login" id="btn-hero-login">
                <LogIn className="size-4 sm:size-5" />
                <span>Login</span>
              </Link>
            </Button>
          )}

          {/* Tombol Install App: Hanya muncul jika PWA belum terinstall */}
          {!isInstalled && (
            <Button
              type="button"
              id="btn-hero-install"
              variant="outline"
              size="lg"
              onClick={handleInstallClick}
              className="w-full sm:w-auto min-w-[160px] h-10 sm:h-12 text-xs sm:text-base font-medium border-border/80 hover:bg-muted/70 gap-2 rounded-xl"
            >
              <Download className="size-4 sm:size-5 text-emerald-700 dark:text-emerald-400" />
              <span>Install Aplikasi</span>
            </Button>
          )}
        </div>

        {/* Small Logged in indicator if applicable */}
        {isLoggedIn && userEmail && (
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-3">
            Masuk sebagai: <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        )}
      </section>

      {/* FOOTER MINIMALIS */}
      <footer className="w-full max-w-6xl text-center z-10 shrink-0 pt-2 border-t border-border/40">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pondok Modern Tazakka. Seluruh Hak Cipta
          Dilindungi.
        </p>
      </footer>

      {/* MODAL PANDUAN INSTALASI PWA (iOS / Browser Fallback) */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              aria-label="Tutup panduan instalasi"
              className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-4 sm:size-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                <Download className="size-5" />
              </div>
              <div>
                <h2
                  id="ios-guide-title"
                  className="font-bold text-sm sm:text-base text-foreground leading-tight"
                >
                  Install Aplikasi Tazakka
                </h2>
                <p className="text-xs text-muted-foreground">
                  Akses langsung dari layar utama perangkat Anda
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-foreground/90">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/50">
                <Share2 className="size-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  1. Ketuk tombol <span className="font-semibold">Bagikan (Share)</span> di bilah bawah peramban Safari Anda.
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/50">
                <PlusSquare className="size-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  2. Gulir ke bawah lalu pilih menu{" "}
                  <span className="font-semibold">&quot;Tambahkan ke Layar Utama&quot;</span> (*Add to Home Screen*).
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/50">
                <CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  3. Ketuk <span className="font-semibold">&quot;Tambah&quot;</span> di pojok kanan atas untuk menyelesaikan instalasi.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-medium"
            >
              Mengerti
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
