"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PenilaianDetailData, saveAssessmentAction, deleteAssessmentAction } from "@/lib/actions/penilaian"
import { StatusBadge } from "@/components/penilaian/status-badge"
import { SkorBadge } from "@/components/penilaian/skor-badge"
import { roundToTwoDecimals } from "@/lib/scoring"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import {
  ArrowLeft,
  Save,
  Send,
  Trash2,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  ShieldAlert,
  ClipboardCheck,
  Briefcase,
  Award,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  parseAssessmentComments,
  serializeAssessmentComments,
  type AssessmentComments,
} from "@/lib/penilaian"

interface AssessmentFormProps {
  initialData: PenilaianDetailData
}

export function AssessmentForm({ initialData }: AssessmentFormProps) {
  const router = useRouter()

  const {
    member,
    periode,
    aspects,
    assessment,
    isReadOnly,
    readOnlyReason,
    isApprovedBefore,
    isKetua,
  } = initialData

  // State nilai per aspek { [aspect_id]: nilai (1-5) }
  const [scores, setScores] = useState<Record<string, number>>(initialData.scores || {})
  const [comments, setComments] = useState<AssessmentComments>(() =>
    parseAssessmentComments(assessment?.catatan)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Hitung pratinjau rata-rata aspek aktif secara real-time
  const totalAspects = aspects.length
  const scoredCount = Object.keys(scores).filter((id) => scores[id] >= 1 && scores[id] <= 5).length
  const isComplete = scoredCount === totalAspects && totalAspects > 0

  let previewScore: number | null = null
  if (scoredCount > 0) {
    const sum = Object.values(scores).reduce((acc, curr) => acc + curr, 0)
    // Rata-rata dibagi seluruh aspek aktif sesuai PRD Bagian 8
    previewScore = roundToTwoDecimals(sum / totalAspects)
  }

  const handleScoreChange = (aspectId: string, val: number) => {
    if (isReadOnly) return
    setScores((prev) => ({
      ...prev,
      [aspectId]: val,
    }))
  }

  const handleSave = async (status: "draft" | "submitted") => {
    if (isReadOnly) return

    if (status === "submitted" && !isComplete) {
      toast.error(`Seluruh ${totalAspects} aspek wajib diisi untuk mengirim penilaian.`)
      return
    }

    setIsSubmitting(true)

    try {
      const scoresArray = Object.entries(scores).map(([aspect_id, nilai]) => ({
        aspect_id,
        nilai,
      }))

      const serializedCatatan = serializeAssessmentComments(comments)

      const res = await saveAssessmentAction({
        period_id: periode.id,
        member_id: member.id,
        status,
        catatan: serializedCatatan,
        scores: scoresArray,
      })

      if (!res.success) {
        toast.error(res.error || "Gagal menyimpan penilaian.")
        setIsSubmitting(false)
        return
      }

      toast.success(res.message)
      router.push(`/penilaian?periodeId=${periode.id}`)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
      toast.error(msg)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!assessment) return
    setIsDeleting(true)

    try {
      const res = await deleteAssessmentAction({
        assessment_id: assessment.id,
      })

      if (!res.success) {
        toast.error(res.error || "Gagal menghapus penilaian.")
        setIsDeleting(false)
        return
      }

      toast.error(res.message)
      router.push(`/penilaian?periodeId=${periode.id}`)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
      toast.error(msg)
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 pb-32 sm:pb-12 max-w-4xl mx-auto">
      {/* 1. Header Navigasi & Identitas Anggota */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Link href={`/penilaian?periodeId=${periode.id}`}>
              <ArrowLeft className="size-4 mr-1" /> Kembali ke Daftar Penilaian
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
              <User className="size-5 text-primary shrink-0" />
              {member.nama}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span>{member.nip ? `NIG: ${member.nip}` : "Tanpa NIP"}</span>
              <span>•</span>
              <span className="font-medium text-foreground">{member.jabatan}</span>
              {isKetua && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-medium text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                >
                  Kepala Departemen
                </Badge>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="size-3" /> {member.department_nama} ({member.department_kode})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <StatusBadge status={assessment?.status || "unassessed"} />
          </div>
        </div>
      </div>

      {/* 2. Banner Informasi Status Periode & Pasca-Approval */}
      {isReadOnly && readOnlyReason === "self_assessment_blocked" && (
        <div
          data-testid="banner-self-assessment-blocked"
          className="p-3.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5"
        >
          <ShieldAlert className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Penilaian Mandiri Dibatasi (Mode Baca-Saja)</p>
            <p className="mt-0.5">
              Sebagai <strong>Kepala Departemen</strong>, Anda tidak dapat menilai diri Anda sendiri. Formulir penilaian Kepala Departemen hanya dapat diisi dan diperbarui oleh <strong>Admin/Koordinator </strong> atau <strong>Super Admin</strong>.
            </p>
          </div>
        </div>
      )}

      {isReadOnly && readOnlyReason !== "self_assessment_blocked" && (
        <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <Lock className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Periode Telah Ditutup (Mode Baca-Saja)</p>
            <p className="mt-0.5">
              Periode <strong>{periode.nama}</strong> sudah berstatus ditutup (*closed*). Formulir ini hanya dapat dibaca dan tidak dapat diubah oleh ketua.
            </p>
          </div>
        </div>
      )}

      {isApprovedBefore && !isReadOnly && (
        <div className="p-3.5 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/40 dark:border-orange-900 text-orange-900 dark:text-orange-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="size-4 shrink-0 text-orange-600 mt-0.5" />
          <div>
            <p className="font-semibold">Perhatian: Penilaian Telah Disetujui (Approved)</p>
            <p className="mt-0.5">
              Menyimpan perubahan pada penilaian ini akan secara otomatis mengembalikan status menjadi{" "}
              <strong>Submitted</strong> untuk diverifikasi ulang oleh SDM sesuai aturan PRD Bagian 7.
            </p>
          </div>
        </div>
      )}

      {/* 3. Kartu Pratinjau Skor Real-time */}
      <Card className="border border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
        <CardHeader className="py-3 px-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                Periode: {periode.nama}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-muted-foreground block">
                  Pratinjau Skor ({scoredCount}/{totalAspects} terisi):
                </span>
                <SkorBadge skor={previewScore} />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 4. Daftar 7 Aspek Penilaian Skala Likert 1-5 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Aspek Penilaian ({totalAspects} Aspek)
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            {isComplete ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Semua aspek terisi
              </span>
            ) : (
              `${scoredCount} dari ${totalAspects} terisi`
            )}
          </span>
        </div>

        {aspects.map((aspect, index) => {
          const currentVal = scores[aspect.id]

          return (
            <Card
              key={aspect.id}
              className={cn(
                "border transition-all duration-150 shadow-2xs",
                currentVal
                  ? "border-border/90 bg-card"
                  : "border-border/60 bg-card/40"
              )}
            >
              <CardHeader className="py-3 px-4 sm:px-6 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                        {index + 1}
                      </span>
                      {aspect.nama}
                    </CardTitle>
                    {aspect.deskripsi && (
                      <CardDescription className="text-xs text-muted-foreground">
                        {aspect.deskripsi}
                      </CardDescription>
                    )}
                  </div>

                  {currentVal && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] font-semibold shrink-0",
                        currentVal <= 2 && "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
                        currentVal === 3 && "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
                        currentVal >= 4 && "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      )}
                    >
                      Nilai: {currentVal}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-4 sm:px-6 pt-2 pb-4">
                <RadioGroup
                  value={currentVal ? currentVal.toString() : ""}
                  onValueChange={(val) => handleScoreChange(aspect.id, parseInt(val, 10))}
                  disabled={isReadOnly || isSubmitting}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2"
                >
                  {[
                    { value: 1, label: "Sangat Kurang", color: "orange" },
                    { value: 2, label: "Kurang", color: "orange" },
                    { value: 3, label: "Cukup", color: "slate" },
                    { value: 4, label: "Baik", color: "emerald" },
                    { value: 5, label: "Sangat Baik", color: "emerald" },
                  ].map((opt) => {
                    const isChecked = currentVal === opt.value

                    return (
                      <label
                        key={opt.value}
                        htmlFor={`radio-${aspect.id}-${opt.value}`}
                        className={cn(
                          "relative flex items-center justify-between sm:flex-col sm:justify-center p-3 rounded-lg border text-xs cursor-pointer transition-all min-h-[48px]",
                          // Checked state per PRD 10.1.D:
                          isChecked && opt.color === "orange" &&
                            "border-orange-500 bg-orange-50/80 text-orange-950 dark:bg-orange-950/50 dark:text-orange-200 font-semibold ring-1.5 ring-orange-500",
                          isChecked && opt.color === "slate" &&
                            "border-slate-500 bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100 font-semibold ring-1.5 ring-slate-500",
                          isChecked && opt.color === "emerald" &&
                            "border-emerald-600 bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200 font-semibold ring-1.5 ring-emerald-600",
                          // Unchecked state:
                          !isChecked && "border-border hover:bg-muted/40",
                          isReadOnly && "cursor-not-allowed opacity-75"
                        )}
                      >
                        <div className="flex items-center gap-2.5 sm:flex-col sm:gap-1 sm:text-center flex-1 sm:w-full min-w-0 pr-2">
                          <span
                            className={cn(
                              "size-6 rounded-full inline-flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                              opt.color === "orange" &&
                                (isChecked
                                  ? "bg-orange-600 text-white"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"),
                              opt.color === "slate" &&
                                (isChecked
                                  ? "bg-slate-700 text-white"
                                  : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"),
                              opt.color === "emerald" &&
                                (isChecked
                                  ? "bg-emerald-600 text-white"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300")
                            )}
                          >
                            {opt.value}
                          </span>
                          <span className="font-medium text-xs leading-tight">
                            {opt.label}
                          </span>
                        </div>

                        {/* Hidden or visual Radio Item for accessibility and Radix state */}
                        <div className="shrink-0 sm:mt-1">
                          <RadioGroupItem
                            value={opt.value.toString()}
                            id={`radio-${aspect.id}-${opt.value}`}
                            className={cn(
                              "size-4",
                              opt.color === "orange" && "text-orange-600 border-orange-400 focus:ring-orange-400",
                              opt.color === "slate" && "text-slate-600 border-slate-400 focus:ring-slate-400",
                              opt.color === "emerald" && "text-emerald-600 border-emerald-500 focus:ring-emerald-500"
                            )}
                          />
                        </div>
                      </label>
                    )
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 5. Tiga Komentar Evaluasi: Evaluasi, Proker, & Hasil Usaha (Opsional) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Catatan Evaluasi, Proker, & Hasil Usaha (Opsional)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Berikan umpan balik terperinci meliputi evaluasi kinerja, keterlibatan program kerja, dan hasil usaha anggota.
          </p>
        </div>

        {/* 1. Evaluasi */}
        <Card className="border border-border/80 shadow-2xs">
          <CardHeader className="py-3 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardCheck className="size-4 text-primary" />
              1. Evaluasi Kinerja & Pengembangan
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Apresiasi, kedisiplinan, catatan perilaku kerja, atau rekomendasi pembinaan personal untuk anggota ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <Textarea
              id="input-catatan"
              data-testid="input-catatan-evaluasi"
              value={comments.evaluasi}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, evaluasi: e.target.value }))
              }
              disabled={isReadOnly || isSubmitting}
              placeholder="Contoh: Sangat disiplin, memiliki integritas tinggi, dan responsif terhadap arahan pimpinan..."
              className="min-h-[85px] text-xs resize-y"
              maxLength={2000}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">
              {comments.evaluasi.length}/2000 karakter
            </p>
          </CardContent>
        </Card>

        {/* 2. Proker */}
        <Card className="border border-border/80 shadow-2xs">
          <CardHeader className="py-3 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              2. Catatan Program Kerja (Proker)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Keterlibatan aktif, eksekusi tanggung jawab program, atau kendala dalam menjalankan program kerja yang diampu.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <Textarea
              id="input-catatan-proker"
              data-testid="input-catatan-proker"
              value={comments.proker}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, proker: e.target.value }))
              }
              disabled={isReadOnly || isSubmitting}
              placeholder="Contoh: Menjalankan amanah kepanitiaan ujian dan penyusunan modul tepat waktu sesuai target departemen..."
              className="min-h-[85px] text-xs resize-y"
              maxLength={2000}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">
              {comments.proker.length}/2000 karakter
            </p>
          </CardContent>
        </Card>

        {/* 3. Hasil Usaha */}
        <Card className="border border-border/80 shadow-2xs">
          <CardHeader className="py-3 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="size-4 text-primary" />
              3. Hasil Usaha & Capaian
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Hasil karya nyata, output produktivitas, inovasi perbaikan, atau kontribusi konkret bagi departemen.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <Textarea
              id="input-catatan-hasil-usaha"
              data-testid="input-catatan-hasil-usaha"
              value={comments.hasil_usaha}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, hasil_usaha: e.target.value }))
              }
              disabled={isReadOnly || isSubmitting}
              placeholder="Contoh: Berhasil meningkatkan efisiensi administrasi departemen dan menyelesaikan laporan capaian triwulan..."
              className="min-h-[85px] text-xs resize-y"
              maxLength={2000}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">
              {comments.hasil_usaha.length}/2000 karakter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 6. Sticky Bottom Action Bar (Mobile 360px & Desktop Responsive) */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-background/95 backdrop-blur-md border-t border-border z-30 shadow-lg",
          "sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:shadow-none"
        )}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          {/* Sisi Kiri: Tombol Hapus (jika ada penilaian dan periode masih open) */}
          {assessment && !isReadOnly ? (
            <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting || isSubmitting}
                    className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2 sm:h-9 sm:px-3 w-full sm:w-auto justify-center"
                    id="btn-hapus-penilaian"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3.5 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="size-3.5 mr-1" />
                    )}
                    Hapus Penilaian
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold">
                      Hapus Lembar Penilaian?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                      Penilaian untuk <strong>{member.nama}</strong> pada periode <strong>{periode.nama}</strong> akan dihapus (soft delete). Data audit akan tetap tersimpan di riwayat sistem.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-xs h-9">Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-9"
                    >
                      Ya, Hapus Penilaian
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="hidden sm:flex sm:w-auto items-center">
              <span className="text-[11px] text-muted-foreground">
                * Skor resmi dan riwayat audit dihitung otomatis oleh trigger basis data saat disimpan.
              </span>
            </div>
          )}

          {/* Sisi Kanan: Aksi Simpan Draf (Kiri) & Kirim Penilaian (Kanan) */}
          <div className="w-full sm:w-auto grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
            {isReadOnly ? (
              <Button asChild variant="outline" size="sm" className="col-span-2 sm:col-span-1 w-full sm:w-auto text-xs h-9">
                <Link href={`/penilaian?periodeId=${periode.id}`}>
                  Kembali ke Daftar
                </Link>
              </Button>
            ) : (
              <>
                {/* Tombol Kiri: Simpan Draf */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave("draft")}
                  disabled={isSubmitting || isDeleting}
                  className="w-full sm:w-auto text-xs font-semibold h-9 border-border"
                  id="btn-simpan-draf"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="size-3.5 mr-1.5 text-slate-600" />
                  )}
                  Simpan Draf
                </Button>

                {/* Tombol Kanan: Kirim Penilaian */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSave("submitted")}
                  disabled={isSubmitting || isDeleting || !isComplete}
                  className={cn(
                    "w-full sm:w-auto text-xs font-semibold h-9 text-white transition-all shadow-xs",
                    isComplete
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-emerald-600/60 cursor-not-allowed opacity-75"
                  )}
                  id="btn-kirim-penilaian"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Send className="size-3.5 mr-1.5" />
                  )}
                  Kirim Penilaian
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
