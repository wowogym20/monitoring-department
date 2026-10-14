import ExcelJS from "exceljs"
import { MemberListItem } from "@/lib/actions/member"

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
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.borderGray } },
  left: { style: "thin", color: { argb: COLORS.borderGray } },
  bottom: { style: "thin", color: { argb: COLORS.borderGray } },
  right: { style: "thin", color: { argb: COLORS.borderGray } },
}

/**
 * Menghasilkan file Excel untuk daftar anggota terpilih dan memicu download di browser.
 */
export async function exportSelectedMembersToExcel(
  members: MemberListItem[],
  fileName = "daftar-anggota-terpilih.xlsx"
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Monitoring Departemen Tazakka"
  workbook.lastModifiedBy = "Monitoring Departemen Tazakka"
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet("Data Anggota", {
    views: [{ showGridLines: true }],
  })

  // 1. Header Judul
  worksheet.mergeCells("A1:G1")
  const titleCell = worksheet.getCell("A1")
  titleCell.value = "DAFTAR ANGGOTA DEPARTEMEN — PONDOK MODERN TAZAKKA"
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: COLORS.emeraldHeaderSub } }
  titleCell.alignment = { vertical: "middle", horizontal: "left" }
  worksheet.getRow(1).height = 26

  worksheet.getCell("A2").value = `Total Data: ${members.length} Anggota | Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID")}`
  worksheet.getCell("A2").font = { name: "Arial", size: 9, italic: true, color: { argb: COLORS.textMuted } }
  worksheet.getRow(2).height = 18

  // 2. Definisi Kolom Tabel
  worksheet.columns = [
    { key: "no", width: 6 },
    { key: "nip", width: 18 },
    { key: "nama", width: 32 },
    { key: "departemen", width: 22 },
    { key: "jabatan", width: 24 },
    { key: "no_hp", width: 18 },
    { key: "status", width: 14 },
  ]

  // 3. Header Baris Tabel (Row 4)
  const headerRow = worksheet.getRow(4)
  headerRow.height = 24
  const headers = ["No", "NIG", "Nama Lengkap", "Departemen", "Jabatan", "No. HP", "Status"]

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
      horizontal: idx === 0 || idx === 6 ? "center" : "left",
    }
    cell.border = thinBorder
  })

  // 4. Baris Data
  members.forEach((member, i) => {
    const rowIndex = i + 5
    const row = worksheet.getRow(rowIndex)
    row.height = 20

    const rowData = [
      i + 1,
      member.nip || "-",
      member.nama,
      `${member.department_nama} (${member.department_kode})`,
      member.jabatan,
      member.no_hp || "-",
      member.is_active ? "Aktif" : "Nonaktif",
    ]

    rowData.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = val
      cell.font = { name: "Arial", size: 10, color: { argb: COLORS.textDark } }
      cell.border = thinBorder
      cell.alignment = {
        vertical: "middle",
        horizontal: colIdx === 0 || colIdx === 6 ? "center" : "left",
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

  // 5. Unduh via Blob di Browser
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
