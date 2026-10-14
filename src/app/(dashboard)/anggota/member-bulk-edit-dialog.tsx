"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Pencil, Loader2, Building2, CheckCircle2, Briefcase } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  bulkUpdateMemberSchema,
  type BulkUpdateMemberInput,
} from "@/lib/validations/member"
import { bulkUpdateMembersAction } from "@/lib/actions/member"
import { UserRole } from "@/types/database"

interface DepartmentOption {
  id: string
  nama: string
  kode: string
}

interface MemberBulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedMemberIds: string[]
  userRole: UserRole
  departments: DepartmentOption[]
  onSuccess: () => void
}

export function MemberBulkEditDialog({
  open,
  onOpenChange,
  selectedMemberIds,
  userRole,
  departments,
  onSuccess,
}: MemberBulkEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isSuperAdmin = userRole === "super_admin"

  const form = useForm<BulkUpdateMemberInput>({
    resolver: zodResolver(bulkUpdateMemberSchema),
    defaultValues: {
      memberIds: selectedMemberIds,
      is_active: "keep",
      department_id: "",
      ubah_jabatan: false,
      jabatan: "",
    },
  })

  const watchedStatus = useWatch({
    control: form.control,
    name: "is_active",
  })

  const watchedDepartmentId = useWatch({
    control: form.control,
    name: "department_id",
  })

  const watchedJabatan = useWatch({
    control: form.control,
    name: "jabatan",
  })

  // Sinkronisasi form saat dialog dibuka
  React.useEffect(() => {
    if (open) {
      form.reset({
        memberIds: selectedMemberIds,
        is_active: "keep",
        department_id: "",
        ubah_jabatan: false,
        jabatan: "",
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: BulkUpdateMemberInput) {
    setIsSubmitting(true)
    try {
      const res = await bulkUpdateMembersAction({
        ...values,
        memberIds: selectedMemberIds,
      })

      if (!res.success) {
        toast.error(res.error || "Gagal memperbarui data anggota")
        return
      }

      toast.success(res.message || "Data anggota berhasil diperbarui")
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Pencil className="h-5 w-5 text-primary" />
            Ubah Data Massal ({selectedMemberIds.length} Anggota)
          </DialogTitle>
          <DialogDescription>
            Pilih kolom yang ingin diubah serentak untuk seluruh data anggota yang terpilih. Kolom
            yang dibiarkan &quot;Tidak Diubah&quot; atau nonaktif tidak akan memengaruhi data yang ada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Status Keaktifan */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-status" className="text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-muted-foreground" />
              Status Keaktifan
            </Label>
            <Select
              value={watchedStatus || "keep"}
              onValueChange={(val: "keep" | "active" | "inactive") => {
                form.setValue("is_active", val, { shouldValidate: true })
              }}
            >
              <SelectTrigger id="bulk-status" className="cursor-pointer">
                <SelectValue placeholder="Pilih tindakan status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Tidak Diubah (Pertahankan Status Masing-masing)</SelectItem>
                <SelectItem value="active">Ubah Semua Menjadi: Aktif</SelectItem>
                <SelectItem value="inactive">Ubah Semua Menjadi: Nonaktif</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.is_active && (
              <p className="text-xs text-destructive">
                {form.formState.errors.is_active.message}
              </p>
            )}
          </div>

          {/* Pemindahan Departemen (Khusus Super Admin) */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="bulk-dept" className="text-xs font-semibold flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                Pindah Departemen (Khusus Super Admin)
              </Label>
              <Select
                value={watchedDepartmentId || "none"}
                onValueChange={(val) => {
                  form.setValue("department_id", val === "none" ? "" : val, {
                    shouldValidate: true,
                  })
                }}
              >
                <SelectTrigger id="bulk-dept" className="cursor-pointer">
                  <SelectValue placeholder="Pilih departemen tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Diubah (Tetap di Departemen Semula)</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama} ({d.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.department_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.department_id.message}
                </p>
              )}
            </div>
          )}

          {/* Ubah Jabatan Serentak (Opsional) */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-jabatan" className="text-xs font-semibold flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-muted-foreground" />
              Ubah Jabatan Serentak (Opsional)
            </Label>
            <Input
              id="bulk-jabatan"
              placeholder="Masukkan jabatan baru (misal: Staf Pengajar)..."
              value={watchedJabatan || ""}
              onChange={(e) => {
                const val = e.target.value
                form.setValue("jabatan", val, { shouldValidate: true })
                form.setValue("ubah_jabatan", Boolean(val.trim().length > 0))
              }}
              className="bg-background cursor-text"
            />
            <p className="text-[11px] text-muted-foreground">
              Kosongkan kolom ini jika ingin mempertahankan jabatan masing-masing anggota.
            </p>
            {form.formState.errors.jabatan && (
              <p className="text-xs text-destructive">
                {form.formState.errors.jabatan.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan Perubahan...
                </>
              ) : (
                `Simpan Perubahan (${selectedMemberIds.length})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
