import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"

const { mockQueryResult, mockCreateAdminClient } = vi.hoisted(() => {
  const mockQueryResult = {
    data: { id: "dept-1" } as { id: string } | null,
    error: null as { message: string } | null,
  }
  const mockCreateAdminClient = vi.fn(() => ({
    from: () => ({
      select: () => ({
        limit: () => ({
          maybeSingle: async () => mockQueryResult,
        }),
      }),
    }),
  }))
  return { mockQueryResult, mockCreateAdminClient }
})

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}))

describe("Keep-Alive API & Vercel Cron Configuration", () => {
  describe("1. Validasi Berkas vercel.json", () => {
    const vercelConfigPath = path.resolve(__dirname, "../vercel.json")

    it("berkas vercel.json tersedia di root project", () => {
      expect(fs.existsSync(vercelConfigPath)).toBe(true)
    })

    it("memiliki konfigurasi cron job yang valid untuk /api/keep-alive", () => {
      const rawContent = fs.readFileSync(vercelConfigPath, "utf-8")
      const parsed = JSON.parse(rawContent)

      expect(parsed).toHaveProperty("crons")
      expect(Array.isArray(parsed.crons)).toBe(true)
      expect(parsed.crons.length).toBeGreaterThanOrEqual(1)

      const keepAliveCron = parsed.crons.find(
        (c: { path: string }) => c.path === "/api/keep-alive"
      )
      expect(keepAliveCron).toBeDefined()
      // Jadwal setiap 5 hari sekali pada pukul 00:00 UTC
      expect(keepAliveCron.schedule).toBe("0 0 */5 * *")
    })
  })

  describe("2. Validasi Endpoint /api/keep-alive", () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
      mockQueryResult.data = { id: "dept-1" }
      mockQueryResult.error = null
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it("menolak request jika CRON_SECRET dikonfigurasi dan header otentikasi tidak cocok", async () => {
      process.env.CRON_SECRET = "super-secret-token-123"

      const { GET } = await import("@/app/api/keep-alive/route")

      const request = new Request("http://localhost:3000/api/keep-alive", {
        headers: {
          authorization: "Bearer wrong-token",
        },
      })

      const response = await GET(request)
      expect(response.status).toBe(401)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain("CRON_SECRET")
    })

    it("menerima request jika CRON_SECRET cocok dengan header Authorization", async () => {
      process.env.CRON_SECRET = "super-secret-token-123"
      mockQueryResult.data = { id: "dept-123" }
      mockQueryResult.error = null

      const { GET } = await import("@/app/api/keep-alive/route")

      const request = new Request("http://localhost:3000/api/keep-alive", {
        headers: {
          authorization: "Bearer super-secret-token-123",
        },
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.message).toContain("Supabase keep-alive ping successful")
      expect(typeof body.latencyMs).toBe("number")
      expect(body.recordFound).toBe(true)
      expect(response.headers.get("cache-control")).toContain("no-store")
    })

    it("mengizinkan request ketika CRON_SECRET tidak diset (mode pengembangan lokal)", async () => {
      delete process.env.CRON_SECRET
      mockQueryResult.data = { id: "dept-sample" }
      mockQueryResult.error = null

      const { GET } = await import("@/app/api/keep-alive/route")

      const request = new Request("http://localhost:3000/api/keep-alive")
      const response = await GET(request)
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it("menangani kegagalan database dengan mengembalikan status 500 dan rincian error", async () => {
      delete process.env.CRON_SECRET
      mockQueryResult.data = null
      mockQueryResult.error = { message: "Database connection timeout" }

      const { GET } = await import("@/app/api/keep-alive/route")

      const request = new Request("http://localhost:3000/api/keep-alive")
      const response = await GET(request)
      expect(response.status).toBe(500)

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain("Database connection timeout")
    })
  })
})
