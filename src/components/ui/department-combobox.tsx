"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DepartmentOption {
  id: string
  nama: string
  kode: string
}

export interface DepartmentComboboxProps {
  departments: DepartmentOption[]
  value?: string | null
  onValueChange: (deptId: string) => void
  disabled?: boolean
  id?: string
  className?: string
  includeAllOption?: boolean
  allLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  ariaLabel?: string
  showIcon?: boolean
}

export function DepartmentCombobox({
  departments,
  value,
  onValueChange,
  disabled = false,
  id = "select-filter-dept",
  className,
  includeAllOption = true,
  allLabel = "Semua Departemen",
  placeholder = "Pilih Departemen",
  searchPlaceholder = "Cari nama atau kode departemen...",
  ariaLabel = "Filter departemen",
  showIcon = true,
}: DepartmentComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setSearchQuery("")
    }
  }

  // Auto-focus keyboard saat popover dibuka
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Cari departemen yang terpilih
  const selectedDept = useMemo(() => {
    if (!value || value === "all") return null
    return departments.find((d) => d.id === value) || null
  }, [departments, value])

  // Hitung daftar yang cocok untuk memastikan tombol Enter selalu memilih item paling atas
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const result: Array<{ id: string; nama: string; kode?: string; isAll?: boolean }> = []

    if (includeAllOption) {
      if (!q || allLabel.toLowerCase().includes(q) || "semua".includes(q)) {
        result.push({ id: "all", nama: allLabel, isAll: true })
      }
    }

    departments.forEach((d) => {
      const matchNama = d.nama.toLowerCase().includes(q)
      const matchKode = d.kode.toLowerCase().includes(q)
      if (!q || matchNama || matchKode) {
        result.push({ id: d.id, nama: d.nama, kode: d.kode })
      }
    })

    return result
  }, [departments, searchQuery, includeAllOption, allLabel])

  const handleSelect = (deptId: string) => {
    onValueChange(deptId)
    setOpen(false)
  }

  // Intersepsi keyboard: saat user menekan 'Enter' di input pencarian,
  // langsung eksekusi item teratas dari hasil saringan
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (filteredList.length > 0) {
        e.preventDefault()
        handleSelect(filteredList[0].id)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-9.5 text-xs bg-background justify-between font-normal px-3 border-border hover:bg-muted/50",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {showIcon && <Building2 className="size-3.5 text-primary shrink-0" />}
            {selectedDept ? (
              <span className="truncate text-foreground font-medium">
                {selectedDept.nama}{" "}
                <span className="text-muted-foreground text-[10px] font-mono">
                  ({selectedDept.kode})
                </span>
              </span>
            ) : value === "all" || !value ? (
              <span className="truncate text-foreground font-medium">{allLabel}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 opacity-60 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[300px] sm:w-[360px] p-0 shadow-lg border-border"
        sideOffset={4}
      >
        <Command loop shouldFilter={false} className="w-full">
          <div className="relative">
            <CommandInput
              ref={inputRef}
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              autoFocus
              className="text-xs h-10"
            />
          </div>

          <CommandList className="max-h-[260px] overflow-y-auto p-1">
            {filteredList.length === 0 ? (
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                Tidak ada departemen yang cocok dengan &quot;{searchQuery}&quot;.
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredList.map((item, idx) => {
                  const isSelected =
                    (item.isAll && (!value || value === "all")) ||
                    (!item.isAll && value === item.id)

                  return (
                    <CommandItem
                      key={item.id}
                      role="option"
                      data-value={item.id}
                      onSelect={() => handleSelect(item.id)}
                      className={cn(
                        "text-xs py-2 px-2.5 rounded-md flex items-center justify-between cursor-pointer",
                        isSelected && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {showIcon && (
                          <Building2 className="size-3.5 text-primary/70 shrink-0" />
                        )}
                        <span className="truncate">{item.nama}</span>
                        {item.kode && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 font-mono text-muted-foreground shrink-0 border-border"
                          >
                            {item.kode}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {idx === 0 && searchQuery.trim() !== "" && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 font-normal opacity-70"
                          >
                            Enter ↵
                          </Badge>
                        )}
                        {isSelected && <Check className="size-3.5 text-primary" />}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
