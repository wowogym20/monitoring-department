import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { ManualRole, MANUAL_CONFIGS } from "@/lib/panduan/manual-pdf-types"
import { generateManualPdfBuffer } from "@/lib/panduan/manual-pdf-generator"
import { z } from "zod"

export const dynamic = "force-dynamic"

const downloadQuerySchema = z.object({
  role: z.enum(["all", "user", "admin", "super_admin"]).default("all"),
})

export async function GET(request: Request) {
  try {
    // 1. Verifikasi sesi login dan otorisasi role Super Admin
    const user = await getCurrentUser()
    if (!user || !user.is_active) {
      return new NextResponse("Unauthorized: Silakan login terlebih dahulu.", {
        status: 401,
      })
    }

    if (user.role !== "super_admin") {
      return new NextResponse(
        "Forbidden: Menu dan buku panduan ini khusus untuk Pimpinan / Super-Admin.",
        { status: 403 }
      )
    }

    // 2. Validasi parameter query
    const url = new URL(request.url)
    const rawRole = url.searchParams.get("role") || "all"
    const parsed = downloadQuerySchema.safeParse({ role: rawRole })

    if (!parsed.success) {
      return new NextResponse("Bad Request: Parameter role tidak valid.", {
        status: 400,
      })
    }

    const role = parsed.data.role as ManualRole
    const config = MANUAL_CONFIGS[role]

    // 3. Generate Buffer PDF dokumen buku panduan
    const pdfBuffer = await generateManualPdfBuffer(role)

    // 4. Kirim respons biner PDF dengan header attachment
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${config.filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: unknown) {
    console.error("Kesalahan generate buku panduan PDF:", error)
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan server."
    return new NextResponse(`Internal Server Error: ${msg}`, { status: 500 })
  }
}
