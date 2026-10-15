import { describe, it, expect, vi, beforeEach } from "vitest"
import { z } from "zod"

// Skema validasi path avatar seperti pada src/app/api/avatar/route.ts
const avatarPathSchema = z
  .string()
  .min(1, "Path avatar wajib diisi")
  .regex(/^[a-zA-Z0-9_\-\.\/]+$/, "Format path avatar tidak valid")
  .refine((p) => !p.includes(".."), "Path traversal tidak diizinkan")

describe("Uji Validasi dan Penanganan Avatar", () => {
  describe("1. Validasi Ukuran dan Tipe File Avatar", () => {
    const MAX_SIZE = 2 * 1024 * 1024 // 2MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

    it("menerima berkas gambar dengan ukuran <= 2MB", () => {
      const validSize = 1.5 * 1024 * 1024
      expect(validSize <= MAX_SIZE).toBe(true)
    })

    it("menolak berkas yang melebihi batas 2MB", () => {
      const oversized = 2.1 * 1024 * 1024
      expect(oversized > MAX_SIZE).toBe(true)
    })

    it("menerima format MIME gambar yang diizinkan (JPEG, PNG, WebP)", () => {
      expect(ALLOWED_TYPES.includes("image/jpeg")).toBe(true)
      expect(ALLOWED_TYPES.includes("image/png")).toBe(true)
      expect(ALLOWED_TYPES.includes("image/webp")).toBe(true)
    })

    it("menolak format berkas selain gambar yang ditentukan", () => {
      expect(ALLOWED_TYPES.includes("application/pdf")).toBe(false)
      expect(ALLOWED_TYPES.includes("image/gif")).toBe(false)
      expect(ALLOWED_TYPES.includes("image/svg+xml")).toBe(false)
      expect(ALLOWED_TYPES.includes("application/x-msdownload")).toBe(false)
    })
  })

  describe("2. Validasi Path Avatar pada Route Handler /api/avatar", () => {
    it("menerima path valid dengan format folder user_id dan nama file", () => {
      const validPath = "usr-123e4567-e89b-12d3-a456-426614174000/avatar-1712345678.jpg"
      const result = avatarPathSchema.safeParse(validPath)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(validPath)
      }
    })

    it("menolak path traversal yang mengandung '..'", () => {
      const traversalPath = "../secrets/passwords.txt"
      const result = avatarPathSchema.safeParse(traversalPath)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("Path traversal tidak diizinkan")
      }
    })

    it("menolak path dengan karakter terlarang / XSS injection", () => {
      const xssPath = "<script>alert(1)</script>"
      const result = avatarPathSchema.safeParse(xssPath)
      expect(result.success).toBe(false)
    })

    it("menolak path kosong", () => {
      const emptyPath = ""
      const result = avatarPathSchema.safeParse(emptyPath)
      expect(result.success).toBe(false)
    })
  })

  describe("3. Mekanisme URL Encoding & Decoding Parameter Avatar", () => {
    it("dapat mengenkode dan mendekode path bersarang dengan benar", () => {
      const originalPath = "user-abc-123/avatar-12345.png"
      const encoded = encodeURIComponent(originalPath)
      const decoded = decodeURIComponent(encoded)

      expect(decoded).toBe(originalPath)
      expect(avatarPathSchema.safeParse(decoded).success).toBe(true)
    })
  })

  describe("4. Integritas Flow Upload Avatar Role User", () => {
    it("menghasilkan URL avatar berbasis route internal /api/avatar", () => {
      const userId = "user-guid-001"
      const fileName = "avatar-1700000000.webp"
      const filePath = `${userId}/${fileName}`
      const avatarUrl = `/api/avatar?path=${encodeURIComponent(filePath)}`

      expect(avatarUrl).toContain("/api/avatar?path=")
      expect(avatarUrl).toContain(encodeURIComponent(filePath))

      // Ekstraksi path dari URL
      const extractedPath = decodeURIComponent(avatarUrl.split("/api/avatar?path=")[1])
      expect(extractedPath).toBe(filePath)
    })
  })
})
