"use client"

import * as React from "react"
import { CheckSquare, Trash2, Pencil, Download, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface BulkActionBarProps {
  selectedCount: number
  entityLabel?: string
  onClearSelection: () => void
  onDelete?: () => void
  onEdit?: () => void
  onExport?: () => void
  canDelete?: boolean
  canEdit?: boolean
  canExport?: boolean
  isDeleting?: boolean
  isUpdating?: boolean
  isExporting?: boolean
  customActions?: React.ReactNode
  className?: string
}

export function BulkActionBar({
  selectedCount,
  entityLabel = "data",
  onClearSelection,
  onDelete,
  onEdit,
  onExport,
  canDelete = false,
  canEdit = false,
  canExport = false,
  isDeleting = false,
  isUpdating = false,
  isExporting = false,
  customActions,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  const isBusy = isDeleting || isUpdating || isExporting

  return (
    <div
      role="region"
      aria-label="Toolbar Aksi Massal"
      data-testid="bulk-action-bar"
      className={cn(
        // Mobile view: fixed floating bar at bottom
        "fixed bottom-4 left-3 right-3 z-40 sm:static sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto",
        "animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-1 duration-200",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:px-4 sm:py-2.5 rounded-lg border border-primary/25 bg-card/95 sm:bg-emerald-50/70 dark:sm:bg-emerald-950/30 text-card-foreground shadow-lg sm:shadow-xs backdrop-blur-md">
        {/* Info Jumlah Terpilih & Batalkan */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <CheckSquare className="size-4" />
            </span>
            <div className="text-sm font-medium leading-none">
              <span className="font-semibold text-foreground">{selectedCount}</span>{" "}
              <span className="text-muted-foreground">{entityLabel} terpilih</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isBusy}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Batalkan semua pilihan baris"
          >
            <X className="size-3.5 mr-1" />
            <span className="hidden xs:inline">Batal</span>
          </Button>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {customActions}

          {canExport && onExport && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isBusy}
              className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-muted cursor-pointer"
              aria-label={`Ekspor ${selectedCount} ${entityLabel} terpilih ke Excel`}
            >
              {isExporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>Ekspor</span>
            </Button>
          )}

          {canEdit && onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={isBusy}
              className="h-8 px-2.5 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              aria-label={`Ubah ${selectedCount} ${entityLabel} terpilih secara massal`}
            >
              {isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pencil className="size-3.5" />
              )}
              <span>Ubah Massal</span>
            </Button>
          )}

          {canDelete && onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isBusy}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer shadow-xs"
              aria-label={`Hapus ${selectedCount} ${entityLabel} terpilih secara massal`}
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              <span>Hapus Massal</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
