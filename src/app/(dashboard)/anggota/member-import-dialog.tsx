"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  importMembersAction,
  type ImportMembersResult,
} from "@/lib/actions/member"

interface MemberImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MemberImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: MemberImportDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [result, setResult] = React.useState<ImportMembersResult | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setSelectedFile(null)
        setResult(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (file) {
      const name = file.name.toLowerCase()
      if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
        toast.error("Format file harus berupa .xlsx (Excel) atau .csv")
        return
      }
      setSelectedFile(file)
      setResult(null)
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Silakan pilih file terlebih dahulu.")
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await importMembersAction(formData)
      setResult(res)

      if (res.totalSuccess > 0) {
        toast.success(`Berhasil mengimpor ${res.totalSuccess} anggota!`)
        onSuccess()
      } else {
        toast.error("Tidak ada data anggota yang berhasil diimpor.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengimpor file"
      toast.error(msg)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Impor Massal Data Anggota
          </DialogTitle>
          <DialogDescription>
            Unggah berkas Excel (.xlsx) atau CSV untuk menambahkan puluhan hingga ratusan anggota departemen sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Box Panduan & Unduh Template */}
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Format Berkas Template
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pastikan berkas memuat kolom: <span className="font-mono font-medium text-foreground">kode_departemen</span>,{" "}
                  <span className="font-mono font-medium text-foreground">nama</span>,{" "}
                  <span className="font-mono font-medium text-foreground">jabatan</span>, serta kolom opsional:{" "}
                  <span className="font-mono font-medium text-foreground">nip</span>,{" "}
                  <span className="font-mono font-medium text-foreground">no_hp</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs border-primary/40 text-primary hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              >
                <a href="/api/members/template?format=xlsx" download="template-impor-anggota.xlsx">
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template Excel (.xlsx)
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground"
              >
                <a href="/api/members/template?format=csv" download="template-impor-anggota.csv">
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template CSV (.csv)
                </a>
              </Button>
            </div>
          </div>

          {/* Area Pemilihan Berkas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Berkas (.xlsx / .csv)</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/30 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id="file-input-anggota"
                accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    Ganti Berkas
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Pilih Berkas dari Komputer
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Mendukung Excel (.xlsx) dan Comma-Separated Values (.csv)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hasil dan Feedback Impor */}
          {result && (
            <div className="rounded-lg border p-4 space-y-3 bg-card" data-testid="import-result">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-semibold">Hasil Impor:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                    {result.totalSuccess} Berhasil
                  </Badge>
                  {result.totalFailed > 0 && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
                      <AlertCircle className="mr-1 h-3.5 w-3.5 text-orange-600" />
                      {result.totalFailed} Gagal
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Total: {result.totalProcessed} baris
                  </span>
                </div>
              </div>

              {/* Rincian Error / Peringatan Baris */}
              {result.errors.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Rincian Catatan / Kendala ({result.errors.length} baris):
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/20 p-2 space-y-1.5 text-xs">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded border border-border/60 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            {err.row > 0 ? `Baris ${err.row}` : "Header"}
                          </Badge>
                          {err.nama && (
                            <span className="font-medium text-foreground">
                              {err.nama}
                            </span>
                          )}
                          {err.nip && (
                            <span className="text-muted-foreground font-mono">
                              ({err.nip})
                            </span>
                          )}
                        </div>
                        <span className="text-destructive font-normal">
                          {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            {result?.totalSuccess ? "Selesai" : "Tutup"}
          </Button>
          <Button
            type="button"
            id="btn-upload-import"
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses Berkas...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Mulai Impor
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
