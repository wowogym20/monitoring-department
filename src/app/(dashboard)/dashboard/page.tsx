import { requireRole } from "@/lib/auth"
import { getDashboardData } from "@/lib/actions/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import dynamic from "next/dynamic"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { ProgressCard } from "@/components/dashboard/progress-card"

const DeptScoreChart = dynamic(
  () => import("@/components/dashboard/dept-score-chart").then((mod) => mod.DeptScoreChart),
  {
    loading: () => (
      <div className="h-[350px] w-full rounded-xl border bg-card p-6 flex items-center justify-center text-muted-foreground animate-pulse text-sm">
        Memuat grafik skor departemen...
      </div>
    ),
    ssr: false,
  }
)

const CompletionChart = dynamic(
  () => import("@/components/dashboard/completion-chart").then((mod) => mod.CompletionChart),
  {
    loading: () => (
      <div className="h-[350px] w-full rounded-xl border bg-card p-6 flex items-center justify-center text-muted-foreground animate-pulse text-sm">
        Memuat grafik kelengkapan penilaian...
      </div>
    ),
    ssr: false,
  }
)
import { AttentionList } from "@/components/dashboard/attention-list"
import { ScoreDistribution } from "@/components/dashboard/score-distribution"
import { PeriodSelector } from "@/components/dashboard/period-selector"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SuperAdminShortcuts } from "@/components/dashboard/superadmin-shortcuts"
import { getSystemSettingsAction } from "@/lib/actions/settings"
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner"

