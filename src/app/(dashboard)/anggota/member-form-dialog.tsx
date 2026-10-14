"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import {
  memberFormSchema,
  type MemberFormInput,
} from "@/lib/validations/member"
import {
  createMemberAction,
  updateMemberAction,
  type MemberListItem,
} from "@/lib/actions/member"
import { UserRole } from "@/types/database"

interface DepartmentOption {
  id: string
  nama: string
  kode: string
}

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberToEdit?: MemberListItem | null
  userRole: UserRole
  userDepartmentName?: string
  departments: DepartmentOption[]
  onSuccess: () => void
}

export function MemberFormDialog({
  open,
  onOpenChange,
  memberToEdit,
  userRole,
  userDepartmentName,
  departments,
  onSuccess,
}: MemberFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEdit = Boolean(memberToEdit)

  const form = useForm<MemberFormInput>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      nama: "",
      nip: "",
      jabatan: "",
      no_hp: "",
      is_active: true,
      department_id: "",
    },
  })

  // Reset formulir saat modal dibuka atau data yang diedit berganti
  React.useEffect(() => {
    if (open) {
      if (memberToEdit) {
        form.reset({
          nama: memberToEdit.nama,
          nip: memberToEdit.nip || "",
          jabatan: memberToEdit.jabatan,
          no_hp: memberToEdit.no_hp || "",
          is_active: memberToEdit.is_active,
          department_id: memberToEdit.department_id,
        })
      } else {
        form.reset({
          nama: "",
          nip: "",
          jabatan: "",
          no_hp: "",
          is_active: true,
          department_id: departments[0]?.id || "",
        })
      }
    }
  }, [open, memberToEdit, departments, form])

  async function onSubmit(data: MemberFormInput) {
    setIsSubmitting(true)

    try {
      if (isEdit && memberToEdit) {
        const result = await updateMemberAction({
          id: memberToEdit.id,
          nama: data.nama,
          nip: data.nip,
          jabatan: data.jabatan,
          no_hp: data.no_hp,
          is_active: data.is_active,
          department_id: userRole === "super_admin" ? data.department_id : undefined,
        })

        if (!result.success) {
          toast.error(result.error || "Gagal memperbarui anggota")
          return
        }

        toast.success(result.message || "Data anggota berhasil diperbarui")
      } else {
        const result = await createMemberAction({
          nama: data.nama,
          nip: data.nip,
          jabatan: data.jabatan,
          no_hp: data.no_hp,
          is_active: data.is_active,
          department_id: userRole === "super_admin" ? data.department_id : undefined,
        })

        if (!result.success) {
          toast.error(result.error || "Gagal menambahkan anggota")
          return
        }

        toast.success(result.message || "Anggota baru berhasil ditambahkan")
      }

      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada sistem"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Data Anggota" : "Tambah Anggota Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi anggota departemen berikut."
              : "Isi data anggota departemen yang akan dimasukkan ke sistem evaluasi."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Departemen */}
            {userRole === "super_admin" ? (
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departemen *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full" id="select-departemen">
                          <SelectValue placeholder="Pilih Departemen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.nama} ({dept.kode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Sebagai Super-Admin, wajib memilih departemen penugasan anggota.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Departemen</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                    {userDepartmentName || "Departemen Anda"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    (Otomatis sesuai akun ketua)
                  </span>
                </div>
              </div>
            )}

            {/* Nama Lengkap */}
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input
                      id="input-nama"
                      placeholder="Contoh: Ustadz Ahmad Fauzi, S.Pd."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NIG */}
            <FormField
              control={form.control}
              name="nip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIG (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      id="input-nip"
                      placeholder="Contoh: 199201012020"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Harus unik di dalam satu departemen.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jabatan */}
            <FormField
              control={form.control}
              name="jabatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jabatan *</FormLabel>
                  <FormControl>
                    <Input
                      id="input-jabatan"
                      placeholder="Contoh: Ketua Bagian / Anggota"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nomor HP */}
            <FormField
              control={form.control}
              name="no_hp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor HP (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      id="input-no-hp"
                      placeholder="Contoh: 081234567890"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Aktif */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Status Aktif</FormLabel>
                    <FormDescription>
                      Anggota aktif akan tampil pada daftar pengisian penilaian berkala.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      id="switch-is-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                id="btn-submit-member"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Simpan Perubahan" : "Tambah Anggota"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
