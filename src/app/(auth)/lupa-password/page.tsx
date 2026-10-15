"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

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
import { AppFooter } from "@/components/layout/app-footer"
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
} from "@/lib/validations/auth"
import { forgotPasswordAction } from "@/lib/actions/auth"

export default function LupaPasswordPage() {
  const [isPending, startTransition] = React.useTransition()
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(data: ForgotPasswordInput) {
    startTransition(async () => {
      try {
        const result = await forgotPasswordAction(data)
        if (result.success) {
          setIsSubmitted(true)
          toast.success(result.message || "Tautan pemulihan telah dikirim")
        } else {
          toast.error(result.error || "Gagal memproses permintaan")
        }
      } catch {
        toast.error("Terjadi kesalahan sistem")
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-between items-center bg-background px-4 pt-8 pb-3 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 my-auto py-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="size-3.5 rounded-full bg-primary inline-block" />
            <span className="size-3.5 rounded-full bg-secondary inline-block" />
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight">
              Monitoring Departemen
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pemulihan Akses Akun Pengguna
          </p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Lupa Kata Sandi</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Masukkan alamat email Anda untuk menerima instruksi reset kata sandi.
            </CardDescription>
          </CardHeader>

          {isSubmitted ? (
            <CardContent className="space-y-4 pt-2">
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                <CheckCircle2 className="size-12 text-primary animate-in zoom-in" />
                <h3 className="font-semibold text-foreground text-base">
                  Email Terkirim
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Tautan pemulihan telah dikirim ke email Anda. Silakan periksa
                  kotak masuk Anda dan ikuti instruksi selanjutnya.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="size-4" />
                  Kembali ke Halaman Login
                </Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">
                    Alamat Email Terdaftar
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@tazakka.or.id"
                      className="pl-9"
                      disabled={isPending}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
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
                      Mengirim Tautan...
                    </>
                  ) : (
                    "Kirim Tautan Reset Password"
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full text-xs">
                  <Link href="/login" className="flex items-center justify-center gap-1">
                    <ArrowLeft className="size-3.5" />
                    Kembali ke Login
                  </Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>

      <AppFooter className="max-w-md" />
    </div>
  )
}
