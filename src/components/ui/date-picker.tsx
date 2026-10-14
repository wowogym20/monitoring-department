"use client"

import * as React from "react"
import { format, isValid, startOfDay, endOfDay } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  id?: string
  name?: string
  value?: string | Date | null
  onChange?: (dateString: string, dateObj?: Date) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date | string
  maxDate?: Date | string
  className?: string
  error?: boolean
  clearable?: boolean
}

/**
 * Helper untuk mengonversi Date ke string format "YYYY-MM-DD"
 */
function formatToYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Komponen DatePicker standar shadcn/ui untuk aplikasi Tazakka.
 * Menggunakan Popover + Calendar (react-day-picker) + date-fns dengan locale Bahasa Indonesia (id).
 */
export function DatePicker({
  id: idProp,
  name,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  minDate,
  maxDate,
  className,
  error = false,
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Konversi value ke Date object yang aman
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) {
      return isValid(value) ? value : undefined
    }
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split("-").map(Number)
        const dateObj = new Date(y, m - 1, d)
        return isValid(dateObj) ? dateObj : undefined
      }
      const parsed = new Date(value)
      return isValid(parsed) ? parsed : undefined
    }
    return undefined
  }, [value])

  // Normalisasi minDate & maxDate ke Date boundaries
  const minDateObj = React.useMemo(() => {
    if (!minDate) return undefined
    if (minDate instanceof Date) return startOfDay(minDate)
    if (typeof minDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(minDate)) {
      const [y, m, d] = minDate.split("-").map(Number)
      return startOfDay(new Date(y, m - 1, d))
    }
    const parsed = new Date(minDate)
    return isValid(parsed) ? startOfDay(parsed) : undefined
  }, [minDate])

  const maxDateObj = React.useMemo(() => {
    if (!maxDate) return undefined
    if (maxDate instanceof Date) return endOfDay(maxDate)
    if (typeof maxDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(maxDate)) {
      const [y, m, d] = maxDate.split("-").map(Number)
      return endOfDay(new Date(y, m - 1, d))
    }
    const parsed = new Date(maxDate)
    return isValid(parsed) ? endOfDay(parsed) : undefined
  }, [maxDate])

  // Cek apakah suatu tanggal perlu dinonaktifkan
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (minDateObj && date < minDateObj) return true
      if (maxDateObj && date > maxDateObj) return true
      return false
    },
    [minDateObj, maxDateObj]
  )

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.("", undefined)
      return
    }
    const ymd = formatToYMD(date)
    onChange?.(ymd, date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={idProp}
          name={name}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 cursor-pointer bg-background hover:bg-muted/50 border-input",
            !selectedDate && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">
            {selectedDate ? (
              format(selectedDate, "d MMMM yyyy", { locale: id })
            ) : (
              placeholder
            )}
          </span>
          {clearable && selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Hapus tanggal"
              className="ml-auto p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onChange?.("", undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  e.preventDefault()
                  onChange?.("", undefined)
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          locale={id}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
