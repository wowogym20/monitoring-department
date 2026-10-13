"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Lock, ArrowLeft, CheckCircle2 } from "lucide-react"

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
import { ThemeToggle } from "@/components/theme-toggle"
import {
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/lib/validations/auth"
import { resetPasswordAction } from "@/lib/actions/auth"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [isSuccess, setIsSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      passwordBaru: "",
      konfirmasiPassword: "",
    },
  })

  function onSubmit(data: ResetPasswordInput) {
    startTransition(async () => {
      try {
        const result = await resetPasswordAction(data)
        if (result.success) {
          setIsSuccess(true)
          toast.success(result.message || "Password berhasil diubah")
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        } else {
          toast.error(result.error || "Gagal mengubah kata sandi")
        }
      } catch {
        toast.error("Terjadi kesalahan sistem")
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="size-3.5 rounded-full bg-primary inline-block" />
            <span className="size-3.5 rounded-full bg-secondary inline-block" />
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight">
              Monitoring Departemen
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Perbarui Kata Sandi Akun
          </p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Reset Kata Sandi</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Tentukan kata sandi baru untuk akun Anda (minimal 8 karakter).
            </CardDescription>
          </CardHeader>

          {isSuccess ? (
            <CardContent className="space-y-4 pt-2">
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                <CheckCircle2 className="size-12 text-primary animate-in zoom-in" />
                <h3 className="font-semibold text-foreground text-base">
                  Kata Sandi Berhasil Diperbarui
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Anda akan dialihkan ke halaman login dalam beberapa detik...
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Masuk Sekarang</Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordBaru" className="text-xs sm:text-sm">
                    Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="passwordBaru"
                      type="password"
                      placeholder="Minimal 8 karakter"
                      className="pl-9"
                      disabled={isPending}
                      {...register("passwordBaru")}
                    />
                  </div>
                  {errors.passwordBaru && (
                    <p className="text-xs text-destructive">
                      {errors.passwordBaru.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="konfirmasiPassword"
                    className="text-xs sm:text-sm"
                  >
                    Konfirmasi Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="konfirmasiPassword"
                      type="password"
                      placeholder="Ulangi kata sandi baru"
                      className="pl-9"
                      disabled={isPending}
                      {...register("konfirmasiPassword")}
                    />
                  </div>
                  {errors.konfirmasiPassword && (
                    <p className="text-xs text-destructive">
                      {errors.konfirmasiPassword.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Menyimpan Kata Sandi...
                    </>
                  ) : (
                    "Simpan Kata Sandi Baru"
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full text-xs">
                  <Link href="/login" className="flex items-center justify-center gap-1">
                    <ArrowLeft className="size-3.5" />
                    Batal dan Kembali ke Login
                  </Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
