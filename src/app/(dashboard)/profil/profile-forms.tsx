"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  updateProfileSchema,
  updatePasswordSchema,
  UpdateProfileInput,
  UpdatePasswordInput,
} from "@/lib/validations/auth"
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/auth"

interface EditProfileFormProps {
  initialNama: string
  initialNoHp: string | null
}

export function EditProfileForm({
  initialNama,
  initialNoHp,
}: EditProfileFormProps) {
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nama: initialNama,
      no_hp: initialNoHp || "",
    },
  })

  function onSubmit(data: UpdateProfileInput) {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(data)
        if (result.success) {
          toast.success(result.message || "Profil berhasil diperbarui")
        } else {
          toast.error(result.error || "Gagal memperbarui profil")
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memperbarui profil"
        )
      }
    })
  }

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Perbarui Informasi Profil
        </CardTitle>
        <CardDescription>
          Ubah nama lengkap dan nomor kontak Anda.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              placeholder="Masukkan nama lengkap"
              disabled={isPending}
              {...register("nama")}
            />
            {errors.nama && (
              <p className="text-xs text-destructive">{errors.nama.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="no_hp">Nomor HP / WhatsApp</Label>
            <Input
              id="no_hp"
              placeholder="Contoh: 081234567890"
              disabled={isPending}
              {...register("no_hp")}
            />
            {errors.no_hp && (
              <p className="text-xs text-destructive">{errors.no_hp.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export function UpdatePasswordForm() {
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      passwordBaru: "",
      konfirmasiPassword: "",
    },
  })

  function onSubmit(data: UpdatePasswordInput) {
    startTransition(async () => {
      try {
        const result = await updatePasswordAction(data)
        if (result.success) {
          toast.success(result.message || "Password berhasil diperbarui")
          reset()
        } else {
          toast.error(result.error || "Gagal memperbarui password")
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memperbarui password"
        )
      }
    })
  }

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Ganti Password
        </CardTitle>
        <CardDescription>
          Gunakan password baru yang kuat minimal 8 karakter.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordBaru">Password Baru</Label>
            <Input
              id="passwordBaru"
              type="password"
              placeholder="Minimal 8 karakter"
              disabled={isPending}
              {...register("passwordBaru")}
            />
            {errors.passwordBaru && (
              <p className="text-xs text-destructive">
                {errors.passwordBaru.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="konfirmasiPassword">Konfirmasi Password Baru</Label>
            <Input
              id="konfirmasiPassword"
              type="password"
              placeholder="Ulangi password baru"
              disabled={isPending}
              {...register("konfirmasiPassword")}
            />
            {errors.konfirmasiPassword && (
              <p className="text-xs text-destructive">
                {errors.konfirmasiPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Perbarui Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
