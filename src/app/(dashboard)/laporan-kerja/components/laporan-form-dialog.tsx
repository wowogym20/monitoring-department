"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2, Upload, X, ImageIcon, Calendar, FileText, User } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createLaporanKerjaAction,
  updateLaporanKerjaAction,
  type LaporanKerjaItem,
} from "@/lib/actions/laporan-kerja"

interface LaporanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: LaporanKerjaItem | null
  onSuccess?: () => void
}

export function LaporanFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: LaporanFormDialogProps) {
  const isEdit = Boolean(item)

  const [nip, setNip] = React.useState("")
  const [nama, setNama] = React.useState("")
  const [tanggal, setTanggal] = React.useState("")
  const [keterangan, setKeterangan] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Populate data when dialog opens
  React.useEffect(() => {
    if (item) {
      setNip(item.nip || "")
      setNama(item.judul || "")
      setTanggal(item.tanggal || "")
      setKeterangan(item.keterangan || "")
      setPreviewUrl(item.foto_url || null)
      setSelectedFile(null)
    } else {
      setNip("")
      setNama("")
      setTanggal(new Date().toISOString().split("T")[0])
      setKeterangan("")
      setPreviewUrl(null)
      setSelectedFile(null)
    }
  }, [item, open])

  // Handle photo file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB")
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEdit && !nip.trim()) {
      toast.error("NIG wajib diisi")
      return
    }
    if (!nama.trim()) {
      toast.error("Judul laporan wajib diisi")
      return
    }
    if (!tanggal) {
      toast.error("Tanggal laporan wajib diisi")
      return
    }
    if (!keterangan.trim()) {
      toast.error("Uraian keterangan wajib diisi")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("nama", nama.trim())
    formData.append("tanggal", tanggal)
    formData.append("keterangan", keterangan.trim())
    if (selectedFile) {
      formData.append("files", selectedFile)
    }

    try {
      if (isEdit && item) {
        const res = await updateLaporanKerjaAction(item.id, formData)
        if (res.success) {
          toast.success(res.message)
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error(res.message)
        }
      } else {
        formData.append("nip", nip.trim())
        const res = await createLaporanKerjaAction(formData)
        if (res.success) {
          toast.success(res.message)
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error(res.message)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEdit ? "Ubah Laporan Kerja" : "Tambah Laporan Kerja Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit
              ? "Perbarui rincian kegiatan atau dokumen foto laporan kerja ini."
              : "Isi data formulir untuk mengirimkan laporan kerja baru ke sistem absensi."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* NIP (hanya saat tambah atau info read-only saat edit) */}
          <div className="space-y-1.5">
            <Label htmlFor="nip" className="text-xs font-semibold flex items-center gap-1.5">
              <User className="size-3.5 text-primary" />
              Nomor Induk Guru
            </Label>
            <Input
              id="nip"
              placeholder="Contoh: 066"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              disabled={isEdit || isSubmitting}
              className="h-9 text-sm"
              required
            />
            {isEdit && (
              <p className="text-[11px] text-muted-foreground">
                NIP tidak dapat diubah setelah laporan dibuat.
              </p>
            )}
          </div>

          {/* Judul Laporan */}
          <div className="space-y-1.5">
            <Label htmlFor="nama" className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="size-3.5 text-primary" />
              Judul Laporan Kerja
            </Label>
            <Input
              id="nama"
              placeholder="Contoh: Pemeliharaan Jaringan & Server"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={isSubmitting}
              className="h-9 text-sm"
              required
            />
          </div>

          {/* Tanggal Laporan */}
          <div className="space-y-1.5">
            <Label htmlFor="tanggal" className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              Tanggal Pelaksanaan
            </Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={isSubmitting}
              className="h-9 text-sm"
              required
            />
          </div>

          {/* Uraian Pekerjaan */}
          <div className="space-y-1.5">
            <Label htmlFor="keterangan" className="text-xs font-semibold">
              Uraian Pekerjaan / Keterangan
            </Label>
            <Textarea
              id="keterangan"
              placeholder="Tuliskan rincian hasil kerja atau kegiatan yang dilaksanakan..."
              rows={4}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isSubmitting}
              className="text-sm resize-none"
              required
            />
          </div>

          {/* Upload Foto Dokumentasi */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-primary" />
              Dokumentasi Foto (Maks 5MB)
            </Label>

            {previewUrl ? (
              <div className="relative rounded-lg border border-border p-2 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="size-16 rounded object-cover border border-border"
                  />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">
                      {selectedFile ? selectedFile.name : "Foto Lampiran Saat Ini"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : "Tersimpan di server"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRemovePhoto}
                  disabled={isSubmitting}
                  className="text-muted-foreground hover:text-destructive"
                  title="Hapus foto"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 border-border/80 transition"
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <Upload className="size-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground font-medium">
                      Pilih atau seret file foto ke sini
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                      JPG, PNG, GIF, WEBP (Maksimal 5MB)
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isEdit ? "Simpan Perubahan" : "Kirim Laporan"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
