"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import {
  Scale,
  Save,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  MessageSquare,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScoringSettings } from "@/lib/settings/default-settings"
import { saveScoringSettingsAction } from "@/lib/actions/settings"

interface ScoringTabProps {
  initialSettings: ScoringSettings
  onSettingsSaved: (updated: ScoringSettings) => void
}

export function ScoringTab({ initialSettings, onSettingsSaved }: ScoringTabProps) {
  const [formData, setFormData] = useState<ScoringSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const { thresholds } = formData

  const handleThresholdChange = (key: keyof ScoringSettings["thresholds"], value: number) => {
    setFormData((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi urutan ambang batas
    if (
      thresholds.sangatBaik <= thresholds.baik ||
      thresholds.baik <= thresholds.cukup ||
      thresholds.cukup <= thresholds.kurang
    ) {
      toast.error(
        "Urutan ambang batas harus konsisten: Sangat Baik > Baik > Cukup > Kurang."
      )
      return
    }

    setIsSaving(true)

    try {
      const result = await saveScoringSettingsAction(formData)
      if (result.success) {
        toast.success(result.message)
        onSettingsSaved(formData)
      } else {
        toast.error(result.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan kebijakan penilaian.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Ambang Batas Predikat Kinerja */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Ambang Batas Kategori Predikat Kinerja
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Tentukan ambang skor minimal (skala 1,00 – 5,00) untuk menentukan predikat dan warna lencana pada rekapitulasi kinerja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Sangat Baik */}
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Sangat Baik
                </span>
                <Badge className="bg-emerald-700 text-white font-bold text-[11px]">
                  &ge; {thresholds.sangatBaik.toFixed(2)}
                </Badge>
              </div>
              <Label htmlFor="sangatBaik" className="text-[11px] text-muted-foreground block">
                Skor Minimal
              </Label>
              <Input
                id="sangatBaik"
                type="number"
                step="0.05"
                min="3.0"
                max="5.0"
                value={thresholds.sangatBaik}
                onChange={(e) =>
                  handleThresholdChange("sangatBaik", parseFloat(e.target.value) || 0)
                }
                className="bg-card text-sm font-semibold"
                required
              />
              <p className="text-[10px] text-muted-foreground">Melampaui standar kinerja</p>
            </div>

            {/* 2. Baik */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                  Baik
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold text-[11px]">
                  &ge; {thresholds.baik.toFixed(2)}
                </Badge>
              </div>
              <Label htmlFor="baik" className="text-[11px] text-muted-foreground block">
                Skor Minimal
              </Label>
              <Input
                id="baik"
                type="number"
                step="0.05"
                min="2.0"
                max="4.5"
                value={thresholds.baik}
                onChange={(e) =>
                  handleThresholdChange("baik", parseFloat(e.target.value) || 0)
                }
                className="bg-card text-sm font-semibold"
                required
              />
              <p className="text-[10px] text-muted-foreground">Memenuhi ekspektasi standar</p>
            </div>

            {/* 3. Cukup */}
            <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                  Cukup
                </span>
                <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px]">
                  &ge; {thresholds.cukup.toFixed(2)}
                </Badge>
              </div>
              <Label htmlFor="cukup" className="text-[11px] text-muted-foreground block">
                Skor Minimal
              </Label>
              <Input
                id="cukup"
                type="number"
                step="0.05"
                min="1.5"
                max="3.5"
                value={thresholds.cukup}
                onChange={(e) =>
                  handleThresholdChange("cukup", parseFloat(e.target.value) || 0)
                }
                className="bg-card text-sm font-semibold"
                required
              />
              <p className="text-[10px] text-muted-foreground">Perlu pendampingan berkala</p>
            </div>

            {/* 4. Kurang */}
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Kurang
                </span>
                <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300 font-bold text-[11px]">
                  &ge; {thresholds.kurang.toFixed(2)}
                </Badge>
              </div>
              <Label htmlFor="kurang" className="text-[11px] text-muted-foreground block">
                Skor Minimal
              </Label>
              <Input
                id="kurang"
                type="number"
                step="0.05"
                min="1.0"
                max="2.5"
                value={thresholds.kurang}
                onChange={(e) =>
                  handleThresholdChange("kurang", parseFloat(e.target.value) || 0)
                }
                className="bg-card text-sm font-semibold"
                required
              />
              <p className="text-[10px] text-muted-foreground">Di bawah ambang ini = Sangat Kurang</p>
            </div>
          </div>

          {/* Interactive Legend Preview */}
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
              Pratinjau Rentang Nilai & Lencana di Lembar Rekap
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Rentang:</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-700 text-white font-bold">
                {thresholds.sangatBaik.toFixed(2)} - 5.00: Sangat Baik
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-700">
                {thresholds.baik.toFixed(2)} - {(thresholds.sangatBaik - 0.01).toFixed(2)}: Baik
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-medium">
                {thresholds.cukup.toFixed(2)} - {(thresholds.baik - 0.01).toFixed(2)}: Cukup
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-medium">
                {thresholds.kurang.toFixed(2)} - {(thresholds.cukup - 0.01).toFixed(2)}: Kurang
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 font-medium">
                &lt; {thresholds.kurang.toFixed(2)}: Sangat Kurang
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Kebijakan Catatan & Aturan Evaluasi */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Kebijakan Pengisian Lembar Penilaian
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Atur aturan validasi dan izin pengeditan lembar evaluasi bagi Kepala Departemen dan Admin SDM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle Wajib Catatan jika nilai rendah */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="space-y-1">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                Wajib Isi Catatan Evaluasi pada Nilai Rendah
              </Label>
              <p className="text-xs text-muted-foreground">
                Evaluator wajib menuliskan alasan & catatan perbaikan jika rata-rata skor di bawah ambang batas ({formData.requireCommentThreshold.toFixed(2)}).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.requireCommentBelowThreshold}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireCommentBelowThreshold: checked })
                }
              />
            </div>
          </div>

          {/* Toggle Izin Edit Draft */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="space-y-1">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                Izinkan Kepala Departemen Mengubah Draft Sebelum Submit
              </Label>
              <p className="text-xs text-muted-foreground">
                Memberikan keleluasaan bagi evaluator untuk meninjau dan menyimpan draft sementara sebelum mengirimkan nilai final.
              </p>
            </div>
            <Switch
              checked={formData.allowEvaluatorEditDraft}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowEvaluatorEditDraft: checked })
              }
            />
          </div>

          {/* Toggle Kunci Otomatis saat Periode Ditutup */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="space-y-1">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Lock className="size-4 text-muted-foreground" />
                Kunci Otomatis Penilaian saat Periode Ditutup
              </Label>
              <p className="text-xs text-muted-foreground">
                Mencegah penambahan atau perubahan nilai setelah status periode diubah menjadi &apos;closed&apos;.
              </p>
            </div>
            <Switch
              checked={formData.autoLockOnClose}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, autoLockOnClose: checked })
              }
            />
          </div>

          {/* Toggle Persetujuan Massal (Bulk Approval) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="space-y-1">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                Izinkan Persetujuan Massal (Bulk Approval) oleh Admin
              </Label>
              <p className="text-xs text-muted-foreground">
                Memungkinkan Admin SDM menyetujui seluruh lembar penilaian yang berstatus diajukan dalam 1 klik.
              </p>
            </div>
            <Switch
              checked={formData.allowBulkApproval}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowBulkApproval: checked })
              }
            />
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
                Simpan Kebijakan Penilaian
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
