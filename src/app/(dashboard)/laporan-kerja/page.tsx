import { Metadata } from "next"
import { requireRole } from "@/lib/auth"
import { getLaporanKerjaServer } from "@/lib/actions/laporan-kerja"
import { LaporanKerjaClient } from "./components/laporan-kerja-client"

export const metadata: Metadata = {
  title: "Laporan Kerja Anggota | Monitoring Departemen",
  description: "Pusat rekapitulasi dan pemantauan laporan kerja harian anggota departemen terintegrasi.",
}

export default async function LaporanKerjaPage() {
  // Akses terbuka untuk seluruh role resmi terautentikasi (read-only)
  const currentUser = await requireRole("super_admin", "admin", "user")

  // Ambil data laporan kerja dari API Tazakka via Server Action ber-cache
  const initialData = await getLaporanKerjaServer()

  return (
    <LaporanKerjaClient
      initialData={initialData}
      userRole={currentUser.role}
      departmentName={currentUser.department?.nama || null}
    />
  )
}
