"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { loginSchema, LoginInput } from "@/lib/validations/auth"
import { loginAction } from "@/lib/actions/auth"
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
import { Loader2, Lock, Mail, ShieldAlert, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { AppFooter } from "@/components/layout/app-footer"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/dashboard"
  const errorParam = searchParams.get("error")

  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  React.useEffect(() => {
    if (errorParam) {
      toast.error(errorParam)
    }
  }, [errorParam])

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await loginAction(data)
      if (!result.success) {
        toast.error(result.error || "Gagal masuk ke sistem")
      } else {
        toast.success("Berhasil masuk. Mengalihkan...")
        router.push(redirectUrl)
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat mencoba login.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-2 border-border/90 dark:border-border/70 shadow-xl shadow-black/5 dark:shadow-black/40 ring-1 ring-border/50 dark:ring-white/10 bg-card/95 backdrop-blur-xs">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Masuk ke Akun</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Gunakan email dan kata sandi yang telah didaftarkan oleh pimpinan.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Field Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">
              Alamat Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="nama@tazakka.or.id"
                className="pl-9"
                disabled={isLoading}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <ShieldAlert className="size-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Field Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs sm:text-sm">
                Kata Sandi
              </Label>
              <Link
                href="/lupa-password"
                className="text-xs text-primary hover:underline font-medium dark:text-emerald-400"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10"
                disabled={isLoading}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer z-10 p-0.5"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <ShieldAlert className="size-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              "Masuk ke Sistem"
            )}
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link href="/" className="flex items-center justify-center gap-1.5">
              <ArrowLeft className="size-3.5" />
              Kembali ke Beranda
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between items-center bg-background px-4 pt-8 pb-3 relative">
      {/* Navigasi Pojok Kiri Atas ke Beranda */}
      <div className="absolute top-4 left-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg px-2.5 sm:px-3 py-1.5 transition-colors cursor-pointer"
        >
          <Link href="/" aria-label="Kembali ke Beranda" id="btn-back-home">
            <ArrowLeft className="size-4 shrink-0" />
            <span className="hidden sm:inline font-medium">Kembali ke Beranda</span>
            <span className="sm:hidden font-medium">Beranda</span>
          </Link>
        </Button>
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 my-auto py-8">
        {/* Brand Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Link
            href="/"
            className="group flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1 cursor-pointer transition-transform"
            title="Kembali ke Beranda"
            aria-label="Kembali ke Beranda"
          >
            <div className="size-16 sm:size-20 rounded-full overflow-hidden border-2 border-primary/25 shadow-sm bg-muted/20 shrink-0 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-md">
              <Image
                src="/Logo.jpeg"
                alt="Logo Tazakka"
                width={80}
                height={80}
                className="size-full object-cover aspect-square"
                priority
              />
            </div>
            <div className="space-y-1 text-center">
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                Monitoring Departemen
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Standarisasi Penilaian dan Pemantauan Kinerja Internal
              </p>
            </div>
          </Link>
        </div>

        {/* Suspense wrapper for Client Component reading searchParams */}
        <React.Suspense
          fallback={
            <Card className="border-2 border-border/90 dark:border-border/70 shadow-xl shadow-black/5 dark:shadow-black/40 ring-1 ring-border/50 dark:ring-white/10 bg-card/95 backdrop-blur-xs p-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </Card>
          }
        >
          <LoginForm />
        </React.Suspense>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground">
          Tidak memiliki akun? Hubungi super-admin untuk pembuatan akses.
        </p>
      </div>

      <AppFooter className="max-w-md" />
    </div>
  )
}
