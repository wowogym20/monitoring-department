"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Camera, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { uploadAvatarAction } from "@/lib/actions/avatar"

interface AvatarUploadFormProps {
  initialFotoUrl: string | null
  nama: string
}

export function AvatarUploadForm({
  initialFotoUrl,
  nama,
}: AvatarUploadFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    initialFotoUrl
  )
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const initials = nama
    ? nama
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran berkas maksimal 2MB")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      try {
        const result = await uploadAvatarAction(formData)
        if (result.success && result.fotoUrl) {
          setPreviewUrl(result.fotoUrl)
          toast.success(result.message || "Foto profil berhasil diperbarui")
        } else {
          toast.error(result.error || "Gagal mengunggah foto profil")
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengunggah foto"
        )
      }
    })
  }

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Foto Profil
        </CardTitle>
        <CardDescription>
          Unggah foto profil Anda (format JPG, PNG, atau WebP, maks 2MB).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <Avatar className="size-24 ring-2 ring-primary/20">
            {previewUrl && <AvatarImage src={previewUrl} alt={nama} />}
            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
          >
            <Camera className="size-6" />
          </div>
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isPending}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Pilih Foto Baru
          </Button>
          <p className="text-xs text-muted-foreground">
            Disimpan secara privat pada Supabase Storage.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

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
          Informasi Personal
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
          Ganti Kata Sandi
        </CardTitle>
        <CardDescription>
          Gunakan kata sandi baru yang kuat minimal 8 karakter.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordBaru">Kata Sandi Baru</Label>
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
            <Label htmlFor="konfirmasiPassword">Konfirmasi Kata Sandi Baru</Label>
            <Input
              id="konfirmasiPassword"
              type="password"
              placeholder="Ulangi kata sandi baru"
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
            Perbarui Kata Sandi
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
