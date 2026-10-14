import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { EXPORT_ROLES, exportFilterSchema } from "@/lib/validations/export"
import { getExportDataset, buildExportFilename } from "@/lib/export/data"
import { generateExcelWorkbook } from "@/lib/export/excel"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // 1. Cek autentikasi dan otorisasi role (super_admin & admin)
    const user = await getCurrentUser()
    if (!user || !user.is_active) {
      return new NextResponse("Unauthorized: Silakan login terlebih dahulu.", {
        status: 401,
      })
    }

    if (!EXPORT_ROLES.includes(user.role)) {
      return new NextResponse(
        "Forbidden: Anda tidak memiliki hak akses untuk mengunduh laporan ekspor.",
        { status: 403 }
      )
    }

    // 2. Validasi parameter query dengan Zod
    const url = new URL(request.url)
    const rawQuery = {
      periodeId: url.searchParams.get("periodeId") || undefined,
      departmentId: url.searchParams.get("departmentId") || "all",
    }

    const validationResult = exportFilterSchema.safeParse(rawQuery)
    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.errors[0]?.message || "Parameter tidak valid."
      return new NextResponse(`Bad Request: ${errorMsg}`, { status: 400 })
    }

    const { periodeId, departmentId } = validationResult.data

    // 3. Ambil data ekspor terintegrasi
    const dataset = await getExportDataset({
      periodeId,
      departmentId,
      userRole: user.role,
    })

    // 4. Generate dokumen Excel (.xlsx)
    const buffer = await generateExcelWorkbook(dataset)

    // 5. Susun nama file deskriptif
    const filename = buildExportFilename({
      periodeNama: dataset.period.nama,
      departmentKode: dataset.scopeDepartmentKode,
      ext: "xlsx",
      date: dataset.exportedAt,
    })

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error: unknown) {
    console.error("Gagal mengekspor laporan Excel:", error)
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server."
    return new NextResponse(`Internal Server Error: ${message}`, {
      status: 500,
    })
  }
}
