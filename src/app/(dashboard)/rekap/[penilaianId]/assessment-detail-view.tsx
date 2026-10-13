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
} from "lucide-react"

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

  const isLeaderOrAdmin =
    currentUser.role === "super_admin" || currentUser.role === "admin"
  const isKetua = currentUser.role === "user"

  // Invalidate unread on mount jika ketua
  React.useEffect(() => {
    if (isKetua) {
      invalidateUnread()
    }
  }, [isKetua, invalidateUnread])

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
        toast.success(res.message || "Permintaan revisi berhasil dikirim.")
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
      {/* Tombol Kembali & Breadcrumb Navigasi */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/rekap">
            <ArrowLeft className="size-4" />
            <span>Kembali ke Rekap</span>
          </Link>
        </Button>

        <span className="text-xs text-muted-foreground">
          Periode: <span className="font-semibold text-foreground">{assessment.period_nama}</span>
        </span>
      </div>

      {/* Banner Peringatan Revisi untuk Ketua */}
      {isKetua && assessment.status === "revision_requested" && (
        <div className="p-4 rounded-lg border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-900 dark:text-orange-200">
                Penilaian Memerlukan Revisi
              </p>
              <p className="text-orange-800 dark:text-orange-300 text-xs mt-0.5">
                SDM telah meminta penyesuaian evaluasi. Tinjau catatan pada tab Komentar, lalu perbarui nilai anggota ini.
              </p>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 gap-1.5 shadow-2xs"
          >
            <Link href={`/penilaian/${assessment.member_id}`}>
              <Edit className="size-3.5" />
              <span>Ubah Penilaian</span>
            </Link>
          </Button>
        </div>
      )}

      {/* Kartu Ringkasan Informasi Anggota & Skor */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                  {assessment.member_nama}
                </CardTitle>
                <StatusBadge status={assessment.status} />
              </div>
              <CardDescription className="text-xs sm:text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{assessment.member_nip ? `NIP: ${assessment.member_nip}` : "NIP: -"}</span>
                <span>•</span>
                <span>{assessment.member_jabatan}</span>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {assessment.department_nama} ({assessment.department_kode})
                </span>
              </CardDescription>
            </div>

            {/* Skor Rata-rata Besar */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">Skor Akhir:</span>
              <SkorBadge skor={assessment.skor_rata} showScore={true} showMeaning={true} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 border-t border-border/60 bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <div>
                <span className="block text-[11px] text-muted-foreground/80">Penilai:</span>
                <span className="font-medium text-foreground">{assessment.evaluator_nama || "-"}</span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground/80">Tanggal Submit:</span>
                <span className="font-medium text-foreground">
                  {assessment.submitted_at ? formatDateId(assessment.submitted_at) : "-"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-muted-foreground/80">Pembaruan Terakhir:</span>
                <span className="font-medium text-foreground">
                  {assessment.updated_at ? formatDateTimeId(assessment.updated_at) : "-"}
                </span>
              </div>
            </div>

            {/* Baris Tombol Aksi Admin / Super Admin (Approval & Minta Revisi) */}
            {isLeaderOrAdmin && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
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

      {/* Tabs Detail: Nilai, Komentar, dan Riwayat Perubahan */}
      <Tabs defaultValue="aspek" className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto h-10 p-1 bg-muted/60">
          <TabsTrigger value="aspek" id="tab-trigger-aspek" className="text-xs sm:text-sm gap-1.5">
            <ClipboardList className="size-4" />
            <span>Nilai & Evaluasi</span>
          </TabsTrigger>
          <TabsTrigger value="komentar" id="tab-trigger-komentar" className="text-xs sm:text-sm gap-1.5 relative">
            <MessageSquare className="size-4" />
            <span>Komentar</span>
            {comments.length > 0 && (
              <Badge variant="secondary" className="size-4 p-0 text-[10px] flex items-center justify-center rounded-full ml-1">
                {comments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="riwayat" id="tab-trigger-riwayat" className="text-xs sm:text-sm gap-1.5">
            <History className="size-4" />
            <span>Riwayat Perubahan</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: NILAI PER ASPEK & CATATAN */}
        {/* ========================================================= */}
        <TabsContent value="aspek" className="space-y-4 outline-hidden">
          <Card className="border border-border shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Rincian Skor 7 Aspek Penilaian
              </CardTitle>
              <CardDescription className="text-xs">
                Evaluasi kinerja berdasarkan skala Likert 1–5 dengan bobot sama rata.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-center text-xs">No</TableHead>
                    <TableHead className="text-xs">Aspek Penilaian</TableHead>
                    <TableHead className="w-28 text-center text-xs">Nilai (1-5)</TableHead>
                    <TableHead className="w-36 text-right text-xs pr-6">Kategori</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((s, idx) => (
                    <TableRow key={s.aspect_id} className="hover:bg-muted/20">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {s.aspect_nama}
                          </span>
                          {s.aspect_deskripsi && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {s.aspect_deskripsi}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-base text-foreground">
                        {s.nilai > 0 ? s.nilai : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
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
            </CardContent>
          </Card>

          {/* Catatan Evaluasi Umum */}
          <Card className="border border-border shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Catatan Evaluasi Umum
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-1">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-md border border-border/60">
                {assessment.catatan || "(Tidak ada catatan evaluasi tertulis)"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: UTAS KOMENTAR BERULIR (PARENT_ID) */}
        {/* ========================================================= */}
        <TabsContent value="komentar" className="space-y-4 outline-hidden">
          <Card className="border border-border shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                Interaksi & Umpan Balik Penilaian
              </CardTitle>
              <CardDescription className="text-xs">
                Komentar dari SDM/Pimpinan dan tanggapan balasan dari Ketua Departemen.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-0 space-y-6">
              {/* Form Menulis Komentar Utama Baru */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/70">
                <Textarea
                  id="input-komentar-baru"
                  placeholder="Tuliskan komentar atau catatan untuk penilaian ini..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] text-xs resize-y bg-background"
                />
                <div className="flex justify-end">
                  <Button
                    id="btn-kirim-komentar"
                    size="sm"
                    onClick={handleSendComment}
                    disabled={isPending || !newComment.trim()}
                    className="gap-1.5 h-8 text-xs font-semibold"
                  >
                    <Send className="size-3.5" />
                    <span>Kirim Komentar</span>
                  </Button>
                </div>
              </div>

              {/* Daftar Komentar & Balasan */}
              {comments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  <MessageSquare className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  Belum ada komentar untuk penilaian ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-lg border border-border bg-card space-y-3 shadow-2xs"
                    >
                      {/* Header Komentar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7">
                            <AvatarImage src={comment.author_foto || undefined} />
                            <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">
                              {comment.author_nama.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
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

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDateTimeId(comment.created_at)}
                        </span>
                      </div>

                      {/* Isi Komentar */}
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap pl-9">
                        {comment.isi}
                      </p>

                      {/* Tombol Balas */}
                      <div className="pl-9 flex items-center justify-between pt-1">
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
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                        >
                          <CornerDownRight className="size-3" />
                          <span>{replyingToId === comment.id ? "Batal Balas" : "Balas"}</span>
                        </Button>
                      </div>

                      {/* Form Balasan Inline */}
                      {replyingToId === comment.id && (
                        <div className="pl-9 pt-2 space-y-2">
                          <Textarea
                            id={`input-balasan-${comment.id}`}
                            placeholder={`Tulis balasan untuk ${comment.author_nama}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-[60px] text-xs resize-y"
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
                              className="h-7 text-xs font-semibold gap-1"
                            >
                              <Send className="size-3" />
                              <span>Kirim Balasan</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Thread Balasan (Nested) */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-9 space-y-2.5 pt-2 border-t border-border/60">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="p-2.5 rounded-md bg-muted/30 border border-border/60 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">
                                    {reply.author_nama}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0"
                                  >
                                    {reply.author_role === "user" ? "Ketua" : "SDM"}
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDateTimeId(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/90 whitespace-pre-wrap">
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
        {/* TAB 3: RIWAYAT PERUBAHAN (AUDIT LOG TIMELINE) */}
        {/* ========================================================= */}
        <TabsContent value="riwayat" className="space-y-4 outline-hidden">
          <Card className="border border-border shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="size-4 text-primary" />
                Jejak Audit & Riwayat Perubahan Nilai
              </CardTitle>
              <CardDescription className="text-xs">
                Catatan kronologis siapa yang mengubah, kapan dilakukan, serta rincian nilai lama ke baru dengan label aspek.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-0">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  <History className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  Belum ada catatan riwayat perubahan untuk penilaian ini.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Dot Indikator Timeline */}
                      <div
                        className={cn(
                          "absolute -left-6 top-1 size-3 rounded-full border-2 bg-background transition-transform",
                          log.aksi === "INSERT"
                            ? "border-emerald-600 bg-emerald-500"
                            : log.aksi === "UPDATE"
                            ? "border-orange-500 bg-orange-400"
                            : "border-rose-600 bg-rose-500"
                        )}
                      />

                      <div className="p-3.5 rounded-lg border border-border bg-card space-y-2 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {log.aktor_nama}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {log.aktor_role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              melakukan <span className="font-mono font-semibold">{log.aksi}</span>
                            </span>
                          </div>

                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDateTimeId(log.waktu)}
                          </span>
                        </div>

                        {/* Deskripsi Aksi */}
                        <p className="text-xs text-foreground/90 font-medium">
                          {log.deskripsi}
                        </p>

                        {/* Rincian Perubahan (Nilai Lama -> Baru dengan label aspek ramah pengguna) */}
                        {log.perubahan && log.perubahan.length > 0 && (
                          <div className="pt-2 border-t border-border/60 space-y-1.5">
                            {log.perubahan.map((chg, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex items-center justify-between text-xs p-1.5 rounded-sm bg-muted/40 font-mono"
                              >
                                <span className="font-medium text-foreground">
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
              Status penilaian akan dialihkan menjadi <span className="font-semibold text-foreground">Perlu Revisi</span>. 
              Sampaikan catatan alasan perbaikan yang wajib ditindaklanjuti oleh Ketua Departemen.
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
