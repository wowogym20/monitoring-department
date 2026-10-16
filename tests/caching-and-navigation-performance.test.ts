import { describe, it, expect } from "vitest"
import nextConfig from "../next.config"
import { clearAppClientCache } from "@/components/providers/query-provider"
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/settings/default-settings"
import { navigationItems } from "@/components/layout/nav-items"

describe("Optimasi Performa Caching & Navigasi Instan", () => {
  describe("1. Konfigurasi Next.js Client-Side Router Cache (staleTimes)", () => {
    it("memiliki konfigurasi experimental.staleTimes di next.config.ts", () => {
      expect(nextConfig.experimental).toBeDefined()
      expect(nextConfig.experimental?.staleTimes).toBeDefined()
    })

    it("mempertahankan cache rute dinamis (dynamic) minimal 180 detik (3 menit) untuk navigasi instan tanpa skeleton", () => {
      const dynamicStale = nextConfig.experimental?.staleTimes?.dynamic
      expect(dynamicStale).toBeDefined()
      expect(dynamicStale).toBeGreaterThanOrEqual(180)
    })

    it("mempertahankan cache rute statis (static) minimal 300 detik (5 menit)", () => {
      const staticStale = nextConfig.experimental?.staleTimes?.static
      expect(staticStale).toBeDefined()
      expect(staticStale).toBeGreaterThanOrEqual(300)
    })
  })

  describe("2. TanStack Query Cache & Stale-While-Revalidate", () => {
    it("mengekspor fungsi clearAppClientCache untuk pengosongan cache saat logout", () => {
      expect(typeof clearAppClientCache).toBe("function")
      // Memastikan fungsi dapat dipanggil tanpa error di environment apapun
      expect(() => clearAppClientCache()).not.toThrow()
    })
  })

  describe("3. Keamanan Sesi & Konsistensi Data", () => {
    it("memastikan nilai default pengaturan sistem selalu valid sebagai fallback aman", () => {
      expect(DEFAULT_SYSTEM_SETTINGS.general.appName).toBeTruthy()
      expect(DEFAULT_SYSTEM_SETTINGS.scoring.thresholds.sangatBaik).toBeGreaterThan(0)
    })

    it("seluruh item navigasi utama memiliki href yang valid untuk prefetching", () => {
      navigationItems.forEach((item) => {
        expect(item.href).toMatch(/^\/[a-zA-Z0-9\-_]*$/)
        expect(item.title).toBeTruthy()
      })
    })
  })
})
