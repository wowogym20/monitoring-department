import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { CheckCircle2, Clock, AlertCircle, FileEdit } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary inline-block" />
              <span className="h-3 w-3 rounded-full bg-secondary inline-block" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Monitoring Departemen
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Sistem Standarisasi Penilaian dan Pemantauan Kinerja Internal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Mode Tampilan:</span>
            <ThemeToggle />
          </div>
        </header>

        {/* Section: Verifikasi Tombol Tema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verifikasi Tombol Tema</CardTitle>
            <CardDescription>
              Uji coba token Hijau Emerald (Primary) dan Oren Amber (Secondary)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button variant="default">
              Tombol Primary (Emerald)
            </Button>
            <Button variant="secondary">
              Tombol Secondary (Amber)
            </Button>
            <Button variant="outline">
              Tombol Outline
            </Button>
            <Button variant="ghost">
              Tombol Ghost
            </Button>
            <Button variant="destructive">
              Tombol Destructive
            </Button>
          </CardContent>
        </Card>

        {/* Section: Status Penilaian (PRD Bagian 9) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Status Penilaian (PRD Bagian 9)
            </CardTitle>
            <CardDescription>
              Badge dan indikator alur penilaian: Draft, Submitted, Revision Requested, dan Approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Draft */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <FileEdit className="size-4 text-slate-500" />
                  <span className="text-sm font-medium">Draft</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                >
                  Draft
                </Badge>
              </div>

              {/* Submitted */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium">Submitted</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800"
                >
                  Submitted
                </Badge>
              </div>

              {/* Revision Requested */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="size-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium">Revision Requested</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-700"
                >
                  Revision Requested
                </Badge>
              </div>

              {/* Approved */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-600 dark:border-emerald-700"
                >
                  Approved
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Kategori Capaian Skor (PRD Bagian 8) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Kategori Capaian Skor (PRD Bagian 8)
            </CardTitle>
            <CardDescription>
              Skala Likert 1–5 dengan pemetaan warna status kinerja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2.5">
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                Sangat Baik (4.50 – 5.00)
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
              >
                Baik (3.50 – 4.49)
              </Badge>
              <Badge
                variant="outline"
                className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              >
                Cukup (2.50 – 3.49)
              </Badge>
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800"
              >
                Kurang (1.50 – 2.49)
              </Badge>
              <Badge className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-700">
                Sangat Kurang (1.00 – 1.49)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Section: Palet Token Visual Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Token Warna Chart (Recharts)</CardTitle>
            <CardDescription>
              Representasi visual variabel --chart-1 sampai --chart-4
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-lg border border-border">
                <div className="h-8 rounded bg-[var(--chart-1)] mb-2" />
                <span className="font-medium">--chart-1</span>
                <p className="text-muted-foreground mt-0.5">Emerald 600 (Skor Utama)</p>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <div className="h-8 rounded bg-[var(--chart-2)] mb-2" />
                <span className="font-medium">--chart-2</span>
                <p className="text-muted-foreground mt-0.5">Orange 500 (Aksen Revisi)</p>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <div className="h-8 rounded bg-[var(--chart-3)] mb-2" />
                <span className="font-medium">--chart-3</span>
                <p className="text-muted-foreground mt-0.5">Teal 500 (Kinerja)</p>
              </div>
              <div className="p-3 rounded-lg border border-border">
                <div className="h-8 rounded bg-[var(--chart-4)] mb-2" />
                <span className="font-medium">--chart-4</span>
                <p className="text-muted-foreground mt-0.5">Amber 400 (Progres)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-4">
          <Separator className="mb-4" />
          Monitoring Departemen &bull; Dibangun dengan Next.js 16, Tailwind CSS 4 &amp; shadcn/ui
        </footer>
      </div>
    </main>
  )
}
