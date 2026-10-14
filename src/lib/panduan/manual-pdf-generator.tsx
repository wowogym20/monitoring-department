import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"
import { ManualRole, MANUAL_CONFIGS } from "./manual-pdf-types"
import { formatDateJakarta } from "@/lib/date"

// Skema Warna Resmi: Emerald & Amber Sesuai PRD
const EMERALD_PRIMARY = "#059669"
const EMERALD_DARK = "#047857"
const EMERALD_LIGHT = "#ecfdf5"
const AMBER_PRIMARY = "#d97706"
const AMBER_LIGHT = "#fef3c7"
const SLATE_DARK = "#0f172a"
const SLATE_MUTED = "#64748b"
const BORDER_COLOR = "#cbd5e1"
const ZEBRA_BG = "#f8fafc"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
    color: SLATE_DARK,
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
  },
  // Kop Dokumen Resmi
  kopWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: EMERALD_PRIMARY,
    paddingBottom: 8,
    marginBottom: 12,
  },
  kopInstitution: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: EMERALD_DARK,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  kopSub: {
    fontSize: 8,
    color: SLATE_MUTED,
    marginTop: 2,
  },
  // Header Banner Buku Panduan
  banner: {
    backgroundColor: EMERALD_PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  bannerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    fontSize: 8.5,
    color: "#d1fae5",
    marginTop: 3,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: ZEBRA_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: SLATE_MUTED,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: SLATE_DARK,
    marginTop: 2,
  },
  // Heading & Subheading
  sectionHeader: {
    backgroundColor: EMERALD_LIGHT,
    borderLeftWidth: 4,
    borderLeftColor: EMERALD_PRIMARY,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: EMERALD_DARK,
  },
  subSectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: SLATE_DARK,
    marginTop: 6,
    marginBottom: 3,
  },
  paragraph: {
    fontSize: 8.5,
    color: SLATE_DARK,
    marginBottom: 5,
    textAlign: "justify",
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 6,
  },
  bulletDot: {
    width: 10,
    fontSize: 8.5,
    color: EMERALD_PRIMARY,
    fontFamily: "Helvetica-Bold",
  },
  bulletContent: {
    flex: 1,
    fontSize: 8.5,
  },
  // Callout Box
  calloutImportant: {
    backgroundColor: AMBER_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: AMBER_PRIMARY,
    padding: 7,
    borderRadius: 3,
    marginVertical: 6,
  },
  calloutTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#92400e",
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 8,
    color: "#78350f",
  },
  // Table Styling
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3,
    marginVertical: 6,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: EMERALD_PRIMARY,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowZebra: {
    backgroundColor: ZEBRA_BG,
  },
  tableCellText: {
    fontSize: 7.5,
    color: SLATE_DARK,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 14,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: SLATE_MUTED,
  },
})

// Komponen Kop Dokumen
const KopHeader = () => (
  <View style={styles.kopWrapper} fixed>
    <Text style={styles.kopInstitution}>PONDOK MODERN TAZAKKA</Text>
    <Text style={styles.kopSub}>
      Sistem Informasi Monitoring & Evaluasi Kinerja 14 Departemen — Dokumen Resmi Panduan Operasional
    </Text>
  </View>
)

