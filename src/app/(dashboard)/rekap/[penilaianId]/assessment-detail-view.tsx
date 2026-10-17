"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AssessmentDetailRekapData,
  approveAssessmentAction,
  requestRevisionAssessmentAction,
  createCommentAction,
} from "@/lib/actions/rekap"
import { useInvalidateUnreadComments } from "@/hooks/use-unread-comments"
import { formatDateId, formatDateTimeId } from "@/lib/date"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SkorBadge } from "@/components/penilaian/skor-badge"
import { StatusBadge } from "@/components/penilaian/status-badge"

import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  History,
  ClipboardList,
  Edit,
  Send,
  CornerDownRight,
  Clock,
  Sparkles,
  Building,
  Calendar,
  UserCheck,
  FileText,
  ClipboardCheck,
  Briefcase,
  Award,
} from "lucide-react"
import { parseAssessmentComments } from "@/lib/penilaian"

interface AssessmentDetailViewProps {
  data: AssessmentDetailRekapData
}

export function AssessmentDetailView({ data }: AssessmentDetailViewProps) {
  const router = useRouter()
  const invalidateUnread = useInvalidateUnreadComments()
  const [isPending, startTransition] = useTransition()

  // State untuk dialog minta revisi
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [revisionComment, setRevisionComment] = useState("")

  // State untuk komentar
  const [newComment, setNewComment] = useState("")
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  const { assessment, scores, comments, auditLogs, currentUser } = data
  const evaluationComments = parseAssessmentComments(assessment.catatan)

  const isLeaderOrAdmin =
    currentUser.role === "super_admin" || currentUser.role === "admin"
  const isKetua = currentUser.role === "user"

  // Invalidate unread on mount jika ketua
  React.useEffect(() => {
    if (isKetua) {
      invalidateUnread()
    }
  }, [isKetua, invalidateUnread])

  // Inisial nama anggota
  const memberInitials = assessment.member_nama
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Handler: Setujui Penilaian
  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveAssessmentAction({ assessmentId: assessment.id })
      if (res.success) {
        toast.success(res.message || "Penilaian berhasil disetujui.")
        invalidateUnread()
        router.refresh()
      } else {
        toast.error(res.error || "Gagal menyetujui penilaian.")
      }
    })
  }

  // Handler: Minta Revisi Penilaian
  const handleRequestRevision = () => {
    if (!revisionComment.trim()) {
      toast.error("Catatan revisi wajib diisi.")
      return
    }

    startTransition(async () => {
      const res = await requestRevisionAssessmentAction({
        assessmentId: assessment.id,
        comment: revisionComment,
      })
      if (res.success) {
        toast.error(res.message || "Permintaan revisi dan catatan berhasil dikirimkan ke Ketua Departemen.")
        setRevisionDialogOpen(false)
        setRevisionComment("")
        invalidateUnread()
        router.refresh()
      } else {
        toast.error(res.error || "Gagal mengirim permintaan revisi.")
      }
    })
  }

  // Handler: Kirim Komentar Utama
  const handleSendComment = () => {
    if (!newComment.trim()) return

    startTransition(async () => {
      const res = await createCommentAction({
        assessmentId: assessment.id,
        isi: newComment,
      })
      if (res.success) {
        toast.success("Komentar berhasil dikirim.")
        setNewComment("")
        invalidateUnread()
        router.refresh()
      } else {
        toast.error(res.error || "Gagal mengirim komentar.")
      }
    })
  }

  // Handler: Balas Komentar
  const handleSendReply = (parentId: string) => {
    if (!replyText.trim()) return

    startTransition(async () => {
      const res = await createCommentAction({
        assessmentId: assessment.id,
        parentId,
        isi: replyText,
      })
      if (res.success) {
        toast.success("Balasan berhasil dikirim.")
        setReplyText("")
        setReplyingToId(null)
        invalidateUnread()
        router.refresh()
      } else {
        toast.error(res.error || "Gagal mengirim balasan.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Bar Navigasi Kembali & Informasi Periode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground w-fit -ml-2 h-8 px-2.5"
        >
          <Link href="/rekap">
            <ArrowLeft className="size-4" />
            <span className="text-xs sm:text-sm font-medium">Kembali ke Rekapitulasi</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5 text-primary" />
          <span>Periode:</span>
          <Badge variant="outline" className="text-xs font-semibold text-foreground border-border/80">
            {assessment.period_nama}
          </Badge>
        </div>
      </div>

      {/* 2. Banner Peringatan Revisi untuk Ketua */}
      {isKetua && assessment.status === "revision_requested" && (
        <div className="p-4 sm:p-5 rounded-xl border border-orange-300 dark:border-orange-800 bg-orange-50/70 dark:bg-orange-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-sm text-orange-900 dark:text-orange-200">
                Penilaian Memerlukan Revisi
              </p>
              <p className="text-orange-800 dark:text-orange-300 text-xs leading-relaxed">
                SDM telah mengajukan catatan revisi untuk penilaian ini. Silakan tinjau tab Komentar, lalu klik tombol berikut untuk memperbarui skor.
              </p>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 gap-1.5 shadow-2xs font-semibold text-xs h-9"
          >
            <Link href={`/penilaian/${assessment.member_id}`}>
              <Edit className="size-3.5" />
              <span>Ubah Penilaian</span>
            </Link>
          </Button>
        </div>
      )}

      {/* 3. Kartu Ringkasan Utama Penilaian & Metrik Skor */}
      <Card className="border border-border/80 shadow-xs relative overflow-hidden bg-card/90">
        {/* Subtle gradient accent bar di sisi atas (PRD 10.1.D) */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-orange-500" />

        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            {/* Profil Anggota */}
            <div className="flex items-start gap-3.5">
              <div className="size-11 sm:size-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0 border border-primary/20">
                {memberInitials}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {assessment.member_nama}
                  </CardTitle>
                  <StatusBadge status={assessment.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                  <span>{assessment.member_nip ? `NIG: ${assessment.member_nip}` : "NIG: -"}</span>
                  <span>•</span>
                  <span>{assessment.member_jabatan}</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-[11px] font-medium border-border/80 bg-background">
                    <Building className="size-3 mr-1 text-primary" />
                    {assessment.department_nama} ({assessment.department_kode})
                  </Badge>
                </div>
              </div>
            </div>

            {/* Skor Rata-rata Besar & Terstruktur */}
            <div className="flex items-center md:items-end justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 gap-3 shrink-0">
              <div className="flex flex-col md:items-end gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Skor Akhir
                </span>
                <SkorBadge skor={assessment.skor_rata} showScore={true} showMeaning={true} />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Footer Card Informasi Metadata & Tombol Aksi */}
        <CardContent className="p-4 sm:p-6 pt-3 border-t border-border/60 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
              <div>
                <span className="block text-[11px] text-muted-foreground">Penilai:</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="size-3 text-primary" />
                  {assessment.evaluator_nama || "-"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground">Tanggal Submit:</span>
                <span className="font-semibold text-foreground font-mono mt-0.5 block">
                  {assessment.submitted_at ? formatDateId(assessment.submitted_at) : "-"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground">Pembaruan Terakhir:</span>
                <span className="font-semibold text-foreground font-mono mt-0.5 block">
                  {assessment.updated_at ? formatDateTimeId(assessment.updated_at) : "-"}
                </span>
              </div>
            </div>

            {/* Tombol Aksi Approval & Revisi SDM/Pimpinan */}
            {isLeaderOrAdmin && (
              <div className="flex items-center gap-2 flex-wrap shrink-0 pt-1 sm:pt-0">
                {/* Tombol Minta Revisi (Oren) */}
                {(assessment.status === "submitted" || assessment.status === "approved") && (
                  <Button
                    id="btn-minta-revisi"
                    variant="outline"
                    size="sm"
                    onClick={() => setRevisionDialogOpen(true)}
                    disabled={isPending}
                    className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 gap-1.5 h-9 text-xs font-semibold shadow-2xs"
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>Minta Revisi</span>
                  </Button>
                )}

                {/* Tombol Setujui (Emerald) */}
                {assessment.status === "submitted" && (
                  <Button
                    id="btn-setujui"
                    size="sm"
                    onClick={handleApprove}
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-xs font-semibold shadow-2xs"
                  >
                    <CheckCircle className="size-3.5" />
                    <span>Setujui</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Tabs Rinci: Nilai Aspek, Komentar, dan Riwayat */}
      <Tabs defaultValue="aspek" className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto h-11 p-1 bg-muted/70 rounded-xl">
          <TabsTrigger
            value="aspek"
            id="tab-trigger-aspek"
            className="text-xs sm:text-sm font-semibold gap-1.5 rounded-lg data-[state=active]:shadow-xs"
          >
            <ClipboardList className="size-4" />
            <span>Nilai & Evaluasi</span>
          </TabsTrigger>
          <TabsTrigger
            value="komentar"
            id="tab-trigger-komentar"
            className="text-xs sm:text-sm font-semibold gap-1.5 rounded-lg data-[state=active]:shadow-xs relative"
          >
            <MessageSquare className="size-4" />
            <span>Komentar</span>
            {comments.length > 0 && (
              <Badge
                variant="secondary"
                className="size-4 p-0 text-[10px] font-bold flex items-center justify-center rounded-full ml-1 bg-primary/15 text-primary"
              >
                {comments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="riwayat"
            id="tab-trigger-riwayat"
            className="text-xs sm:text-sm font-semibold gap-1.5 rounded-lg data-[state=active]:shadow-xs"
          >
            <History className="size-4" />
            <span>Riwayat Perubahan</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: NILAI PER ASPEK & CATATAN EVALUASI */}
        {/* ========================================================= */}
        <TabsContent value="aspek" className="space-y-4 outline-hidden animate-in fade-in-50 duration-200">
          <Card className="border border-border/80 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/15 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    Rincian Skor 7 Aspek Penilaian Kinerja
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Skala Likert 1–5 dengan bobot sama rata (skor rata-rata dibagi 7).
                  </CardDescription>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex text-xs font-medium">
                  7 Aspek Resmi
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Tampilan Desktop: Tabel Tabular 4 Kolom */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-14 text-center text-xs font-semibold py-3 px-3">No.</TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-4">Aspek Penilaian</TableHead>
                      <TableHead className="w-28 text-center text-xs font-semibold py-3 px-3">Nilai (1-5)</TableHead>
                      <TableHead className="w-36 text-right text-xs font-semibold py-3 px-4">Kategori</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map((s, idx) => (
                      <TableRow key={s.aspect_id} className="hover:bg-muted/20 border-b border-border/50 last:border-b-0">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground px-3">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-foreground">
                              {s.aspect_nama}
                            </span>
                            {s.aspect_deskripsi && (
                              <span className="text-[11px] text-muted-foreground mt-0.5">
                                {s.aspect_deskripsi}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-3">
                          <div className="inline-flex size-7 rounded-full items-center justify-center font-bold text-xs bg-muted font-mono border border-border/80">
                            {s.nilai > 0 ? s.nilai : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-4">
                          {s.nilai > 0 ? (
                            <SkorBadge skor={s.nilai} showScore={false} />
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Tampilan Mobile: Kartu Skor Responsif Bebas Scroll Horizontal (360px+) */}
              <div className="block sm:hidden divide-y divide-border/50">
                {scores.map((s, idx) => (
                  <div key={s.aspect_id} className="p-3.5 space-y-2 hover:bg-muted/15 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-foreground">
                          {s.aspect_nama}
                        </h4>
                        {s.aspect_deskripsi && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {s.aspect_deskripsi}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Capaian Skor:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex size-6 rounded-full items-center justify-center font-bold text-xs bg-muted font-mono border border-border/80">
                          {s.nilai > 0 ? s.nilai : "-"}
                        </div>
                        {s.nilai > 0 ? (
                          <SkorBadge skor={s.nilai} showScore={false} />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tiga Komentar Evaluasi: Evaluasi, Proker, & Hasil Usaha */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/15 border-b border-border/60">
              <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Catatan Evaluasi, Proker, & Hasil Usaha
              </CardTitle>
              <CardDescription className="text-xs">
                Catatan dan umpan balik komprehensif dari penilai untuk anggota ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* 1. Evaluasi Kinerja */}
              <div className="space-y-1.5 p-3.5 rounded-lg border border-border/70 bg-muted/20">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ClipboardCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>1. Evaluasi Kinerja & Pengembangan</span>
                </div>
                <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-6">
                  {evaluationComments.evaluasi ? (
                    evaluationComments.evaluasi
                  ) : (
                    <span className="italic text-muted-foreground text-xs">
                      (Tidak ada catatan evaluasi tertulis)
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Program Kerja (Proker) */}
              <div className="space-y-1.5 p-3.5 rounded-lg border border-border/70 bg-muted/20">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Briefcase className="size-4 text-blue-600 dark:text-blue-400" />
                  <span>2. Catatan Program Kerja (Proker)</span>
                </div>
                <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-6">
                  {evaluationComments.proker ? (
                    evaluationComments.proker
                  ) : (
                    <span className="italic text-muted-foreground text-xs">
                      (Tidak ada catatan program kerja tertulis)
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Hasil Usaha & Capaian */}
              <div className="space-y-1.5 p-3.5 rounded-lg border border-border/70 bg-muted/20">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Award className="size-4 text-amber-600 dark:text-amber-400" />
                  <span>3. Hasil Usaha & Capaian</span>
                </div>
                <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-6">
                  {evaluationComments.hasil_usaha ? (
                    evaluationComments.hasil_usaha
                  ) : (
                    <span className="italic text-muted-foreground text-xs">
                      (Tidak ada catatan hasil usaha tertulis)
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: UTAS KOMENTAR BERULIR (THREADED) */}
        {/* ========================================================= */}
        <TabsContent value="komentar" className="space-y-4 outline-hidden animate-in fade-in-50 duration-200">
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-muted/15">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                Utas Komentar & Umpan Balik Penilaian
              </CardTitle>
              <CardDescription className="text-xs">
                Komentar klarifikasi dari SDM/Pimpinan dan tanggapan dari Ketua Departemen.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-5">
              {/* Form Tulis Komentar Utama */}
              <div className="space-y-2.5 p-3.5 bg-muted/25 rounded-xl border border-border/70">
                <Textarea
                  id="input-komentar-baru"
                  placeholder="Tuliskan komentar atau catatan untuk penilaian ini..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[75px] text-xs resize-y bg-background"
                />
                <div className="flex justify-end">
                  <Button
                    id="btn-kirim-komentar"
                    size="sm"
                    onClick={handleSendComment}
                    disabled={isPending || !newComment.trim()}
                    className="gap-1.5 h-8 px-3.5 text-xs font-semibold shadow-2xs"
                  >
                    <Send className="size-3.5" />
                    <span>Kirim Komentar</span>
                  </Button>
                </div>
              </div>

              {/* Daftar Komentar & Balasan */}
              {comments.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-xs space-y-1">
                  <MessageSquare className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-medium text-foreground">Belum ada komentar</p>
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan form di atas untuk menuliskan catatan atau pertanyaan pertama.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-2xs"
                    >
                      {/* Header Komentar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 sm:size-8 border border-border/60">
                            <AvatarImage src={comment.author_foto || undefined} />
                            <AvatarFallback className="text-[11px] bg-primary text-primary-foreground font-bold">
                              {comment.author_nama.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {comment.author_nama}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 font-medium",
                                comment.author_role === "super_admin"
                                  ? "border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                                  : comment.author_role === "admin"
                                  ? "border-primary text-primary bg-primary/5"
                                  : "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/40"
                              )}
                            >
                              {comment.author_role === "super_admin"
                                ? "Pimpinan"
                                : comment.author_role === "admin"
                                ? "Admin SDM"
                                : "Ketua"}
                            </Badge>
                          </div>
                        </div>

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="size-3" />
                          {formatDateTimeId(comment.created_at)}
                        </span>
                      </div>

                      {/* Isi Komentar */}
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap pl-9.5">
                        {comment.isi}
                      </p>

                      {/* Tombol Balas */}
                      <div className="pl-9.5 flex items-center justify-between pt-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (replyingToId === comment.id) {
                              setReplyingToId(null)
                            } else {
                              setReplyingToId(comment.id)
                              setReplyText("")
                            }
                          }}
                          className="h-6 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1"
                        >
                          <CornerDownRight className="size-3" />
                          <span>{replyingToId === comment.id ? "Batal Balas" : "Balas"}</span>
                        </Button>
                      </div>

                      {/* Form Balasan Inline */}
                      {replyingToId === comment.id && (
                        <div className="pl-9.5 pt-1 space-y-2">
                          <Textarea
                            id={`input-balasan-${comment.id}`}
                            placeholder={`Tulis balasan untuk ${comment.author_nama}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-[60px] text-xs resize-y bg-background"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReplyingToId(null)}
                              className="h-7 text-xs"
                            >
                              Batal
                            </Button>
                            <Button
                              id={`btn-kirim-balasan-${comment.id}`}
                              size="sm"
                              onClick={() => handleSendReply(comment.id)}
                              disabled={isPending || !replyText.trim()}
                              className="h-7 text-xs font-semibold gap-1 shadow-2xs"
                            >
                              <Send className="size-3" />
                              <span>Kirim Balasan</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Thread Balasan (Nested) */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-9.5 space-y-2.5 pt-2 border-t border-border/50">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-foreground">
                                    {reply.author_nama}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 font-medium"
                                  >
                                    {reply.author_role === "user" ? "Ketua" : "SDM"}
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {formatDateTimeId(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {reply.isi}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: RIWAYAT PERUBAHAN (AUDIT TIMELINE BERLABEL ASPEK) */}
        {/* ========================================================= */}
        <TabsContent value="riwayat" className="space-y-4 outline-hidden animate-in fade-in-50 duration-200">
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-muted/15">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <History className="size-4 text-primary" />
                Jejak Audit & Riwayat Perubahan Nilai
              </CardTitle>
              <CardDescription className="text-xs">
                Kronologi audit perubahan status dan penyesuaian nilai aspek.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {auditLogs.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-xs space-y-1">
                  <History className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-medium text-foreground">Belum ada riwayat perubahan</p>
                  <p className="text-[11px] text-muted-foreground">
                    Setiap mutasi nilai dan transisi status akan otomatis tercatat di sini.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Dot Indikator Timeline */}
                      <div
                        className={cn(
                          "absolute -left-6 top-1.5 size-3 rounded-full border-2 bg-background transition-transform",
                          log.aksi === "INSERT"
                            ? "border-emerald-600 bg-emerald-500"
                            : log.aksi === "UPDATE"
                            ? "border-orange-500 bg-orange-400"
                            : "border-rose-600 bg-rose-500"
                        )}
                      />

                      <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card space-y-2.5 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {log.aktor_nama}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-medium"
                            >
                              {log.aktor_role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              melakukan aksi <span className="font-mono font-bold text-foreground">{log.aksi}</span>
                            </span>
                          </div>

                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Clock className="size-3" />
                            {formatDateTimeId(log.waktu)}
                          </span>
                        </div>

                        {/* Deskripsi Aksi */}
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                          {log.deskripsi}
                        </p>

                        {/* Rincian Perubahan (Label Aspek Ramah Pengguna) */}
                        {log.perubahan && log.perubahan.length > 0 && (
                          <div className="pt-2 border-t border-border/50 space-y-1.5">
                            {log.perubahan.map((chg, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 font-mono"
                              >
                                <span className="font-semibold text-foreground">
                                  {chg.label}:
                                </span>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className="text-muted-foreground line-through">
                                    {chg.nilai_lama !== null && chg.nilai_lama !== undefined
                                      ? String(chg.nilai_lama)
                                      : "(Belum diisi)"}
                                  </span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {chg.nilai_baru !== null && chg.nilai_baru !== undefined
                                      ? String(chg.nilai_baru)
                                      : "(Kosong)"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Konfirmasi Permintaan Revisi (Wajib Mengisi Catatan) */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-orange-600">
              <AlertTriangle className="size-5" />
              Minta Revisi Penilaian
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Status penilaian akan dialihkan ke mode revisi. Sampaikan catatan alasan perbaikan yang wajib ditindaklanjuti oleh Ketua Departemen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">
              Catatan / Instruksi Revisi <span className="text-rose-500">*</span>
            </label>
            <Textarea
              id="input-catatan-revisi"
              placeholder="Contoh: Nilai aspek kerja sama tim perlu ditinjau kembali dengan melampirkan eviden kehadiran..."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              className="min-h-[100px] text-xs resize-y"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevisionDialogOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              id="btn-konfirmasi-revisi"
              size="sm"
              onClick={handleRequestRevision}
              disabled={isPending || revisionComment.trim().length < 3}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Send className="size-3.5" />
              <span>Kirim Permintaan Revisi</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
