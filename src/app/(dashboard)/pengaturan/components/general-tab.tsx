/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useState, useRef } from "react"
import { toast } from "sonner"
import {
  Building2,
  Upload,
  RefreshCw,
  Save,
  Loader2,
  Mail,
  Phone,
  Clock,
  MapPin,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GeneralSettings } from "@/lib/settings/default-settings"
import { saveGeneralSettingsAction, uploadLogoAction } from "@/lib/actions/settings"

interface GeneralTabProps {
  initialSettings: GeneralSettings
  onSettingsSaved: (updated: GeneralSettings) => void
}

export function GeneralTab({ initialSettings, onSettingsSaved }: GeneralTabProps) {
  const [formData, setFormData] = useState<GeneralSettings>(initialSettings)
  const [previewLogo, setPreviewLogo] = useState<string>(initialSettings.logoUrl || "/Logo.jpeg")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle instant preview ketika file logo dipilih
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran file logo maksimal 3MB.")
      return
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
    if (!allowedMimes.includes(file.type)) {
      toast.error("Format file harus berupa PNG, JPEG, WebP, atau SVG.")
      return
    }

    setSelectedFile(file)

    // Instant local preview via Object URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewLogo(objectUrl)
    toast.info("Pratinjau logo diperbarui. Klik 'Simpan Pengaturan' untuk menerapkan permanen.")
  }

  const handleResetDefaultLogo = () => {
    setSelectedFile(null)
    setPreviewLogo("/Logo.jpeg")
    setFormData((prev) => ({ ...prev, logoUrl: "/Logo.jpeg" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast.info("Logo dikembalikan ke logo Tazakka bawaan.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let finalLogoUrl = formData.logoUrl

      // Jika ada file logo baru yang dipilih, unggah terlebih dahulu
      if (selectedFile) {
        setIsUploadingLogo(true)
        const uploadData = new FormData()
        uploadData.append("logo", selectedFile)

        const uploadRes = await uploadLogoAction(uploadData)
        if (!uploadRes.success || !uploadRes.data?.logoUrl) {
          toast.error(uploadRes.message || "Gagal mengunggah logo.")
          setIsSaving(false)
          setIsUploadingLogo(false)
          return
        }
        finalLogoUrl = uploadRes.data.logoUrl
        setIsUploadingLogo(false)
      }

      const updatedPayload: GeneralSettings = {
        ...formData,
        logoUrl: finalLogoUrl,
      }

      const result = await saveGeneralSettingsAction(updatedPayload)

      if (result.success) {
        toast.success(result.message)
        setFormData(updatedPayload)
        setSelectedFile(null)
        onSettingsSaved(updatedPayload)
      } else {
        toast.error(result.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan pengaturan.")
    } finally {
      setIsSaving(false)
      setIsUploadingLogo(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Logo & Identitas Aplikasi */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Identitas & Branding Aplikasi
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Atur nama sistem, logo resmi instansi, subjudul, dan informasi kepemilikan yang tampil di seluruh antarmuka.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section Logo dengan Instant Preview */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              Logo Resmi Aplikasi (Instant Preview)
            </Label>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Box Preview Logo */}
              <div className="relative group size-24 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-card flex items-center justify-center p-2 shadow-sm shrink-0">
                <img
                  src={previewLogo}
                  alt="Pratinjau Logo"
                  className="size-full object-contain aspect-square"
                />
                {selectedFile && (
                  <span className="absolute bottom-1 right-1 size-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Pratinjau Lokal Aktif" />
                )}
              </div>

              {/* Upload Controls & Penjelasan */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 text-xs font-semibold"
                  >
                    <Upload className="size-3.5" />
                    Pilih Logo Baru
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetDefaultLogo}
                    className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="size-3.5" />
                    Reset ke Logo Bawaan
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mendukung PNG, JPG, WebP, atau SVG (maksimal 3MB). Logo akan langsung tampil di sidebar dan header sistem setelah disimpan.
                </p>
              </div>
            </div>

            {/* Live Mockup Header Preview */}
            <div className="mt-4 pt-4 border-t border-border/80">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                Pratinjau Tampilan Header Navigasi
              </p>
              <div className="inline-flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-2xs max-w-sm w-full">
                <div className="size-9 rounded-full overflow-hidden shrink-0 border border-border bg-muted/20 flex items-center justify-center">
                  <img
                    src={previewLogo}
                    alt="Logo Mockup"
                    className="size-full object-cover aspect-square"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm tracking-tight truncate leading-tight text-foreground">
                    {formData.appName || "Monitoring Departemen"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate leading-tight">
                    {formData.appTagline || "Sistem Penilaian Kinerja"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Identitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="appName" className="text-xs font-semibold">
                Nama Aplikasi / Judul Sistem <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="appName"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="Contoh: Monitoring Departemen"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="appTagline" className="text-xs font-semibold">
                Tagline / Subjudul <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="appTagline"
                value={formData.appTagline}
                onChange={(e) => setFormData({ ...formData, appTagline: e.target.value })}
                placeholder="Contoh: Sistem Penilaian Kinerja"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="institutionName" className="text-xs font-semibold">
                Nama Institusi / Lembaga <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="institutionName"
                value={formData.institutionName}
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                placeholder="Contoh: Pondok Modern Tazakka"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="footerText" className="text-xs font-semibold">
                Teks Hak Cipta / Footer <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="footerText"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                placeholder="Contoh: © 2026 Pondok Modern Tazakka. All rights reserved."
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appDescription" className="text-xs font-semibold">
              Deskripsi Singkat Sistem
            </Label>
            <Textarea
              id="appDescription"
              rows={2}
              value={formData.appDescription}
              onChange={(e) => setFormData({ ...formData, appDescription: e.target.value })}
              placeholder="Deskripsi mengenai sistem monitoring dan evaluasi kinerja..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Kontak Bantuan & Layanan SDM */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base sm:text-lg font-bold">
              Layanan Bantuan & Dukungan SDM
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Informasi kontak yang disajikan kepada Kepala Departemen dan evaluator saat membutuhkan pendampingan teknis.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="supportEmail" className="text-xs font-semibold flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              Email Dukungan SDM
            </Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
              placeholder="sdm@tazakka.or.id"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supportPhone" className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="size-3.5 text-muted-foreground" />
              Nomor WhatsApp / Hotline SDM
            </Label>
            <Input
              id="supportPhone"
              value={formData.supportPhone}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              placeholder="+62 812-3456-7890"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supportHours" className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              Jam Operasional Layanan
            </Label>
            <Input
              id="supportHours"
              value={formData.supportHours}
              onChange={(e) => setFormData({ ...formData, supportHours: e.target.value })}
              placeholder="Senin - Jumat, 08:00 - 16:00 WIB"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="officeAddress" className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              Alamat Kantor / Sekretariat
            </Label>
            <Input
              id="officeAddress"
              value={formData.officeAddress}
              onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
              placeholder="Jl. Bandar-Batang km. 9, Desa Sidayu, Batang"
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
                {isUploadingLogo ? "Mengunggah Logo..." : "Menyimpan..."}
              </>
            ) : (
              <>
                <Save className="size-4" />
                Simpan Identitas & Kontak
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