interface DashboardPageProps {
  searchParams: Promise<{
    periodId?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentUser = await requireRole("super_admin", "admin", "user")
  const resolvedSearchParams = await searchParams
  const [data, systemSettings] = await Promise.all([
    getDashboardData(resolvedSearchParams?.periodId),
    getSystemSettingsAction(),
  ])

  if (!data) {
    return (
      <div className="space-y-6">
        <AnnouncementBanner
          announcement={systemSettings.content.announcement}
          userRole={currentUser.role}
        />
        <EmptyState type="no_period" role={currentUser.role} />
      </div>
    )
  }

  const isKetua = data.role === "user"
  const isSuperAdmin = data.role === "super_admin"

  return (
    <div className="space-y-6">
      {/* 0. Banner Pengumuman Global (Jika Dikonfigurasi Aktif oleh Super-Admin) */}
      <AnnouncementBanner
        announcement={systemSettings.content.announcement}
        userRole={currentUser.role}
      />

      {/* 1. Header Banner & Selamat Datang */}
      <div className="p-5 sm:p-6 rounded-xl border border-border bg-gradient-to-r from-card to-muted/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Selamat Datang, {currentUser.nama}
              </h1>
              <Badge
                variant="outline"
                className="text-xs bg-card font-semibold border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              >
                {currentUser.role === "super_admin" && "Super-Admin"}
                {currentUser.role === "admin" && "Admin Koordinator"}
                {currentUser.role === "user" && "Kepala Departemen"}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {isKetua
                ? data.department
                  ? `Mengelola evaluasi kinerja dan standarisasi nilai untuk ${data.department.nama}`
                  : "Akun ketua belum ditetapkan ke salah satu departemen"
                : "Portal monitoring, rekapitulasi, dan standarisasi kinerja 15 departemen Tazakka"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={isKetua ? "/penilaian" : "/rekap"}>
              <Button variant="default" className="gap-2 font-semibold text-xs sm:text-sm">
                <span>{isKetua ? "Mulai Penilaian" : "Buka Rekapitulasi"}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Selector Periode (Default: Periode Terbuka) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg border border-border bg-card/60 shadow-2xs">
        <PeriodSelector
          periods={data.periods}
          selectedPeriodId={data.period?.id || null}
        />

        {data.period && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>
              Menampilkan data untuk: <strong className="text-foreground">{data.period.nama}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Jika belum ada periode dalam sistem */}
      {!data.period ? (
        <EmptyState type="no_period" role={data.role} />
      ) : isKetua ? (
        /* --------------------------------------------------------------------- */
        /* 3. TAMPILAN DASHBOARD KETUA DEPARTEMEN (ROLE: USER)                   */
        /* --------------------------------------------------------------------- */
        !data.department ? (
          <EmptyState type="no_department" role="user" />
        ) : (
          <div className="space-y-6">
            {/* Baris KPI Ketua (4 Kartu dengan Garis Atas Gradien Emerald -> Oren) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Anggota Departemen"
                value={`${data.kpi.totalMembers} Orang`}
                subtitle="Total anggota aktif dalam departemen Anda"
                icon={Users}
              />

              <KpiCard
                title="Sudah Dinilai"
                value={`${data.kpi.assessedCount} Orang`}
                subtitle={`${data.progress.completionPercent}% dari total anggota telah dinilai`}
                icon={CheckCircle2}
                badge={{
                  text: `${data.progress.completionPercent}%`,
                  variant: data.progress.completionPercent === 100 ? "default" : "outline",
                  className: data.progress.completionPercent === 100 ? "bg-emerald-700 text-white dark:bg-emerald-800" : "",
                }}
              />

              <KpiCard
                title="Perlu Tindak Lanjut"
                value={`${data.kpi.needActionCount} Orang`}
                subtitle="Belum dinilai atau memerlukan perbaikan revisi"
                icon={AlertTriangle}
                badge={
                  data.kpi.needActionCount > 0
                    ? {
                        text: "Perlu Tindakan",
                        variant: "destructive",
                        className: "bg-orange-700 text-white dark:bg-orange-800",
                      }
                    : undefined
                }
              />

              <KpiCard
                title="Rata-rata Skor Departemen"
                value={data.kpi.averageScore !== null ? data.kpi.averageScore.toFixed(2) : "-"}
                subtitle="Skala Likert 1–5 dari seluruh aspek aktif"
                icon={TrendingUp}
              />
            </div>

            {/* Kartu Progres Periode Berjalan & Alert Tenggat Waktu & Komentar SDM */}
            <ProgressCard
              totalMembers={data.progress.totalMembers}
              assessedCount={data.progress.assessedCount}
              draftCount={data.progress.draftCount}
              completionPercent={data.progress.completionPercent}
              periodName={data.period.nama}
              periodEndDateFormatted={data.deadlineInfo.endDateFormatted}
              daysRemaining={data.deadlineInfo.daysRemaining}
              isNearDeadline={data.deadlineInfo.isNearDeadline}
              isPastDeadline={data.deadlineInfo.isPastDeadline}
              unreadCommentsCount={data.unreadComments.count}
              unreadComments={data.unreadComments.items}
              departmentName={data.department.nama}
            />

            {/* Daftar Anggota Belum Dinilai / Perlu Revisi */}
            <AttentionList
              role="user"
              ketuaItems={data.attentionList}
            />
          </div>
        )
      ) : (
        /* --------------------------------------------------------------------- */
        /* 4. TAMPILAN DASHBOARD ADMIN (SDM) & SUPER_ADMIN                       */
        /* --------------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Baris KPI Admin (4 Kartu dengan Garis Atas Gradien Emerald -> Oren) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Departemen Aktif"
              value={`${data.kpi.totalDepartments} Departemen`}
              subtitle="Struktur departemen terdaftar dalam sistem"
              icon={Building2}
            />

            <KpiCard
              title="Total Anggota"
              value={`${data.kpi.totalMembers} Orang`}
              subtitle="Keseluruhan anggota di seluruh departemen"
              icon={Users}
            />

            <KpiCard
              title="Penilaian Selesai"
              value={`${data.kpi.completionPercentage}%`}
              subtitle="Persentase kelengkapan penilaian lintas departemen"
              icon={CheckCircle2}
              badge={{
                text: `${data.kpi.completionPercentage}% Selesai`,
                variant: data.kpi.completionPercentage === 100 ? "default" : "outline",
                className: data.kpi.completionPercentage === 100 ? "bg-emerald-700 text-white dark:bg-emerald-800" : "",
              }}
            />

            <KpiCard
              title="Rata-rata Skor Keseluruhan"
              value={data.kpi.overallAverageScore !== null ? `${data.kpi.overallAverageScore.toFixed(2)}` : "-"}
              subtitle="Rata-rata kumulatif seluruh penilaian submitted/approved"
              icon={TrendingUp}
            />
          </div>

          {/* Grafik Recharts: Rata-rata Skor (Emerald) & Persentase Penyelesaian (Emerald + Oren) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeptScoreChart data={data.deptScores} />
            <CompletionChart data={data.deptCompletions} />
          </div>

          {/* Baris Attention List (Perlu Tindak Lanjut SDM) & Distribusi Kategori Skor PRD 8 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttentionList
              role={data.role}
              incompleteDepartments={data.attentionList.incompleteDepartments}
              pendingSubmissions={data.attentionList.pendingSubmissions}
            />

            <ScoreDistribution distribution={data.scoreDistribution} />
          </div>

          {/* Khusus Super-Admin: Pintasan Cepat & Ringkasan Tata Kelola Akun Ketua */}
          {isSuperAdmin && (
            <SuperAdminShortcuts governance={data.governance} />
          )}
        </div>
      )}
    </div>
  )
}
