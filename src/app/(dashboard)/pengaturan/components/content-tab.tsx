"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import {
  Megaphone,
  Save,
  Loader2,
  Sparkles,
  Quote,
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { ContentSettings, AnnouncementType, AnnouncementRoleTarget } from "@/lib/settings/default-settings"
import { saveContentSettingsAction } from "@/lib/actions/settings"
import { cn } from "@/lib/utils"

interface ContentTabProps {
  initialSettings: ContentSettings
  onSettingsSaved: (updated: ContentSettings) => void
}

export function ContentTab({ initialSettings, onSettingsSaved }: ContentTabProps) {
  const [formData, setFormData] = useState<ContentSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const { announcement, leaderMessage, externalLinks } = formData

  const handleAnnouncementChange = (fields: Partial<ContentSettings["announcement"]>) => {
    setFormData((prev) => ({
      ...prev,
      announcement: {
        ...prev.announcement,
        ...fields,
      },
    }))
  }

  const handleLeaderMessageChange = (fields: Partial<ContentSettings["leaderMessage"]>) => {
    setFormData((prev) => ({
      ...prev,
      leaderMessage: {
        ...prev.leaderMessage,
        ...fields,
      },
    }))
  }

  const handleRoleToggle = (role: AnnouncementRoleTarget) => {
    const currentRoles = [...announcement.targetRoles]
    if (role === "all") {
      handleAnnouncementChange({ targetRoles: ["all"] })
      return
    }

    const filteredWithoutAll = currentRoles.filter((r) => r !== "all")
    if (filteredWithoutAll.includes(role)) {
      const next = filteredWithoutAll.filter((r) => r !== role)
      handleAnnouncementChange({ targetRoles: next.length === 0 ? ["all"] : next })
    } else {
      handleAnnouncementChange({ targetRoles: [...filteredWithoutAll, role] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = await saveContentSettingsAction(formData)
      if (result.success) {
        toast.success(result.message)
        onSettingsSaved(formData)
      } else {
        toast.error(result.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan konten & pengumuman.")
    } finally {
      setIsSaving(false)
    }
  }

  // Visual preview configuration
  const previewColors: Record<AnnouncementType, { bg: string; text: string; icon: React.ElementType; border: string }> = {
    info: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-900 dark:text-blue-100", icon: Info, border: "border-blue-200 dark:border-blue-800" },
    warning: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-900 dark:text-amber-100", icon: AlertTriangle, border: "border-amber-200 dark:border-amber-800" },
    success: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-900 dark:text-emerald-100", icon: CheckCircle2, border: "border-emerald-200 dark:border-emerald-800" },
    destructive: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-900 dark:text-rose-100", icon: AlertCircle, border: "border-rose-200 dark:border-rose-800" },
  }

  const PreviewIcon = previewColors[announcement.type || "info"].icon

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Pengumuman Siaran Global (Dashboard Announcement) */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Megaphone className="size-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Siaran Pengumuman Dashboard
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tampilkan banner maklumat penting di bagian paling atas dashboard untuk seluruh pengguna atau peran tertentu.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border">
              <Switch
                id="announcementActive"
                checked={announcement.isActive}
                onCheckedChange={(checked) => handleAnnouncementChange({ isActive: checked })}
              />
              <Label htmlFor="announcementActive" className="text-xs font-bold cursor-pointer">
                {announcement.isActive ? "Siaran Aktif" : "Nonaktif"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="announcementTitle" className="text-xs font-semibold">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="announcementTitle"
                value={announcement.title}
                onChange={(e) => handleAnnouncementChange({ title: e.target.value })}
                placeholder="Contoh: Batas Akhir Penilaian Semester Ganjil"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="announcementType" className="text-xs font-semibold">
                Tipe / Nuansa Peringatan
              </Label>
              <Select
                value={announcement.type}
                onValueChange={(val) => handleAnnouncementChange({ type: val as AnnouncementType })}
              >
                <SelectTrigger id="announcementType" className="w-full">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informasi Umum (Biru Netral)</SelectItem>
                  <SelectItem value="warning">Peringatan / Atensi (Kuning Amber)</SelectItem>
                  <SelectItem value="success">Keberhasilan / Kabar Baik (Hijau Emerald)</SelectItem>
                  <SelectItem value="destructive">Mendesak / Urgent (Merah)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="announcementMessage" className="text-xs font-semibold">
              Isi Maklumat / Pesan Pengumuman <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="announcementMessage"
              rows={3}
              value={announcement.message}
              onChange={(e) => handleAnnouncementChange({ message: e.target.value })}
              placeholder="Tuliskan petunjuk, arahan, atau tenggat waktu pengisian..."
              required
            />
          </div>

          {/* Target Audiens */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Target Audiens Penerima Siaran</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { role: "all" as const, label: "Semua Pengguna" },
                { role: "user" as const, label: "Hanya Kepala Departemen" },
                { role: "admin" as const, label: "Admin SDM" },
                { role: "super_admin" as const, label: "Super Admin" },
              ].map((item) => {
                const isSelected = announcement.targetRoles.includes(item.role)
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleRoleToggle(item.role)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      isSelected
                        ? "bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700 font-bold"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Interactive Live Mockup Preview */}
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
              Pratinjau Banner di Dashboard
            </p>
            <div
              className={cn(
                "p-4 rounded-xl border flex items-start gap-3 transition-colors",
                previewColors[announcement.type || "info"].bg,
                previewColors[announcement.type || "info"].text,
                previewColors[announcement.type || "info"].border
              )}
            >
              <div className="size-8 rounded-lg bg-background/80 flex items-center justify-center shrink-0 border border-current/10 shadow-2xs">
                <PreviewIcon className="size-4 shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                    {announcement.isActive ? "Siaran Aktif" : "Pratinjau (Nonaktif)"}
                  </span>
                  <h4 className="text-sm font-bold truncate">
                    {announcement.title || "Judul Pengumuman"}
                  </h4>
                </div>
                <p className="text-xs opacity-90 whitespace-pre-line leading-relaxed">
                  {announcement.message || "Isi pesan pengumuman akan tampil di sini..."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Pesan & Amanat Pimpinan (Leader Message) */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Quote className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Amanat & Pesan Pimpinan
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Kutipan motivasi dan pengingat dari Pimpinan Pondok Modern Tazakka untuk membimbing etos kerja para asatidz dan evaluator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="leaderName" className="text-xs font-semibold">
                Nama Pimpinan & Gelar <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="leaderName"
                value={leaderMessage.leaderName}
                onChange={(e) => handleLeaderMessageChange({ leaderName: e.target.value })}
                placeholder="KH. Anang Rikza Masyhadi, M.A."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leaderTitle" className="text-xs font-semibold">
                Jabatan / Kedudukan Pimpinan <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="leaderTitle"
                value={leaderMessage.leaderTitle}
                onChange={(e) => handleLeaderMessageChange({ leaderTitle: e.target.value })}
                placeholder="Pimpinan Pondok Modern Tazakka"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="leaderMessageText" className="text-xs font-semibold">
              Teks Amanat / Petuah Pimpinan
            </Label>
            <Textarea
              id="leaderMessageText"
              rows={3}
              value={leaderMessage.messageText}
              onChange={(e) => handleLeaderMessageChange({ messageText: e.target.value })}
              placeholder="Tuliskan amanat pimpinan..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Tautan Panduan Eksternal */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ExternalLink className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Tautan Dokumen & Panduan Eksternal
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Tautan Google Drive, SOP Pesantren, atau petunjuk operasional baku yang dapat diakses oleh evaluator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="manualUrl" className="text-xs font-semibold">
              URL Berkas / Portal Panduan Eksternal (Opsional)
            </Label>
            <Input
              id="manualUrl"
              type="url"
              value={externalLinks.manualUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  externalLinks: { manualUrl: e.target.value },
                }))
              }
              placeholder="https://drive.google.com/..."
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
                Simpan Konten & Pengumuman
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
