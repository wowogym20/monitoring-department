"use client"

import * as React from "react"
import {
  Calendar,
  Clock,
  User,
  IdCard,
  ExternalLink,
  FileText,
  ImageIcon,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LaporanKerjaItem } from "@/lib/actions/laporan-kerja"

interface LaporanDetailDialogProps {
  item: LaporanKerjaItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateIndo(dateStr: string) {
  try {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d)
    }
  } catch {
    // fallback
  }
  return dateStr
}

function renderStatusBadge(status: string, statusLabel: string) {
  if (status === "Y") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 gap-1 font-medium"
      >
        <CheckCircle2 className="size-3.5" />
        {statusLabel || "Disetujui"}
      </Badge>
    )
  }
  if (status === "N") {
    return (
      <Badge
        variant="outline"
        className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800 gap-1 font-medium"
      >
        <XCircle className="size-3.5" />
        {statusLabel || "Ditolak"}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800 gap-1 font-medium"
    >
      <Clock3 className="size-3.5" />
      {statusLabel || "Pending"}
    </Badge>
  )
}

export function LaporanDetailDialog({
  item,
  open,
  onOpenChange,
}: LaporanDetailDialogProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Detail Laporan Kerja
            </span>
            {renderStatusBadge(item.status, item.status_label)}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground mt-1">
            {item.judul || "Tanpa Judul"}
          </DialogTitle>
        </DialogHeader>

        {/* Informasi Pegawai & Waktu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60 text-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <User className="size-4 text-primary shrink-0" />
              <span>{item.nama_pegawai || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IdCard className="size-3.5 shrink-0" />
              <span>NIG: {item.nip ? item.nip : "-"}</span>
            </div>
          </div>

          <div className="space-y-1.5 sm:border-l sm:pl-4 border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5 shrink-0 text-primary" />
              <span>{formatDateIndo(item.tanggal)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              <span>Pukul {item.jam || "-"} WIB</span>
            </div>
          </div>
        </div>

        {/* Keterangan / Uraian Kerja */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary" />
            Uraian Pekerjaan
          </h4>
          <div className="p-4 rounded-xl border border-border/70 bg-card text-sm leading-relaxed whitespace-pre-line text-foreground/90 max-h-60 overflow-y-auto">
            {item.keterangan ? item.keterangan : "(Tidak ada uraian keterangan)"}
          </div>
        </div>

        {/* Foto Lampiran */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-primary" />
              Dokumentasi Foto
            </h4>
            {item.foto_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary gap-1"
                asChild
              >
                <a
                  href={item.foto_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3" />
                  Buka Foto Penuh
                </a>
              </Button>
            )}
          </div>

          {item.foto_url ? (
            <div className="rounded-xl border border-border/70 overflow-hidden bg-muted/20 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.foto_url}
                alt={item.judul}
                loading="lazy"
                className="max-h-80 w-auto rounded-lg object-contain"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = "none"
                  const parent = target.parentElement
                  if (parent) {
                    const fallback = document.createElement("div")
                    fallback.className =
                      "py-10 text-xs text-muted-foreground text-center"
                    fallback.innerText = "Foto tidak dapat dimuat dari server."
                    parent.appendChild(fallback)
                  }
                }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
              Tidak ada dokumentasi foto yang dilampirkan
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
