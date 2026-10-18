import ExcelJS from "exceljs"
import type { LaporanKerjaItem } from "@/lib/actions/laporan-kerja"

/**
 * Palet warna tema emerald Tazakka
 */
const COLORS = {
  emeraldHeader: "FF059669", // Emerald 600
  emeraldHeaderSub: "FF047857", // Emerald 700
  zebraRow: "FFF8FAFC", // Slate 50
  borderGray: "FFD1D5DB", // Gray 300
  textWhite: "FFFFFFFF",
  textDark: "FF1E293B",
  textMuted: "FF64748B",
  statusY: "FF10B981", // Emerald 500
  statusN: "FFF43F5E", // Rose 500
  statusPending: "FFF59E0B", // Amber 500
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.borderGray } },
  left: { style: "thin", color: { argb: COLORS.borderGray } },
  bottom: { style: "thin", color: { argb: COLORS.borderGray } },
  right: { style: "thin", color: { argb: COLORS.borderGray } },
}

/**
 * Menghasilkan file Excel untuk daftar laporan kerja terpilih dan memicu download di browser.
 */
export async function exportSelectedLaporanKerjaToExcel(
  items: LaporanKerjaItem[],
  fileName = "laporan-kerja-terpilih.xlsx"
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Monitoring Departemen Tazakka"
  workbook.lastModifiedBy = "Monitoring Departemen Tazakka"
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet("Laporan Kerja", {
    views: [{ showGridLines: true }],
  })

  // 1. Header Judul
  worksheet.mergeCells("A1:I1")
  const titleCell = worksheet.getCell("A1")
  titleCell.value = "REKAP LAPORAN KERJA PEGAWAI — PONDOK MODERN TAZAKKA"
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: COLORS.emeraldHeaderSub } }
  titleCell.alignment = { vertical: "middle", horizontal: "left" }
  worksheet.getRow(1).height = 26

  worksheet.getCell("A2").value = `Total Data: ${items.length} Laporan | Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`
  worksheet.getCell("A2").font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.textMuted } }
  worksheet.getRow(2).height = 18

  // 2. Definisi Kolom Tabel
  worksheet.columns = [
    { key: "no", width: 6 },
    { key: "tanggal", width: 14 },
    { key: "jam", width: 12 },
    { key: "nip", width: 16 },
    { key: "nama", width: 28 },
    { key: "judul", width: 30 },
    { key: "keterangan", width: 40 },
    { key: "status", width: 14 },
    { key: "foto_url", width: 35 },
  ]

  // 3. Header Baris Tabel (Row 4)
  const headerRow = worksheet.getRow(4)
  headerRow.height = 24
  const headers = [
    "No",
    "Tanggal",
    "Jam (WIB)",
    "NIP / NIG",
    "Nama Pegawai",
    "Judul Laporan",
    "Keterangan / Uraian",
    "Status",
    "Tautan Foto",
  ]

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = h
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.emeraldHeader },
    }
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLORS.textWhite } }
    cell.alignment = {
      vertical: "middle",
      horizontal: idx === 0 || idx === 1 || idx === 2 || idx === 7 ? "center" : "left",
    }
    cell.border = thinBorder
  })

  // 4. Baris Data
  items.forEach((item, i) => {
    const rowIndex = i + 5
    const row = worksheet.getRow(rowIndex)
    row.height = 22

    const statusLabel =
      item.status === "Y"
        ? "Disetujui"
        : item.status === "N"
          ? "Ditolak"
          : "Pending"

    const rowData = [
      i + 1,
      item.tanggal || "-",
      item.jam || "-",
      item.nip || "-",
      item.nama_pegawai || "-",
      item.judul || "-",
      item.keterangan || "-",
      statusLabel,
      item.foto_url || "-",
    ]

    rowData.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = val
      cell.font = { name: "Arial", size: 9, color: { argb: COLORS.textDark } }
      cell.border = thinBorder
      cell.alignment = {
        vertical: "middle",
        horizontal:
          colIdx === 0 || colIdx === 1 || colIdx === 2 || colIdx === 7
            ? "center"
            : "left",
        wrapText: colIdx === 5 || colIdx === 6,
      }

      if (i % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORS.zebraRow },
        }
      }
    })
  })

  // 5. Unduh via Blob di Browser jika di client-side
  if (typeof window !== "undefined") {
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    window.URL.revokeObjectURL(url)
  }
}
