import React from "react"
import { Badge } from "@/components/ui/badge"
import { AssessmentStatus } from "@/types/database"
import { cn } from "@/lib/utils"
import {
  FileEdit,
  Send,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
} from "lucide-react"

export type ExtendedAssessmentStatus = AssessmentStatus | "unassessed"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: ExtendedAssessmentStatus | null | undefined
}

interface StatusConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  badgeClass: string
  description: string
}

const STATUS_CONFIG: Record<ExtendedAssessmentStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
    description: "Disimpan, belum final, hanya terlihat ketua",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    badgeClass:
      "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/60",
    description: "Sudah dikirim, terlihat SDM dan pimpinan",
  },
  revision_requested: {
    label: "Revision Requested",
    icon: AlertCircle,
    badgeClass:
      "bg-orange-700 text-white border-orange-800 dark:bg-orange-800 dark:border-orange-900 hover:bg-orange-700 dark:hover:bg-orange-800 shadow-2xs",
    description: "SDM meminta perbaikan",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    badgeClass:
      "bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-700 dark:border-emerald-800 hover:bg-emerald-700 shadow-2xs",
    description: "Disetujui SDM",
  },
  unassessed: {
    label: "Belum Dinilai",
    icon: CircleDashed,
    badgeClass:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900",
    description: "Belum ada penilaian pada periode ini",
  },
}

/**
 * Komponen StatusBadge untuk status penilaian PRD Bagian 9.
 * Selalu memadukan ikon + label teks agar aksesibel tanpa mengandalkan warna semata.
 */
export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const normalizedKey: ExtendedAssessmentStatus =
    status && STATUS_CONFIG[status] ? status : "unassessed"
  const config = STATUS_CONFIG[normalizedKey]
  const Icon = config.icon

  return (
    <div className={cn("inline-flex items-center", className)} {...props}>
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-colors",
          config.badgeClass
        )}
        title={config.description}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{config.label}</span>
      </Badge>
    </div>
  )
}
