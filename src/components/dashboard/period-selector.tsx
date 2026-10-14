"use client"

import React, { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PeriodOption } from "@/lib/dashboard/types"
import { CalendarDays, Loader2 } from "lucide-react"

export interface PeriodSelectorProps {
  periods: PeriodOption[]
  selectedPeriodId: string | null
}

export function PeriodSelector({ periods, selectedPeriodId }: PeriodSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (newPeriodId: string) => {
    startTransition(() => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      if (newPeriodId) {
        current.set("periodId", newPeriodId)
      } else {
        current.delete("periodId")
      }
      const search = current.toString()
      const query = search ? `?${search}` : ""
      router.push(`${pathname}${query}`)
    })
  }

  if (periods.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg border border-dashed bg-muted/30">
        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
        <span>Belum ada periode penilaian yang dibuat.</span>
      </div>
    )
  }

  const selected = periods.find((p) => p.id === selectedPeriodId) || periods[0]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label htmlFor="period-select-trigger" className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1.5">
        <CalendarDays className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <span>Pilih Periode:</span>
      </label>

      <div className="flex items-center gap-2">
        <Select
          value={selected?.id || ""}
          onValueChange={handlePeriodChange}
          disabled={isPending}
        >
          <SelectTrigger
            id="period-select-trigger"
            className="h-9 w-full sm:w-[280px] bg-card text-xs font-medium border-border"
            aria-label="Pilih Periode Penilaian"
          >
            <div className="flex items-center gap-2 truncate">
              {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />}
              <SelectValue placeholder="Pilih Periode">
                <span className="truncate">{selected?.nama}</span>
              </SelectValue>
            </div>
          </SelectTrigger>

          <SelectContent className="max-h-[300px]">
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                <div className="flex items-center justify-between gap-3 w-full">
                  <span className="truncate font-medium">{p.nama}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 font-semibold ${
                      p.status === "open"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {p.status === "open" ? "Aktif (Open)" : "Ditutup"}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <Badge
            variant="outline"
            className={`hidden md:inline-flex text-[11px] font-semibold shrink-0 py-1 px-2.5 ${
              selected.status === "open"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {selected.status === "open" ? "Status: Terbuka" : "Status: Ditutup"}
          </Badge>
        )}
      </div>
    </div>
  )
}
