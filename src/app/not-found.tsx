import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileQuestion, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center border-border shadow-lg">
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="size-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Halaman Tidak Ditemukan
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Maaf, halaman yang Anda cari tidak tersedia, telah dipindahkan, atau alamat URL yang Anda masukkan salah.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link href="/dashboard">
              <Home className="mr-2 size-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
