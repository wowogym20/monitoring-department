import { describe, it, expect, beforeEach, vi } from "vitest"
import fs from "fs"
import path from "path"
import nextConfig from "../next.config"
import { clearAppClientCache } from "@/components/providers/query-provider"

describe("Optimasi F5 Hard Refresh, Cache-Control ETag, dan Persistensi Klien", () => {
  describe("1. Vercel Serverless Region Optimization", () => {
    it("memastikan vercel.json dikonfigurasi dengan region sin1 (Singapore) dekat dengan Supabase", () => {
      const vercelJsonPath = path.resolve(process.cwd(), "vercel.json")
      expect(fs.existsSync(vercelJsonPath)).toBe(true)

      const raw = fs.readFileSync(vercelJsonPath, "utf-8")
      const parsed = JSON.parse(raw)
      expect(parsed.regions).toBeDefined()
      expect(parsed.regions).toContain("sin1")
    })
  })

  describe("2. HTTP Cache-Control Header untuk Validasi ETag / 304", () => {
    it("mengonfigurasi header Cache-Control private, no-cache, no-transform untuk rute dashboard", async () => {
      expect(nextConfig.headers).toBeDefined()
      if (typeof nextConfig.headers === "function") {
        const headersList = await nextConfig.headers()
        const dashboardHeaderRule = headersList.find((rule) =>
          rule.source.includes("dashboard")
        )
        expect(dashboardHeaderRule).toBeDefined()
        const cacheControl = dashboardHeaderRule?.headers.find(
          (h) => h.key.toLowerCase() === "cache-control"
        )
        expect(cacheControl).toBeDefined()
        expect(cacheControl?.value).toContain("private")
        expect(cacheControl?.value).toContain("no-cache")
        expect(cacheControl?.value).toContain("no-transform")
      }
    })
  })

  describe("3. Isolasi Cache per Pengguna & Pembersihan saat Logout", () => {
    beforeEach(() => {
      // Mocking localStorage untuk lingkungan test
      const store: Record<string, string> = {}
      vi.stubGlobal("localStorage", {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, val: string) => {
          store[key] = val
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key]
        }),
        clear: vi.fn(() => {
          Object.keys(store).forEach((key) => delete store[key])
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
          return Object.keys(store).length
        },
      })
    })

    it("menghapus semua cache pengguna (tazakka_qc_*) saat clearAppClientCache dipanggil", () => {
      localStorage.setItem("tazakka_qc_user-123", JSON.stringify({ timestamp: Date.now() }))
      localStorage.setItem("tazakka_qc_user-456", JSON.stringify({ timestamp: Date.now() }))
      localStorage.setItem("other_app_setting", "kept")

      expect(localStorage.getItem("tazakka_qc_user-123")).not.toBeNull()
      expect(localStorage.getItem("tazakka_qc_user-456")).not.toBeNull()
      expect(localStorage.getItem("other_app_setting")).toBe("kept")

      clearAppClientCache()

      expect(localStorage.getItem("tazakka_qc_user-123")).toBeNull()
      expect(localStorage.getItem("tazakka_qc_user-456")).toBeNull()
      // Kunci lain yang tidak terkait cache pengguna harus tetap utuh
      expect(localStorage.getItem("other_app_setting")).toBe("kept")
    })
  })
})