// Komponen Footer Dokumen Berpenomoran Halaman
const PageFooter = ({ roleText }: { roleText: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      Monitoring Departemen • {roleText} • Dicetak: {formatDateJakarta(new Date())}
    </Text>
    <Text
      style={styles.footerText}
      render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
    />
  </View>
)

// Bagian Bab 1: Gambaran Sistem & Prinsip Umum
const SectionOverview = () => (
  <View>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>1. GAMBARAN UMUM SISTEM & URGENSI</Text>
    </View>
    <Text style={styles.paragraph}>
      Aplikasi Monitoring Departemen adalah platform web internal Pondok Modern Tazakka yang menyatukan proses evaluasi berkala kinerja anggota tim di seluruh 14 departemen. Sistem ini menggantikan format formulir manual yang sebelumnya tersebar dan tidak seragam menjadi satu standar evaluasi Likert 1–5 terpusat.
    </Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Standardisasi Aspek:</Text> Seluruh anggota dinilai menggunakan 7 dimensi objektif dengan deskripsi terukur.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Isolasi Data Ketat:</Text> Setiap Ketua Departemen hanya dapat melihat dan menilai anggota departemennya sendiri.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Kerahasiaan Anggota:</Text> Anggota tim tidak memiliki akun login dan tidak dapat mengakses skor evaluasi.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Efisiensi SDM:</Text> Waktu rekapitulasi 14 departemen dipersingkat dari hitungan hari menjadi hitungan menit.
      </Text>
    </View>

    {/* Tabel 7 Aspek Terstandar */}
    <View style={styles.subSectionTitle}>
      <Text style={{ fontFamily: "Helvetica-Bold" }}>Daftar 7 Aspek Penilaian Terstandar</Text>
    </View>
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, { width: "18%" }]}>Aspek</Text>
        <Text style={[styles.tableHeaderText, { width: "12%" }]}>Bobot</Text>
        <Text style={[styles.tableHeaderText, { width: "70%" }]}>Deskripsi & Indikator Penilaian</Text>
      </View>
      {[
        { name: "Kinerja Kerja", weight: "15%", desc: "Kualitas hasil amanah, ketepatan waktu penyelesaian tugas, dan target kerja." },
        { name: "Kerajinan", weight: "15%", desc: "Kedisiplinan kehadiran, ketepatan waktu bertugas, dan konsistensi kerja." },
        { name: "Ibadah", weight: "15%", desc: "Komitmen shalat berjamaah, tilawah, dan rutinitas ibadah harian di pondok." },
        { name: "Kebersihan", weight: "15%", desc: "Kepedulian terhadap kerapian diri, tempat tinggal, dan area lingkungan kerja." },
        { name: "Kerja Sama Tim", weight: "15%", desc: "Kemampuan kolaborasi antar rekan, komunikasi sopan, dan saling membantu." },
        { name: "Inisiatif", weight: "15%", desc: "Proaktif mencari solusi masalah, tanggap tugas, dan tanggung jawab amanah." },
        { name: "Akhlak & Adab", weight: "10%", desc: "Keteladanan adab terhadap pimpinan, sesama rekan guru, santri, dan tamu." },
      ].map((asp, idx) => (
        <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
          <Text style={[styles.tableCellText, { width: "18%", fontFamily: "Helvetica-Bold" }]}>{asp.name}</Text>
          <Text style={[styles.tableCellText, { width: "12%" }]}>{asp.weight}</Text>
          <Text style={[styles.tableCellText, { width: "70%" }]}>{asp.desc}</Text>
        </View>
      ))}
    </View>
  </View>
)

// Bagian Bab 2: Panduan Ketua Departemen
const SectionUserGuide = () => (
  <View>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>PANDUAN OPERASIONAL: KETUA DEPARTEMEN (USER)</Text>
    </View>
    <Text style={styles.paragraph}>
      Sebagai Ketua Departemen, amanah utama Anda adalah memelihara daftar anggota departemen dan memberikan penilaian berkala secara adil, objektif, dan tepat waktu pada setiap periode aktif.
    </Text>

    <Text style={styles.subSectionTitle}>A. Manajemen Anggota Departemen (/anggota)</Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>1.</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Menambah Anggota Baru:</Text> Buka menu Data Anggota, klik tombol Tambah Anggota, masukkan Nama Lengkap, NIP/ID Internal, Jabatan/Amanah, dan Nomor WhatsApp.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>2.</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Memperbarui & Menonaktifkan:</Text> Klik ikon pensil untuk mengubah data. Jika anggota mutasi atau purna tugas, ubah status menjadi Nonaktif (riwayat nilai masa lalu tetap aman tersimpan).
      </Text>
    </View>

    <Text style={styles.subSectionTitle}>B. Mengisi Lembar Penilaian Anggota (/penilaian)</Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>1.</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Skala Likert 1–5:</Text> Berikan nilai untuk masing-masing 7 aspek (1: Sangat Kurang, 2: Kurang, 3: Cukup, 4: Baik, 5: Sangat Baik).
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>2.</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Catatan Evaluasi:</Text> Tuliskan catatan apresiasi atau saran pengembangan anggota.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>3.</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Simpan Draf vs Submit:</Text> Gunakan Simpan sebagai Draf bila ingin melanjutkannya nanti. Klik Submit Penilaian apabila seluruh aspek telah dinilai lengkap dan siap diverifikasi oleh SDM.
      </Text>
    </View>

    <View style={styles.calloutImportant}>
      <Text style={styles.calloutTitle}>ATURAN PENTING: AUTO-RESUBMIT JIKA EDIT PENILAIAN</Text>
      <Text style={styles.calloutText}>
        Apabila Anda menyunting skor penilaian yang statusnya telah Disetujui (Approved) oleh SDM, sistem secara otomatis akan mengembalikan statusnya menjadi Submitted agar SDM memverifikasi ulang perubahannya.
      </Text>
    </View>

    <Text style={styles.subSectionTitle}>C. Membaca Masukan & Komentar SDM</Text>
    <Text style={styles.paragraph}>
      Jika Admin SDM meminta revisi (Revision Requested), buka detail penilaian dan tinjau kolom komentar di bagian bawah lembar penilaian. Anda dapat mengetik balasan dan memperbarui skor yang diminta.
    </Text>
  </View>
)

