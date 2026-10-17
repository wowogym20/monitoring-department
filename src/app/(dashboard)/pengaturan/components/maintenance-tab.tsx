"use client"

import React, { useState, useRef } from "react"
import { toast } from "sonner"
import {
  Wrench,
  Save,
  Loader2,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Database,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SystemSettingsConfig } from "@/lib/settings/default-settings"
import {
  saveSystemSettingsAction,
  resetSettingsAction,
  exportSettingsJsonAction,
  importSettingsJsonAction,
  purgeTrashNowAction,
} from "@/lib/actions/settings"

interface MaintenanceTabProps {
  initialSettings: SystemSettingsConfig
  onSettingsSaved: (updated: SystemSettingsConfig) => void
  onFullReset: () => void
}

export function MaintenanceTab({
  initialSettings,
  onSettingsSaved,
  onFullReset,
}: MaintenanceTabProps) {
  const [formData, setFormData] = useState<SystemSettingsConfig>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [isPurging, setIsPurging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)

  const { maintenance, trash } = formData

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = await saveSystemSettingsAction(formData)
      if (result.success) {
        toast.success(result.message)
        onSettingsSaved(formData)
      } else {
        toast.error(result.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi sistem.")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Ekspor Snapshot Pengaturan
  const handleExportJson = async () => {
    setIsExporting(true)
    try {
      const res = await exportSettingsJsonAction()
      if (res.success && res.data) {
        const blob = new Blob([res.data.jsonString], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = res.data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Berkas cadangan pengaturan berhasil diunduh.")
      } else {
        toast.error(res.message || "Gagal membuat cadangan.")
      }
    } catch {
      toast.error("Terjadi kendala saat mengekspor konfigurasi.")
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Impor File JSON
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const res = await importSettingsJsonAction(text)
      if (res.success) {
        toast.success(res.message)
        onFullReset()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("File tidak dapat dibaca atau format JSON rusak.")
    } finally {
      setIsImporting(false)
      if (importFileRef.current) importFileRef.current.value = ""
    }
  }

  // Handle Purge Trash Segera
  const handlePurgeNow = async () => {
    setIsPurging(true)
    try {
      const res = await purgeTrashNowAction()
      if (res.success) {
        toast.error(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Gagal melakukan pembersihan tempat sampah.")
    } finally {
      setIsPurging(false)
    }
  }

  // Handle Factory Reset
  const handleFactoryReset = async () => {
    setIsResetting(true)
    try {
      const res = await resetSettingsAction("all")
      if (res.success) {
        toast.success("Seluruh pengaturan berhasil dikembalikan ke standar awal Tazakka.")
        onFullReset()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Gagal mereset pengaturan.")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Mode Pemeliharaan (Maintenance Mode - Baca-Saja) */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Mode Pemeliharaan (Mode Baca-Saja)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Alihkan sistem ke mode baca-saja (*read-only*) untuk pemeliharaan database atau audit berkala.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border">
              <Switch
                id="maintenanceActive"
                checked={maintenance.isActive}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    maintenance: { ...maintenance, isActive: checked },
                  })
                }
              />
              <Label htmlFor="maintenanceActive" className="text-xs font-bold cursor-pointer">
                {maintenance.isActive ? "Pemeliharaan Aktif" : "Sistem Normal"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Penjelasan Status Baca-Saja */}
          <div
            className={`p-4 rounded-xl border ${
              maintenance.isActive
                ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                : "bg-muted/30 border-border text-muted-foreground"
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">
                  Dampak Mode Pemeliharaan:
                </p>
                <p className="leading-relaxed">
                  Ketika aktif, seluruh akun Kepala Departemen dan Admin SDM otomatis dialihkan ke status <strong>Baca-Saja (Read-Only)</strong>. Mereka tetap dapat meninjau data dan membaca rekapitulasi, namun tidak dapat menyimpan nilai baru atau mengubah data anggota. <strong>Super Admin tetap memiliki akses penuh</strong> untuk mengelola sistem.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maintenanceMessage" className="text-xs font-semibold">
              Pesan Pemberitahuan untuk Pengguna <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="maintenanceMessage"
              rows={2}
              value={maintenance.message}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maintenance: { ...maintenance, message: e.target.value },
                })
              }
              placeholder="Contoh: Sistem sedang dalam proses pemeliharaan berkala..."
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Kebijakan Retensi Tempat Sampah (Trash Retention) */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Kebijakan Retensi Tempat Sampah (Auto-Purge)
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Atur batas waktu penyimpanan data anggota yang dihapus lunak (*soft-deleted*) sebelum dibersihkan secara permanen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Masa Retensi Data Terhapus</Label>
              <Select
                value={trash.retentionDays.toString()}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    trash: { ...trash, retentionDays: parseInt(val, 10) || 30 },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih durasi retensi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Hari (Rekomendasi Cepat)</SelectItem>
                  <SelectItem value="14">14 Hari (Dua Pekan)</SelectItem>
                  <SelectItem value="30">30 Hari (Standar 1 Bulan)</SelectItem>
                  <SelectItem value="60">60 Hari (Dua Bulan)</SelectItem>
                  <SelectItem value="90">90 Hari (Satu Triwulan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div>
                  <p className="text-xs font-semibold">Pembersihan Otomatis</p>
                  <p className="text-[11px] text-muted-foreground">Hapus permanen saat kedaluwarsa</p>
                </div>
                <Switch
                  checked={trash.autoPurgeEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      trash: { ...trash, autoPurgeEnabled: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-border">
            <p className="text-xs text-muted-foreground">
              Ingin mengosongkan data yang telah kedaluwarsa secara langsung?
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPurging}
                  className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  {isPurging ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Bersihkan Tempat Sampah Sekarang
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Pembersihan Permanen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus seluruh data anggota dan penilaian di Tempat Sampah yang telah melewati masa retensi {trash.retentionDays} hari secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePurgeNow}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Ya, Bersihkan Sekarang
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Simpan Konfigurasi Sistem
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* 3. Pencadangan & Pemulihan Konfigurasi */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Pencadangan & Pemulihan Konfigurasi (Backup & Restore)
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Unduh salinan pengaturan sistem ke dalam file JSON atau pulihkan konfigurasi dari berkas cadangan sebelumnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportJson}
              disabled={isExporting}
              className="gap-2 text-xs font-semibold"
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Unduh Cadangan Pengaturan (.json)
            </Button>

            <input
              ref={importFileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => importFileRef.current?.click()}
              disabled={isImporting}
              className="gap-2 text-xs font-semibold"
            >
              {isImporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Pulihkan dari File JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Zona Bahaya: Reset ke Default Pabrik */}
      <Card className="border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />
            <CardTitle className="text-base sm:text-lg font-bold text-rose-950 dark:text-rose-200">
              Zona Bahaya: Reset ke Pengaturan Awal
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Mengembalikan seluruh identitas, ambang batas penilaian, pengumuman, dan preferensi sistem ke nilai bawaan resmi Pondok Modern Tazakka.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={isResetting}
                className="gap-2 text-xs font-semibold"
              >
                {isResetting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Kembalikan Semua ke Nilai Default Pabrik
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Reset Pengaturan</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin mengembalikan seluruh pengaturan aplikasi ke nilai default pabrik? Seluruh penyesuaian teks pengumuman, ambang batas penilaian, dan kontak bantuan akan digantikan dengan data standar Tazakka.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleFactoryReset}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Ya, Kembalikan ke Default
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </form>
  )
}
