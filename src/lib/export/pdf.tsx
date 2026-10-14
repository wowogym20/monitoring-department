import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"
import { ExportDataset, ExportDepartmentGroup, ExportMemberItem } from "./types"
import { formatDateJakarta } from "@/lib/date"

// Skema warna Emerald & Netral
const EMERALD_PRIMARY = "#059669"
const EMERALD_DARK = "#047857"
const EMERALD_LIGHT = "#ecfdf5"
const SLATE_DARK = "#0f172a"
const SLATE_MUTED = "#64748b"
const BORDER_COLOR = "#cbd5e1"
const ZEBRA_BG = "#f8fafc"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    color: SLATE_DARK,
    backgroundColor: "#ffffff",
  },
  // Header Dokumen per Departemen
  headerBanner: {
    backgroundColor: EMERALD_PRIMARY,
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerSubtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#d1fae5",
  },
  // Kotak Ringkasan Departemen
  deptHeaderBar: {
    backgroundColor: EMERALD_LIGHT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deptTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: EMERALD_DARK,
  },
  deptPills: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    fontSize: 7.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    borderWidth: 0.5,
    borderColor: BORDER_COLOR,
  },
  pillBold: {
    fontFamily: "Helvetica-Bold",
    color: EMERALD_DARK,
  },
  // Tabel
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3,
    overflow: "hidden",
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: EMERALD_PRIMARY,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  tableRowZebra: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    alignItems: "center",
    backgroundColor: ZEBRA_BG,
  },
  // Header Columns (flattened)
  thNo: { width: "4%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "center" },
  thNama: { width: "19%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "left" },
  thNip: { width: "11%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "center" },
  thJabatan: { width: "13%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "left" },
  thAspect: { width: "6%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "center" },
  thRata: { width: "7%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "center" },
  thKategori: { width: "9%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "center" },
  thStatus: { width: "8%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "center" },
  thTanggal: { width: "9%", fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#ffffff", textAlign: "center" },

  // Data Columns (flattened)
  tdNo: { width: "4%", fontSize: 7.5, textAlign: "center" },
  tdNama: { width: "19%", fontSize: 7.5, textAlign: "left" },
  tdNip: { width: "11%", fontSize: 7.5, textAlign: "center" },
  tdJabatan: { width: "13%", fontSize: 7.5, textAlign: "left" },
  tdAspect: { width: "6%", fontSize: 7.5, textAlign: "center" },
  tdRata: { width: "7%", fontFamily: "Helvetica-Bold", fontSize: 7.5, textAlign: "center" },
  tdKategori: { width: "9%", fontSize: 7.5, textAlign: "center" },
  tdStatus: { width: "8%", fontSize: 7.5, textAlign: "center" },
  tdTanggal: { width: "9%", fontSize: 7.5, textAlign: "center" },

  // Footer Departemen
  deptFooter: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    marginTop: 8,
    borderRadius: 3,
  },
  deptFooterText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: SLATE_DARK,
  },

  // Footer Halaman
  pageFooter: {
    position: "absolute",
    bottom: 12,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
  },
  footerText: {
    fontSize: 7,
    color: SLATE_MUTED,
  },
})

interface RekapPdfDocumentProps {
  dataset: ExportDataset
}

export function RekapPdfDocument({ dataset }: RekapPdfDocumentProps) {
  const formattedPrintDate = formatDateJakarta(dataset.exportedAt)
  const periodeName = dataset.period.nama
  const displayedAspects = dataset.aspects.slice(0, 7)

  return (
    <Document title={`Rekap Penilaian - ${periodeName}`} author="Monitoring Departemen Tazakka">
      {dataset.departmentGroups.map((group: ExportDepartmentGroup) => {
        const { department, summary, members } = group
        const avgDisplay =
          summary.average_score !== null ? summary.average_score.toFixed(2) : "-"

        return (
          <Page key={department.id} size="A4" orientation="landscape" style={styles.page}>
            {/* Banner Header Emerald */}
            <View style={styles.headerBanner} fixed>
              <Text style={styles.headerTitle}>MONITORING DEPARTEMEN — REKAPITULASI PENILAIAN KINERJA</Text>
              <View style={styles.headerSubtitleRow}>
                <Text style={styles.headerSubtitle}>
                  Periode: {periodeName}  •  Departemen: [{department.kode}] {department.nama}
                </Text>
                <Text style={styles.headerSubtitle}>Tanggal Cetak: {formattedPrintDate}</Text>
              </View>
            </View>

            {/* Header Kotak Departemen */}
            <View style={styles.deptHeaderBar} wrap={false}>
              <Text style={styles.deptTitle}>
                [{department.kode}] {department.nama}
              </Text>
              <View style={styles.deptPills}>
                <Text style={styles.pill}>
                  Total Anggota: <Text style={styles.pillBold}>{summary.total_members}</Text>
                </Text>
                <Text style={styles.pill}>
                  Sudah Dinilai: <Text style={styles.pillBold}>{summary.assessed_count}</Text>
                </Text>
                <Text style={styles.pill}>
                  Rata-rata: <Text style={styles.pillBold}>{avgDisplay}</Text>
                </Text>
                <Text style={styles.pill}>
                  Status: <Text style={styles.pillBold}>{summary.is_incomplete ? "Belum Selesai" : "Lengkap"}</Text>
                </Text>
              </View>
            </View>

            {/* Tabel Anggota Departemen */}
            <View style={styles.table}>
              {/* Header Tabel */}
              <View style={styles.tableRowHeader} wrap={false}>
                <Text style={styles.thNo}>No</Text>
                <Text style={styles.thNama}>Nama Anggota</Text>
                <Text style={styles.thNip}>NIP / ID</Text>
                <Text style={styles.thJabatan}>Jabatan</Text>
                {displayedAspects.map((aspect) => (
                  <Text key={aspect.id} style={styles.thAspect}>
                    {aspect.nama.length > 8 ? aspect.nama.slice(0, 8) + "." : aspect.nama}
                  </Text>
                ))}
                <Text style={styles.thRata}>Rata-rata</Text>
                <Text style={styles.thKategori}>Kategori</Text>
                <Text style={styles.thStatus}>Status</Text>
                <Text style={styles.thTanggal}>Tgl Nilai</Text>
              </View>

              {/* Baris Anggota */}
              {members.length === 0 ? (
                <View style={styles.tableRow} wrap={false}>
                  <Text style={{ fontSize: 7.5, color: SLATE_MUTED, paddingVertical: 4, width: "100%", textAlign: "center" }}>
                    Belum ada data anggota pada departemen ini.
                  </Text>
                </View>
              ) : (
                members.map((member: ExportMemberItem, mIdx: number) => {
                  const isZebra = mIdx % 2 === 1
                  const formattedDate = member.submitted_at
                    ? formatDateJakarta(member.submitted_at)
                    : "-"

                  return (
                    <View
                      key={member.member_id}
                      style={isZebra ? styles.tableRowZebra : styles.tableRow}
                      wrap={false}
                    >
                      <Text style={styles.tdNo}>{mIdx + 1}</Text>
                      <Text style={styles.tdNama}>{member.member_nama}</Text>
                      <Text style={styles.tdNip}>{member.member_nip || "-"}</Text>
                      <Text style={styles.tdJabatan}>{member.member_jabatan}</Text>

                      {/* Nilai Aspek */}
                      {displayedAspects.map((aspect) => {
                        const val = member.aspect_scores[aspect.id]
                        return (
                          <Text key={aspect.id} style={styles.tdAspect}>
                            {val !== null && val !== undefined ? val : "-"}
                          </Text>
                        )
                      })}

                      {/* Skor Rata, Kategori, Status, Tanggal */}
                      <Text style={styles.tdRata}>
                        {member.skor_rata !== null ? member.skor_rata.toFixed(2) : "-"}
                      </Text>
                      <Text style={styles.tdKategori}>
                        {member.kategori}
                      </Text>
                      <Text style={styles.tdStatus}>
                        {member.statusLabel}
                      </Text>
                      <Text style={styles.tdTanggal}>
                        {formattedDate}
                      </Text>
                    </View>
                  )
                })
              )}
            </View>

            {/* Footer Rekap Departemen */}
            <View style={styles.deptFooter} wrap={false}>
              <Text style={styles.deptFooterText}>
                Ringkasan: {summary.assessed_count} dari {summary.total_members} anggota telah dinilai.
              </Text>
              <Text style={styles.deptFooterText}>
                Rata-rata Departemen: {avgDisplay}
              </Text>
            </View>

            {/* Footer Halaman Bernomor */}
            <View style={styles.pageFooter} fixed>
              <Text style={styles.footerText}>
                Dokumen Resmi Internal — Monitoring Kinerja Departemen Tazakka
              </Text>
              <Text
                style={styles.footerText}
                render={({ pageNumber }) => `Halaman ${pageNumber}`}
              />
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

/**
 * Menghasilkan buffer PDF menggunakan @react-pdf/renderer di server
 */
export async function generatePdfBuffer(dataset: ExportDataset): Promise<Buffer> {
  const doc = <RekapPdfDocument dataset={dataset} />
  const buffer = await renderToBuffer(doc)
  return buffer
}