// Bagian Bab 3: Panduan Admin SDM
const SectionAdminGuide = () => (
  <View>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>PANDUAN OPERASIONAL: ADMIN SDM (ADMIN)</Text>
    </View>
    <Text style={styles.paragraph}>
      Admin SDM bertindak sebagai verifikator terpusat kelengkapan evaluasi 14 departemen, mengelola impor data massal, memvalidasi objektivitas nilai, memberikan komentar umpan balik, dan mengekspor laporan resmi.
    </Text>

    <Text style={styles.subSectionTitle}>A. Monitoring Rekapitulasi 14 Departemen (/rekap)</Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Indikator Kelengkapan:</Text> Pantau persentase pengisian anggota dan daftar departemen yang belum selesai menilai (Pending).
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Filter Pencarian Cepat:</Text> Filter berdasarkan Departemen, Periode, Status (Draft, Submitted, Revision Requested, Approved), dan kolom pencarian nama/NIP.
      </Text>
    </View>

    <Text style={styles.subSectionTitle}>B. Verifikasi & Approval Penilaian</Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>1.</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Pemeriksaan Detail:</Text> Buka lembar penilaian anggota untuk memeriksa kesesuaian skor dan catatan evaluasi ketua.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>2.</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Tindakan Approval:</Text> Klik Setujui (Approve) jika nilai wajar. Klik Minta Revisi jika terdapat ketidakwajaran dan sertakan alasan pada kolom komentar.
      </Text>
    </View>

    <Text style={styles.subSectionTitle}>C. Impor Massal & Ekspor Laporan (/ekspor)</Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Impor Excel/CSV:</Text> Unggah data anggota ratusan orang sekaligus menggunakan template resmi berspesifikasi kolom kode_departemen, nama, nip, jabatan, no_hp.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Ekspor Laporan Excel (.xlsx):</Text> Lembar kerja komprehensif berisi seluruh rincian nilai, status, dan formula rekapitulasi.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Ekspor Laporan PDF (.pdf):</Text> Dokumen cetak arsip formal bertanda tangan digital siap dipresentasikan ke Pimpinan.
      </Text>
    </View>
  </View>
)

// Bagian Bab 4: Panduan Super Admin
const SectionSuperAdminGuide = () => (
  <View>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>PANDUAN OPERASIONAL: PIMPINAN / SUPER-ADMIN</Text>
    </View>
    <Text style={styles.paragraph}>
      Sebagai Pimpinan Lembaga (Super-Admin), Anda memiliki wewenang penuh atas konfigurasi sistem, penetapan amanah ketua departemen, kalender periode penilaian, pembobotan aspek, dan pengawasan jejak audit.
    </Text>

    <Text style={styles.subSectionTitle}>A. Eksekutif Dashboard Lembaga (/dashboard)</Text>
    <Text style={styles.paragraph}>
      Memantau grafik radar agregat 7 aspek seluruh lembaga, distribusi predikat kinerja (Sangat Baik, Baik, Cukup, Kurang, Sangat Kurang), serta status kelulusan evaluasi per departemen secara real-time.
    </Text>

    <Text style={styles.subSectionTitle}>B. Tata Kelola 14 Departemen & Penetapan Ketua (/departemen & /ketua)</Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Penetapan & Rotasi Ketua:</Text> Tetapkan atau ganti ketua departemen dari daftar akun pengguna. Data penilaian historis tetap utuh melekat pada departemen.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Manajemen Akun:</Text> Pembuatan akun ketua baru, reset sandi, dan penonaktifan akun purnatugas. (Tidak tersedia registrasi mandiri publik).
      </Text>
    </View>

    <Text style={styles.subSectionTitle}>C. Periode Penilaian & Jejak Audit (/periode & /audit)</Text>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Siklus Periode:</Text> Buat periode baru, tetapkan tanggal mulai dan tenggat waktu. Kunci periode ke status Closed untuk membekukan data nilai.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Jejak Audit Log:</Text> Mengawasi rekam jejak setiap mutasi data (siapa yang mengubah, kapan, nilai lama, nilai baru).
      </Text>
    </View>
  </View>
)

