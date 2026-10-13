"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
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
import { Loader2, Lock, Mail, ShieldAlert } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/dashboard"
  const errorParam = searchParams.get("error")

  const [isLoading, setIsLoading] = React.useState(false)

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
    <Card className="border-border shadow-md">
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
                placeholder="nama@tazakka.id"
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
                className="text-xs text-primary hover:underline font-medium"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                disabled={isLoading}
                {...register("password")}
              />
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
        </CardFooter>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="size-3.5 rounded-full bg-primary inline-block" />
            <span className="size-3.5 rounded-full bg-secondary inline-block" />
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight">
              Monitoring Departemen
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Standarisasi Penilaian dan Pemantauan Kinerja Internal
          </p>
        </div>

        {/* Suspense wrapper for Client Component reading searchParams */}
        <React.Suspense
          fallback={
            <Card className="border-border shadow-md p-6 flex justify-center">
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
    </div>
  )
}
