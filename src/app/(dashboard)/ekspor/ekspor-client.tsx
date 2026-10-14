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
    <div className="grid gap-6 md:grid-cols-12">
      {/* Kolom Kiri: Form Filter & Tombol Aksi */}
      <Card className="border border-border shadow-xs md:col-span-7">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Parameter Ekspor Laporan
          </CardTitle>
          <CardDescription>
            Pilih periode evaluasi dan departemen yang ingin dimasukkan ke dalam berkas laporan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 1. Filter Periode */}
          <div className="space-y-2">
            <Label htmlFor="period-select" className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Periode Penilaian
            </Label>
            {periods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada periode yang terdaftar.</p>
            ) : (
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger id="period-select" aria-label="Pilih periode penilaian" className="w-full">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.nama}</span>
                        {p.status === "open" && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] px-1.5 py-0">
                            Aktif
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 2. Filter Departemen */}
          <div className="space-y-2">
            <Label htmlFor="dept-select" className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              Departemen
            </Label>
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
              <SelectTrigger id="dept-select" aria-label="Pilih cakupan departemen" className="w-full">
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">Semua Departemen (Rekap Lengkap)</span>
                </SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    [{d.kode}] {d.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pilih &quot;Semua Departemen&quot; untuk mengunduh seluruh 14 departemen sekaligus, atau pilih salah satu departemen spesifik.
            </p>
          </div>

          <Separator className="my-2" />

          {/* 3. Tombol Aksi Unduh */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pilihan Format Berkas
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Tombol Unduh Excel */}
              <Button
                type="button"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-xs"
                onClick={handleDownloadExcel}
                disabled={isDownloadingExcel || isDownloadingPdf || !selectedPeriodId}
              >
                {isDownloadingExcel ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyiapkan Excel...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Unduh Excel (.xlsx)
                  </>
                )}
              </Button>

              {/* Tombol Unduh PDF */}
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium shadow-xs"
                onClick={handleDownloadPdf}
                disabled={isDownloadingExcel || isDownloadingPdf || !selectedPeriodId}
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat PDF...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4 text-emerald-600" />
                    Unduh PDF (.pdf)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kolom Kanan: Ringkasan Spesifikasi Berkas & Konsistensi Data */}
      <div className="space-y-4 md:col-span-5">
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Spesifikasi Berkas Laporan
            </CardTitle>
            <CardDescription className="text-xs">
              Struktur dan konten data yang disertakan pada unduhan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Format Excel */}
            <div className="rounded-lg border border-border/80 p-3 bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Format Excel (.xlsx)</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
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
            <div className="rounded-lg border border-border/80 p-3 bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Format Dokumen PDF (.pdf)</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Tata letak siap cetak format A4 Landscape.</li>
                <li>Tema visual hijau emerald pada header dan kartu departemen.</li>
                <li>Memuat judul periode, tabel skor anggota, rata-rata departemen, dan tanggal cetak resmi.</li>
              </ul>
            </div>

            {/* Jaminan Konsistensi */}
            <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
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