// Bagian FAQ
const SectionFaq = () => (
  <View>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>TANYA JAWAB UMUM & BANTUAN TEKNIS (FAQ)</Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>Q:</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Apakah anggota departemen dapat login ke aplikasi ini?</Text>
        {"\n"}Tidak. Anggota departemen tidak memiliki akun. Sistem ini murni alat kerja ketua, SDM, dan pimpinan untuk menjaga kerahasiaan dan objektivitas evaluasi.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>Q:</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Apakah aplikasi ini dapat digunakan langsung dari smartphone (HP)?</Text>
        {"\n"}Ya. Antarmuka aplikasi telah dioptimalkan secara mobile-first dan nyaman digunakan dari layar HP mulai lebar 360 px.
      </Text>
    </View>
    <View style={styles.bulletItem}>
      <Text style={styles.bulletDot}>Q:</Text>
      <Text style={styles.bulletContent}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Bagaimana jika lupa kata sandi atau akun terkendala?</Text>
        {"\n"}Silakan hubungi Tim TI atau Admin SDM melalui email ti@tazakka.or.id atau admin.sdm@tazakka.or.id untuk reset kata sandi resmi.
      </Text>
    </View>
  </View>
)

// Komponen Utama Dokumen PDF
interface ManualDocumentProps {
  role: ManualRole
}

export const ManualDocument: React.FC<ManualDocumentProps> = ({ role }) => {
  const config = MANUAL_CONFIGS[role]

  return (
    <Document title={config.title} author={config.institution} subject={config.subtitle}>
      <Page size="A4" style={styles.page}>
        <KopHeader />

        {/* Banner Judul */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{config.title.toUpperCase()}</Text>
          <Text style={styles.bannerSubtitle}>{config.subtitle}</Text>
        </View>

        {/* Kotak Informasi Dokumen */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Sasaran Pembaca</Text>
            <Text style={styles.metaValue}>{config.targetAudience}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Versi Dokumen</Text>
            <Text style={styles.metaValue}>{config.version}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Penerbit</Text>
            <Text style={styles.metaValue}>Pondok Modern Tazakka</Text>
          </View>
        </View>

        {/* Konten Sesuai Varian Role */}
        {role === "all" && (
          <View>
            <SectionOverview />
            <SectionUserGuide />
            <SectionAdminGuide />
            <SectionSuperAdminGuide />
            <SectionFaq />
          </View>
        )}

        {role === "user" && (
          <View>
            <SectionOverview />
            <SectionUserGuide />
            <SectionFaq />
          </View>
        )}

        {role === "admin" && (
          <View>
            <SectionOverview />
            <SectionAdminGuide />
            <SectionFaq />
          </View>
        )}

        {role === "super_admin" && (
          <View>
            <SectionOverview />
            <SectionSuperAdminGuide />
            <SectionAdminGuide />
            <SectionFaq />
          </View>
        )}

        <PageFooter roleText={config.title} />
      </Page>
    </Document>
  )
}

/**
 * Menghasilkan Buffer PDF biner siap kirim ke browser
 */
export async function generateManualPdfBuffer(role: ManualRole): Promise<Buffer> {
  const doc = <ManualDocument role={role} />
  const buffer = await renderToBuffer(doc)
  return Buffer.from(buffer)
}
