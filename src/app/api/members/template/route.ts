import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const templateFormatSchema = z.enum(["xlsx", "csv"]).catch("xlsx")

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.is_active) {
      return new NextResponse("Unauthorized: Silakan login terlebih dahulu.", {
        status: 401,
      })
    }

    if (!["super_admin", "admin"].includes(user.role)) {
      return new NextResponse(
        "Forbidden: Anda tidak memiliki hak akses untuk mengunduh template anggota.",
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = templateFormatSchema.parse(searchParams.get("format"))

    const supabase = await createClient()
    const { data: depts } = await supabase
      .from("departments")
      .select("kode, nama")
      .eq("is_active", true)
      .order("nama", { ascending: true })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Monitoring Departemen Tazakka"
    workbook.created = new Date()

    // 1. Sheet Utama: Template Anggota
    const sheet = workbook.addWorksheet("Template Anggota")

    sheet.columns = [
      { header: "kode_departemen", key: "kode_departemen", width: 20 },
      { header: "nig", key: "nip", width: 18 },
      { header: "nama", key: "nama", width: 30 },
      { header: "jabatan", key: "jabatan", width: 25 },
      { header: "no_hp", key: "no_hp", width: 18 },
    ]

    // Style header
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" }, // Emerald 600
    }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }

    // Contoh data
    sheet.addRow({
      kode_departemen: "PEND-AJAR",
      nip: "199201012020",
      nama: "Ustadz Abdullah, S.Pd.",
      jabatan: "Staff Kurikulum",
      no_hp: "081234567890",
    })

    sheet.addRow({
      kode_departemen: "TI",
      nip: "199405122021",
      nama: "Muhammad Ilham, S.Kom.",
      jabatan: "Programmer",
      no_hp: "081987654321",
    })

    // 2. Sheet Kedua (Khusus Excel): Referensi Kode Departemen
    if (format === "xlsx") {
      const refSheet = workbook.addWorksheet("Referensi Departemen")
      refSheet.columns = [
        { header: "Kode Departemen", key: "kode", width: 20 },
        { header: "Nama Departemen", key: "nama", width: 45 },
      ]

      const refHeader = refSheet.getRow(1)
      refHeader.font = { bold: true, color: { argb: "FFFFFFFF" } }
      refHeader.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF97316" }, // Orange 500
      }

      if (depts && depts.length > 0) {
        depts.forEach((d) => {
          refSheet.addRow({ kode: d.kode, nama: d.nama })
        })
      }
    }

    if (format === "csv") {
      const csvBuffer = await workbook.csv.writeBuffer()
      return new NextResponse(csvBuffer, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="template-impor-anggota-tazakka.csv"',
        },
      })
    }

    const xlsxBuffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(xlsxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template-impor-anggota-tazakka.xlsx"',
      },
    })
  } catch (error: unknown) {
    console.error("Gagal membuat template anggota:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
