import ExcelJS from "exceljs"
import { ExportDataset } from "./types"
import { formatDateJakarta } from "@/lib/date"

/**
 * Palet warna tema emerald islami dan netral
 */
const COLORS = {
  emeraldHeader: "FF059669", // Emerald 600
  emeraldHeaderSub: "FF047857", // Emerald 700
  emeraldAccentLight: "FFECFDF5", // Emerald 50
  zebraRow: "FFF8FAFC", // Slate 50
  borderGray: "FFD1D5DB", // Gray 300
  borderDark: "FF9CA3AF", // Gray 400
  textWhite: "FFFFFFFF",
  textDark: "FF1E293B",
  textMuted: "FF64748B",
  totalRowFill: "FFF1F5F9", // Slate 100
}

/**
 * Gaya border tipis standar
 */
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.borderGray } },
  left: { style: "thin", color: { argb: COLORS.borderGray } },
  bottom: { style: "thin", color: { argb: COLORS.borderGray } },
  right: { style: "thin", color: { argb: COLORS.borderGray } },
}

/**
 * Menghasilkan buffer dokumen Excel (.xlsx) menggunakan exceljs
 */
export async function generateExcelWorkbook(dataset: ExportDataset): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Monitoring Departemen Tazakka"
  workbook.lastModifiedBy = "Monitoring Departemen Tazakka"
  workbook.created = dataset.exportedAt
  workbook.modified = dataset.exportedAt

  const formattedExportDate = formatDateJakarta(dataset.exportedAt)
  const periodeName = dataset.period.nama

  // ===========================================================================
  // SHEET 1: RINGKASAN DEPARTEMEN
  // ===========================================================================
  const sheetSummary = workbook.addWorksheet("Ringkasan Departemen", {
    views: [{ showGridLines: true }],
  })

  // 1. Judul Laporan & Metadata
  sheetSummary.mergeCells("A1:H1")
  const titleCell1 = sheetSummary.getCell("A1")
  titleCell1.value = "MONITORING DEPARTEMEN — REKAPITULASI PENILAIAN"
  titleCell1.font = { name: "Arial", size: 14, bold: true, color: { argb: COLORS.emeraldHeaderSub } }
  titleCell1.alignment = { vertical: "middle", horizontal: "left" }
  sheetSummary.getRow(1).height = 28

  sheetSummary.getCell("A2").value = "Periode:"
  sheetSummary.getCell("A2").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textMuted } }
  sheetSummary.getCell("B2").value = periodeName
  sheetSummary.getCell("B2").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textDark } }

  sheetSummary.getCell("A3").value = "Lingkup:"
  sheetSummary.getCell("A3").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textMuted } }
  sheetSummary.getCell("B3").value = dataset.scopeDepartmentName
  sheetSummary.getCell("B3").font = { name: "Arial", size: 10, color: { argb: COLORS.textDark } }

  sheetSummary.getCell("A4").value = "Tanggal Ekspor:"
  sheetSummary.getCell("A4").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textMuted } }
  sheetSummary.getCell("B4").value = formattedExportDate
  sheetSummary.getCell("B4").font = { name: "Arial", size: 10, italic: true, color: { argb: COLORS.textDark } }

  sheetSummary.getRow(5).height = 10

  // 2. Header Tabel Ringkasan (Baris 6)
  const summaryHeaders = [
    "No",
    "Kode Departemen",
    "Nama Departemen",
    "Total Anggota",
    "Sudah Dinilai",
    "Belum Dinilai",
    "Rata-rata Skor",
    "Status Kelengkapan",
  ]

  const headerRow1 = sheetSummary.getRow(6)
  headerRow1.height = 26
  summaryHeaders.forEach((text, idx) => {
    const cell = headerRow1.getCell(idx + 1)
    cell.value = text
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textWhite } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.emeraldHeader },
    }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.border = thinBorder
  })

  // 3. Isi Data Baris Ringkasan
  let totalMembersAll = 0
  let totalAssessedAll = 0
  let totalUnassessedAll = 0
  let sumWeightedScores = 0
  let totalAssessedWithScores = 0

  dataset.summaries.forEach((summary, index) => {
    const rowNum = 7 + index
    const row = sheetSummary.getRow(rowNum)
    row.height = 20

    const unassessedCount = Math.max(0, summary.total_members - summary.assessed_count)
    totalMembersAll += summary.total_members
    totalAssessedAll += summary.assessed_count
    totalUnassessedAll += unassessedCount

    if (summary.average_score !== null) {
      sumWeightedScores += summary.average_score * summary.assessed_count
      totalAssessedWithScores += summary.assessed_count
    }

    const isZebra = index % 2 === 1
    const rowBgColor = isZebra ? COLORS.zebraRow : "FFFFFFFF"

    const rowData: Array<{
      val: string | number
      align: "center" | "left" | "right"
      bold?: boolean
      numFmt?: string
      color?: string
    }> = [
      { val: index + 1, align: "center" },
      { val: summary.kode, align: "center", bold: true },
      { val: summary.nama, align: "left" },
      { val: summary.total_members, align: "right" },
      { val: summary.assessed_count, align: "right" },
      { val: unassessedCount, align: "right" },
      {
        val: summary.average_score !== null ? summary.average_score : "-",
        align: "right",
        bold: true,
        numFmt: summary.average_score !== null ? "0.00" : undefined,
      },
      {
        val: summary.is_incomplete ? "Belum Selesai" : "Lengkap",
        align: "center",
        bold: true,
        color: summary.is_incomplete ? "FFD97706" : "FF059669", // Orange / Emerald
      },
    ]

    rowData.forEach((item, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = item.val
      cell.font = {
        name: "Arial",
        size: 9.5,
        bold: item.bold,
        color: item.color ? { argb: item.color } : { argb: COLORS.textDark },
      }
      if (item.numFmt) {
        cell.numFmt = item.numFmt
      }
      cell.alignment = { vertical: "middle", horizontal: item.align }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      }
      cell.border = thinBorder
    })
  })

  // 4. Baris Total Keseluruhan
  const totalRowNum1 = 7 + dataset.summaries.length
  const totalRow1 = sheetSummary.getRow(totalRowNum1)
  totalRow1.height = 24

  const overallAvg =
    totalAssessedWithScores > 0
      ? Number((sumWeightedScores / totalAssessedWithScores).toFixed(2))
      : null

  sheetSummary.mergeCells(`A${totalRowNum1}:C${totalRowNum1}`)
  const totalLabelCell = totalRow1.getCell(1)
  totalLabelCell.value = "TOTAL KESELURUHAN"
  totalLabelCell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textDark } }
  totalLabelCell.alignment = { vertical: "middle", horizontal: "center" }

  const totalValues: Array<{ col: number; val: string | number; numFmt?: string }> = [
    { col: 4, val: totalMembersAll },
    { col: 5, val: totalAssessedAll },
    { col: 6, val: totalUnassessedAll },
    { col: 7, val: overallAvg !== null ? overallAvg : "-", numFmt: overallAvg !== null ? "0.00" : undefined },
    { col: 8, val: totalUnassessedAll === 0 ? "Lengkap" : "Sebagian Belum Selesai" },
  ]

  for (let c = 1; c <= 8; c++) {
    const cell = totalRow1.getCell(c)
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.totalRowFill },
    }
    cell.border = {
      top: { style: "medium", color: { argb: COLORS.borderDark } },
      bottom: { style: "double", color: { argb: COLORS.borderDark } },
      left: { style: "thin", color: { argb: COLORS.borderGray } },
      right: { style: "thin", color: { argb: COLORS.borderGray } },
    }
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textDark } }
  }

  totalValues.forEach((item) => {
    const cell = totalRow1.getCell(item.col)
    cell.value = item.val
    if (item.numFmt) cell.numFmt = item.numFmt
    cell.alignment = { vertical: "middle", horizontal: item.col <= 7 ? "right" : "center" }
  })

  // Lebar kolom Sheet 1
  sheetSummary.columns = [
    { width: 6 }, // No
    { width: 18 }, // Kode
    { width: 38 }, // Nama Departemen
    { width: 16 }, // Total Anggota
    { width: 16 }, // Sudah Dinilai
    { width: 16 }, // Belum Dinilai
    { width: 18 }, // Rata-rata Skor
    { width: 22 }, // Status
  ]

  // ===========================================================================
  // SHEET 2: DETAIL PER ANGGOTA
  // ===========================================================================
  const sheetDetail = workbook.addWorksheet("Detail Anggota", {
    views: [{ showGridLines: true }],
  })

  // 1. Judul Laporan Detail
  sheetDetail.getCell("A1").value = "DETAIL PENILAIAN ANGGOTA PER ASPEK"
  sheetDetail.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: COLORS.emeraldHeaderSub } }
  sheetDetail.getRow(1).height = 28

  sheetDetail.getCell("A2").value = "Periode:"
  sheetDetail.getCell("A2").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textMuted } }
  sheetDetail.getCell("B2").value = periodeName
  sheetDetail.getCell("B2").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textDark } }

  sheetDetail.getCell("A3").value = "Tanggal Ekspor:"
  sheetDetail.getCell("A3").font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textMuted } }
  sheetDetail.getCell("B3").value = formattedExportDate
  sheetDetail.getCell("B3").font = { name: "Arial", size: 10, italic: true, color: { argb: COLORS.textDark } }

  sheetDetail.getRow(4).height = 10

  // 2. Header Kolom Detail (Baris 5)
  const detailHeaders: string[] = [
    "No",
    "Departemen",
    "NIG",
    "Nama Anggota",
    "Jabatan",
    ...dataset.aspects.map((a) => a.nama),
    "Skor Rata-rata",
    "Kategori",
    "Status",
    "Tanggal Penilaian",
  ]

  const headerRow2 = sheetDetail.getRow(5)
  headerRow2.height = 28
  detailHeaders.forEach((text, idx) => {
    const cell = headerRow2.getCell(idx + 1)
    cell.value = text
    cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: COLORS.textWhite } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.emeraldHeader },
    }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.border = thinBorder
  })

  // 3. Isi Data Baris Anggota
  dataset.members.forEach((member, index) => {
    const rowNum = 6 + index
    const row = sheetDetail.getRow(rowNum)
    row.height = 20

    const isZebra = index % 2 === 1
    const rowBgColor = isZebra ? COLORS.zebraRow : "FFFFFFFF"

    const formattedTanggal = member.submitted_at
      ? formatDateJakarta(member.submitted_at)
      : "-"

    const baseRowCells: Array<{
      val: string | number
      align: "center" | "left" | "right"
      bold?: boolean
      numFmt?: string
    }> = [
      { val: index + 1, align: "center" },
      { val: member.department_nama, align: "left" },
      { val: member.member_nip || "-", align: "center" },
      { val: member.member_nama, align: "left", bold: true },
      { val: member.member_jabatan, align: "left" },
    ]

    // Skor aspek
    dataset.aspects.forEach((aspect) => {
      const score = member.aspect_scores[aspect.id]
      baseRowCells.push({
        val: score !== null && score !== undefined ? score : "-",
        align: "center",
      })
    })

    // Skor Rata-rata, Kategori, Status, Tanggal
    baseRowCells.push(
      {
        val: member.skor_rata !== null ? member.skor_rata : "-",
        align: "center",
        bold: true,
        numFmt: member.skor_rata !== null ? "0.00" : undefined,
      },
      {
        val: member.kategori,
        align: "center",
        bold: member.kategori !== "Belum Dinilai",
      },
      {
        val: member.statusLabel,
        align: "center",
      },
      {
        val: formattedTanggal,
        align: "center",
      }
    )

    baseRowCells.forEach((item, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = item.val
      cell.font = {
        name: "Arial",
        size: 9,
        bold: item.bold,
        color: { argb: COLORS.textDark },
      }
      if (item.numFmt) {
        cell.numFmt = item.numFmt
      }
      cell.alignment = { vertical: "middle", horizontal: item.align }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      }
      cell.border = thinBorder
    })
  })

  // Lebar kolom Sheet 2 (Detail)
  const detailColWidths = [
    { width: 6 }, // No
    { width: 28 }, // Departemen
    { width: 16 }, // NIG
    { width: 30 }, // Nama
    { width: 22 }, // Jabatan
    ...dataset.aspects.map(() => ({ width: 16 })), // Tiap Aspek
    { width: 16 }, // Skor Rata-rata
    { width: 18 }, // Kategori
    { width: 16 }, // Status
    { width: 18 }, // Tanggal Penilaian
  ]
  sheetDetail.columns = detailColWidths

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
