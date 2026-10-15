"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import {
  Save,
  Loader2,
  CalendarDays,
  MessageSquare,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { NotificationSettings } from "@/lib/settings/default-settings"
import { saveNotificationSettingsAction } from "@/lib/actions/settings"

interface NotificationsTabProps {
  initialSettings: NotificationSettings
  onSettingsSaved: (updated: NotificationSettings) => void
}

export function NotificationsTab({
  initialSettings,
  onSettingsSaved,
}: NotificationsTabProps) {
  const [formData, setFormData] = useState<NotificationSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = await saveNotificationSettingsAction(formData)
      if (result.success) {
        toast.success(result.message)
        onSettingsSaved(formData)
      } else {
        toast.error(result.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan preferensi notifikasi.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Pengingat Jadwal & Batas Waktu Periode */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Pengingat Tenggat Waktu Periode Penilaian
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Atur pengingat berkala bagi Kepala Departemen agar menyelesaikan penilaian sebelum tanggal penutupan periode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* H-7 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div>
              <Label className="text-sm font-semibold">
                Pengingat H-7 Sebelum Periode Ditutup
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mengirimkan notifikasi sistem dan status pengingat satu pekan sebelum periode berakhir.
              </p>
            </div>
            <Switch
              checked={formData.remindH7}
              onCheckedChange={(checked) => setFormData({ ...formData, remindH7: checked })}
            />
          </div>

          {/* H-3 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div>
              <Label className="text-sm font-semibold">
                Pengingat H-3 Sebelum Periode Ditutup
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Peringatan intensif bagi departemen yang progres pengisian nilainya masih berstatus belum lengkap.
              </p>
            </div>
            <Switch
              checked={formData.remindH3}
              onCheckedChange={(checked) => setFormData({ ...formData, remindH3: checked })}
            />
          </div>

          {/* H-1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div>
              <Label className="text-sm font-semibold">
                Pemberitahuan Hari Terakhir (H-1)
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Peringatan mendesak untuk menyelesaikan dan men-submit seluruh lembar penilaian.
              </p>
            </div>
            <Switch
              checked={formData.remindH1}
              onCheckedChange={(checked) => setFormData({ ...formData, remindH1: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Lencana & Notifikasi Aktivitas */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Notifikasi Diskusi & Umpan Balik
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Atur kemunculan lencana notifikasi untuk interaksi komentar catatan penilaian.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div>
              <Label className="text-sm font-semibold">
                Lencana Angka Komentar Baru di Menu Navigasi
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Menampilkan badge merah/oranye berisi jumlah komentar yang belum dibaca pada tautan Penilaian dan Rekap.
              </p>
            </div>
            <Switch
              checked={formData.commentBadge}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, commentBadge: checked })
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
                Simpan Preferensi Notifikasi
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
