import { requireRole } from "@/lib/auth"
import { getAssessmentDetailServer, PenilaianDetailData } from "@/lib/actions/penilaian"
import { AssessmentForm } from "./assessment-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"

interface FormPenilaianAnggotaPageProps {
  params: Promise<{ anggotaId: string }>
  searchParams: Promise<{ periodeId?: string }>
}

export default async function FormPenilaianAnggotaPage({
  params,
  searchParams,
}: FormPenilaianAnggotaPageProps) {
  // Hanya super_admin dan ketua departemen (user) yang boleh mengakses formulir penilaian
  // Admin SDM dilarang membuka form ini sesuai PRD Bagian 10 tabel matriks akses
  await requireRole("super_admin", "user")

  const { anggotaId } = await params
  const { periodeId } = await searchParams

  let detailData: PenilaianDetailData | null = null
  let errorMsg: string | null = null

  try {
    detailData = await getAssessmentDetailServer(anggotaId, periodeId)
  } catch (error: unknown) {
    errorMsg = error instanceof Error ? error.message : "Gagal memuat formulir penilaian."
  }

  if (errorMsg || !detailData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <Card className="border-destructive/40 shadow-sm text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <ShieldAlert className="size-6" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">
              Akses Ditolak atau Data Tidak Ditemukan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed" data-testid="error-message">
              {errorMsg}
            </p>
            <Button asChild variant="outline" size="sm" className="text-xs h-9">
              <Link href="/penilaian">
                <ArrowLeft className="size-3.5 mr-1.5" /> Kembali ke Daftar Penilaian
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AssessmentForm initialData={detailData} />
}
