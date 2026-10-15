import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SuperAdminGovernanceInfo } from "@/lib/dashboard/types"
import {
  FileSpreadsheet,
  CalendarCheck,
  UserCog,
  Building,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Settings,
} from "lucide-react"

export interface SuperAdminShortcutsProps {
  governance?: SuperAdminGovernanceInfo
}

export function SuperAdminShortcuts({ governance }: SuperAdminShortcutsProps) {
  const anomalies = governance?.anomalies || []
  const hasAnomalies = anomalies.length > 0

  return (
    <div className="space-y-4">
      {/* 1. Ringkasan Tata Kelola (Akun Ketua Nonaktif / Departemen Tanpa Ketua) */}
      <Card
        className={`border shadow-xs ${
          hasAnomalies
            ? "border-orange-300 bg-orange-50/50 dark:border-orange-900/60 dark:bg-orange-950/20"
            : "border-emerald-300/60 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10"
        }`}
      >
        <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {hasAnomalies ? (
                <ShieldAlert className="size-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              )}
              <CardTitle className="text-sm sm:text-base font-bold">
                Tata Kelola & Struktur Departemen (Super-Admin)
              </CardTitle>
            </div>

            {hasAnomalies ? (
              <Badge className="bg-orange-700 text-white dark:bg-orange-800 text-xs font-bold">
                {anomalies.length} Perlu Tindakan
              </Badge>
            ) : (
              <Badge className="bg-emerald-700 text-white dark:bg-emerald-800 text-xs font-semibold">
                Semua Terisi & Aktif
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            {hasAnomalies
              ? "Terdapat departemen yang belum memiliki ketua atau akun ketua berstatus nonaktif"
              : "Seluruh 14 departemen memiliki ketua resmi dengan akun aktif."}
          </CardDescription>
        </CardHeader>

        {hasAnomalies && (
          <CardContent className="px-4 sm:px-6 pb-4 pt-1">
            <div className="divide-y divide-orange-200 dark:divide-orange-900/60">
              {anomalies.map((anom) => (
                <div
                  key={`${anom.type}-${anom.id}`}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-foreground">
                      {anom.nama}
                    </span>
                    <p className="text-xs text-orange-900 dark:text-orange-200 mt-0.5">
                      {anom.keterangan}
                    </p>
                  </div>
                  <div className="self-end sm:self-auto shrink-0">
                    <Link href={anom.actionHref}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-orange-300 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-950/80 gap-1"
                      >
                        <span>{anom.actionLabel}</span>
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 2. Pintasan Menu Akses Cepat Super-Admin */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Pintasan Cepat Tata Kelola Pimpinan
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Pintasan Ekspor */}
          <Link href="/ekspor" className="block group">
            <Card className="h-full border-border bg-card hover:bg-muted/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-2xs">
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full space-y-2">
                <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <FileSpreadsheet className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>Ekspor Rekap</span>
                    <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    Excel & PDF Laporan
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Pintasan Periode */}
          <Link href="/periode" className="block group">
            <Card className="h-full border-border bg-card hover:bg-muted/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-2xs">
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full space-y-2">
                <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <CalendarCheck className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>Kelola Periode</span>
                    <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    Buka / Tutup Periode
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Pintasan Akun Ketua */}
          <Link href="/ketua" className="block group">
            <Card className="h-full border-border bg-card hover:bg-muted/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-2xs">
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full space-y-2">
                <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <UserCog className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>Akun Ketua</span>
                    <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    Reset & Akses Login
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Pintasan Departemen */}
          <Link href="/departemen" className="block group">
            <Card className="h-full border-border bg-card hover:bg-muted/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-2xs">
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full space-y-2">
                <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <Building className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>Departemen</span>
                    <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    14 Departemen Resmi
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Pintasan Pengaturan Sistem */}
          <Link href="/pengaturan" className="block group">
            <Card className="h-full border-border bg-card hover:bg-muted/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-2xs">
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full space-y-2">
                <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <Settings className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>Pengaturan</span>
                    <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    Konfigurasi Sistem
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
