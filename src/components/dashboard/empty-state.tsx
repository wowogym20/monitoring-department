import React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarX, Building2, ArrowRight } from "lucide-react"

export interface EmptyStateProps {
  type: "no_period" | "no_department"
  role: "user" | "admin" | "super_admin"
}

export function EmptyState({ type, role }: EmptyStateProps) {
  if (type === "no_department") {
    return (
      <Card className="border-border shadow-xs">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="p-3.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 mb-4">
            <Building2 className="size-8" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Akun Belum Ditugaskan ke Departemen
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
            Akun Anda saat ini belum ditetapkan sebagai ketua untuk departemen manapun. Silakan hubungi Administrator Pimpinan (Super-Admin) untuk menetapkan departemen kepengurusan Anda.
          </p>
          <div className="mt-6">
            <Link href="/profil">
              <Button variant="outline" size="sm" className="gap-2">
                <span>Lihat Profil Akun</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-xs">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="p-3.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-4">
          <CalendarX className="size-8" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          Belum Ada Periode Penilaian Aktif
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
          {role === "super_admin" || role === "admin"
            ? "Belum ada periode evaluasi yang terbuka dalam sistem. Anda dapat membuat dan membuka periode baru sekarang."
            : "Saat ini belum ada periode evaluasi yang dibuka oleh SDM. Formulir penilaian akan tersedia setelah periode resmi dibuka."}
        </p>

        {(role === "super_admin" || role === "admin") && (
          <div className="mt-6">
            <Link href="/periode">
              <Button variant="default" size="sm" className="gap-2">
                <span>Buka Pengelolaan Periode</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
