import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileQuestion, LayoutDashboard } from "lucide-react"

export default function DashboardNotFound() {
  return (
    <div className="py-16 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full text-center border-border shadow-md">
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="size-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Halaman Tidak Ditemukan
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Data atau halaman yang Anda cari tidak tersedia pada sistem monitoring departemen.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 size-3.5" />
              Kembali ke Dashboard Utama
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
