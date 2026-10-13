import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserRole } from "@/types/database"
import {
  Users,
  ClipboardCheck,
  Building2,
  CalendarDays,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role")
    .eq("id", user?.id || "")
    .single()

  const role: UserRole = profile?.role || "user"
  const nama = profile?.nama || "Pengguna"

  // Ambil data statistik ringkas
  let departmentInfo = null
  let memberCount = 0
  let departmentCount = 0

  if (role === "user") {
    const { data: dept } = await supabase
      .from("departments")
      .select("id, nama, kode")
      .eq("ketua_id", user?.id || "")
      .single()
    departmentInfo = dept

    if (dept) {
      const { count } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("department_id", dept.id)
        .is("deleted_at", null)
      memberCount = count || 0
    }
  } else {
    const { count: deptCount } = await supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
    departmentCount = deptCount || 0

    const { count: memCount } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
    memberCount = memCount || 0
  }

  // Ambil periode penilaian aktif
  const { data: activePeriod } = await supabase
    .from("assessment_periods")
    .select("nama, status")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-xl border border-border bg-gradient-to-r from-card to-muted/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Selamat Datang, {nama}
              </h1>
              <Badge variant="outline" className="text-xs bg-card">
                {role === "super_admin" && "Super-Admin"}
                {role === "admin" && "Admin SDM"}
                {role === "user" && "Ketua Departemen"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "user" && departmentInfo
                ? `Mengelola penilaian untuk ${departmentInfo.nama}`
                : "Portal monitoring dan standarisasi kinerja departemen Tazakka"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={role === "user" ? "/penilaian" : "/rekap"}>
              <Button variant="default" className="gap-2">
                <span>{role === "user" ? "Mulai Penilaian" : "Lihat Rekap"}</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Anggota / Departemen */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {role === "user" ? "Anggota Departemen" : "Total Departemen Aktif"}
            </CardTitle>
            {role === "user" ? (
              <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {role === "user" ? memberCount : departmentCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {role === "user"
                ? "Orang yang perlu dinilai di periode ini"
                : "14 departemen terdaftar dalam sistem"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Periode Penilaian */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Periode Penilaian
            </CardTitle>
            <CalendarDays className="size-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate text-foreground">
              {activePeriod?.nama || "Tidak ada periode aktif"}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-xs text-muted-foreground">Status: Terbuka (Open)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Metrik Kinerja */}
        <Card className="border-border shadow-xs sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Kinerja
            </CardTitle>
            <TrendingUp className="size-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">Likert 1–5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Standar 7 Aspek Kinerja, Ibadah, dan Akhlak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manajemen Anggota</CardTitle>
            <CardDescription>
              {role === "user"
                ? "Perbarui daftar nama, NIP, dan jabatan anggota departemen Anda"
                : "Pantau daftar anggota di seluruh 14 departemen"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/anggota">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Buka Data Anggota</span>
                <Users className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lembar Penilaian</CardTitle>
            <CardDescription>
              {role === "user"
                ? "Isi formulir penilaian 7 aspek untuk setiap anggota"
                : "Tinjau rekapitulasi capaian dan berikan approval atau revisi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={role === "user" ? "/penilaian" : "/rekap"}>
              <Button variant="secondary" size="sm" className="w-full justify-between">
                <span>{role === "user" ? "Buka Form Penilaian" : "Buka Rekapitulasi"}</span>
                <ClipboardCheck className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
