"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Terjadi kesalahan aplikasi:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center border-destructive/30 shadow-lg">
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Terjadi Kesalahan Sistem
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed">
            Terjadi kendala saat memproses permintaan Anda. Silakan coba muat ulang halaman ini atau kembali ke menu utama.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="flex-1 font-semibold"
          >
            <RefreshCw className="mr-2 size-4" />
            Coba Lagi
          </Button>
          <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link href="/dashboard">
              <Home className="mr-2 size-4" />
              Ke Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
