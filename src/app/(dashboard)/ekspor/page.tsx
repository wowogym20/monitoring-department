import { requireRole } from "@/lib/auth"
import { EXPORT_ROLES } from "@/lib/validations/export"
import { createClient } from "@/lib/supabase/server"
import { AssessmentPeriod } from "@/types/database"
import { EksporClient } from "./ekspor-client"
import { FileSpreadsheet } from "lucide-react"

export default async function EksporPage() {
  // Hanya super_admin dan admin yang berhak mengakses (konstanta izin EXPORT_ROLES)
  await requireRole(...EXPORT_ROLES)

  const supabase = await createClient()

  // Ambil daftar periode penilaian
  const { data: periodsData } = await supabase
    .from("assessment_periods")
    .select("*")
    .order("tanggal_mulai", { ascending: false })

  const periods: AssessmentPeriod[] = periodsData || []

  // Ambil daftar departemen aktif
  const { data: deptData } = await supabase
    .from("departments")
    .select("id, nama, kode")
    .eq("is_active", true)
    .order("nama", { ascending: true })

  const departments = deptData || []

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
          <FileSpreadsheet className="size-7 text-primary shrink-0" />
          Ekspor Laporan Penilaian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unduh laporan rekapitulasi kinerja departemen dalam format lembar kerja Excel (.xlsx) dan dokumen cetak PDF (.pdf).
        </p>
      </div>

      {/* Komponen Interaktif Ekspor */}
      <EksporClient periods={periods} departments={departments} />
    </div>
  )
}
