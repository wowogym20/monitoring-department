"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="py-12 px-4 flex items-center justify-center">
      <Card className="max-w-lg w-full text-center border-destructive/30 shadow-md">
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Gagal Memuat Halaman
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed">
            Terjadi kendala saat memuat data pada halaman ini. Pesan:{" "}
            <span className="font-mono text-xs text-destructive">
              {error.message || "Kesalahan tidak terduga"}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="font-semibold text-xs h-9"
          >
            <RefreshCw className="mr-2 size-3.5" />
            Muat Ulang Halaman
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 size-3.5" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
