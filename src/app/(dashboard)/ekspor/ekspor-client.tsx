"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  Calendar,
  Building2,
  CheckCircle2,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AssessmentPeriod } from "@/types/database"
import { cn } from "@/lib/utils"

// Helper untuk merapikan nama periode agar tidak mengulang kata "Periode Penilaian"
function formatPeriodDisplay(name: string): string {
  if (!name) return ""
  return name.replace(/^Periode\s+Penilaian\s+/i, "").trim()
}

interface DepartmentOption {
  id: string
  nama: string
  kode: string
}

interface EksporClientProps {
  periods: AssessmentPeriod[]
  departments: DepartmentOption[]
}

export function EksporClient({ periods, departments }: EksporClientProps) {
  // Tentukan default periode: periode yang berstatus 'open', atau periode pertama
  const defaultPeriodId =
    periods.find((p) => p.status === "open")?.id || periods[0]?.id || ""

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(defaultPeriodId)
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all")
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId)

  // Handler unduh Excel
  const handleDownloadExcel = async () => {
    if (!selectedPeriodId) {
      toast.error("Silakan pilih periode penilaian terlebih dahulu.")
      return
    }

    try {
      setIsDownloadingExcel(true)
      toast.info("Sedang menyiapkan file Excel...")

      const queryParams = new URLSearchParams({
        periodeId: selectedPeriodId,
        departmentId: selectedDeptId,
      })

      const response = await fetch(`/api/export/excel?${queryParams.toString()}`)

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || "Gagal mengunduh file Excel.")
      }

      // Ambil nama file dari header Content-Disposition bila tersedia
      const disposition = response.headers.get("Content-Disposition")
      let filename = `monitoring-departemen_${selectedPeriod?.nama || "rekap"}.xlsx`
      if (disposition && disposition.includes("filename=")) {
        const matches = disposition.match(/filename="?([^"]+)"?/)
        if (matches && matches[1]) {
          filename = matches[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Laporan Excel berhasil diunduh!")
    } catch (error: unknown) {
      console.error("Kesalahan ekspor Excel:", error)
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan."
      toast.error(`Gagal mengunduh Excel: ${msg}`)
    } finally {
      setIsDownloadingExcel(false)
    }
  }

  // Handler unduh PDF
  const handleDownloadPdf = async () => {
    if (!selectedPeriodId) {
      toast.error("Silakan pilih periode penilaian terlebih dahulu.")
      return
    }

    try {
      setIsDownloadingPdf(true)
      toast.info("Sedang membuat dokumen PDF...")

      const queryParams = new URLSearchParams({
        periodeId: selectedPeriodId,
        departmentId: selectedDeptId,
      })

      const response = await fetch(`/api/export/pdf?${queryParams.toString()}`)

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || "Gagal mengunduh file PDF.")
      }

      const disposition = response.headers.get("Content-Disposition")
      let filename = `monitoring-departemen_${selectedPeriod?.nama || "rekap"}.pdf`
      if (disposition && disposition.includes("filename=")) {
        const matches = disposition.match(/filename="?([^"]+)"?/)
        if (matches && matches[1]) {
          filename = matches[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Laporan PDF berhasil diunduh!")
    } catch (error: unknown) {
      console.error("Kesalahan ekspor PDF:", error)
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan."
      toast.error(`Gagal mengunduh PDF: ${msg}`)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
      {/* Kolom Kiri: Form Parameter & Tombol Aksi */}
      <Card className="border border-border shadow-xs lg:col-span-7">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Download className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                Parameter Ekspor Laporan
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Pilih periode evaluasi dan departemen yang ingin dimasukkan ke dalam berkas laporan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-5">
          {/* 1. Filter Periode */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="period-select" className="text-xs sm:text-sm font-medium flex items-center gap-1.5 text-foreground/85">
              <Calendar className="size-3.5 sm:size-4 text-primary shrink-0" />
              <span>Periode Penilaian</span>
            </Label>
            {periods.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">Belum ada periode yang terdaftar.</p>
            ) : (
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger id="period-select" aria-label="Pilih periode penilaian" className="w-full h-9.5 sm:h-10 text-xs sm:text-sm bg-background">
                  <SelectValue placeholder="Pilih Periode">
                    {selectedPeriod ? (
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="truncate font-medium">{formatPeriodDisplay(selectedPeriod.nama)}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-normal px-1.5 py-0 shrink-0",
                            selectedPeriod.status === "open"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {selectedPeriod.status === "open" ? "Aktif" : "Tutup"}
                        </Badge>
                      </div>
                    ) : (
                      "Pilih Periode"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => {
                    const cleanName = formatPeriodDisplay(p.nama)
                    return (
                      <SelectItem key={p.id} value={p.id} className="text-xs sm:text-sm py-2">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-medium truncate">{cleanName}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-normal px-1.5 py-0 shrink-0",
                              p.status === "open"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {p.status === "open" ? "Aktif" : "Tutup"}
                          </Badge>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 2. Filter Departemen */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="dept-select" className="text-xs sm:text-sm font-medium flex items-center gap-1.5 text-foreground/85">
              <Building2 className="size-3.5 sm:size-4 text-primary shrink-0" />
              <span>Departemen</span>
            </Label>
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
              <SelectTrigger id="dept-select" aria-label="Pilih cakupan departemen" className="w-full h-9.5 sm:h-10 text-xs sm:text-sm bg-background">
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs sm:text-sm py-2">
                  <span className="font-medium">Semua Departemen (Rekap Lengkap)</span>
                </SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs sm:text-sm py-2">
                    <span className="font-medium">{d.nama}</span>{" "}
                    <span className="text-muted-foreground text-[10px] font-mono">({d.kode})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Pilih &quot;Semua Departemen&quot; untuk mengunduh seluruh 14 departemen sekaligus, atau pilih salah satu departemen spesifik.
            </p>
          </div>

          {/* Strip Ringkasan Parameter */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Calendar className="size-3.5 text-primary shrink-0" />
              <span className="shrink-0 font-medium">Periode:</span>
              <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {selectedPeriod ? formatPeriodDisplay(selectedPeriod.nama) : "-"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Building2 className="size-3.5 text-primary shrink-0" />
              <span className="shrink-0 font-medium">Cakupan:</span>
              <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {selectedDeptId === "all"
                  ? "Semua Departemen"
                  : departments.find((d) => d.id === selectedDeptId)?.nama || "Departemen"}
              </span>
            </div>
          </div>

          <Separator className="my-1 sm:my-2" />

          {/* 3. Tombol Aksi Unduh */}
          <div className="space-y-2.5 sm:space-y-3 pt-1">
            <Label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pilihan Format Berkas
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Tombol Unduh Excel */}
              <Button
                type="button"
                className="flex-1 h-10 sm:h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs transition-colors gap-2"
                onClick={handleDownloadExcel}
                disabled={isDownloadingExcel || isDownloadingPdf || !selectedPeriodId}
              >
                {isDownloadingExcel ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menyiapkan Excel...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="size-4" />
                    <span>Unduh Excel (.xlsx)</span>
                  </>
                )}
              </Button>

              {/* Tombol Unduh PDF */}
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 sm:h-11 border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold rounded-lg shadow-xs transition-colors gap-2"
                onClick={handleDownloadPdf}
                disabled={isDownloadingExcel || isDownloadingPdf || !selectedPeriodId}
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-emerald-600" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="size-4 text-emerald-600" />
                    <span>Unduh PDF (.pdf)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kolom Kanan: Ringkasan Spesifikasi Berkas & Konsistensi Data */}
      <div className="space-y-4 lg:col-span-5">
        <Card className="border border-border shadow-xs">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Info className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Spesifikasi Berkas Laporan
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Struktur dan konten data yang disertakan pada unduhan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3.5 sm:space-y-4 text-sm">
            {/* Format Excel */}
            <div className="rounded-lg border border-border/80 p-3 sm:p-3.5 bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-xs sm:text-sm">Format Excel (.xlsx)</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside pl-0.5">
                <li>
                  <strong className="text-foreground">Sheet 1:</strong> Ringkasan per departemen (Total anggota, sudah dinilai, rata-rata skor, kelengkapan).
                </li>
                <li>
                  <strong className="text-foreground">Sheet 2:</strong> Detail per anggota (Skor tiap 7 aspek, skor rata-rata, kategori, status, tanggal).
                </li>
                <li>Gaya sel profesional, lebar kolom otomatis, dan tanggal format &quot;dd MMM yyyy&quot;.</li>
              </ul>
            </div>

            {/* Format PDF */}
            <div className="rounded-lg border border-border/80 p-3 sm:p-3.5 bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="size-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-xs sm:text-sm">Format Dokumen PDF (.pdf)</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside pl-0.5">
                <li>Tata letak siap cetak format A4 Landscape.</li>
                <li>Tema visual hijau emerald pada header dan kartu departemen.</li>
                <li>Memuat judul periode, tabel skor anggota, rata-rata departemen, dan tanggal cetak resmi.</li>
              </ul>
            </div>

            {/* Jaminan Konsistensi */}
            <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Angka dan perhitungan pada berkas ekspor 100% konsisten dengan data pada halaman <strong>Rekap Penilaian</strong>.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
