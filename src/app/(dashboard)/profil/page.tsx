import { requireRole } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  EditProfileForm,
  UpdatePasswordForm,
  AvatarUploadForm,
} from "./profile-forms"
import { UserRole } from "@/types/database"

export default async function ProfilPage() {
  const currentUser = await requireRole()

  const roleLabels: Record<
    UserRole,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    super_admin: { label: "Super-Admin (Pimpinan)", variant: "default" },
    admin: { label: "Admin (SDM)", variant: "secondary" },
    user: { label: "Ketua Departemen", variant: "outline" },
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi personal, foto profil, dan keamanan akun Anda.
        </p>
      </div>

      {/* Ringkasan Akun (Informasi Baca-Saja) */}
      <Card className="border border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Informasi Akun
          </CardTitle>
          <CardDescription>
            Peran dan atribusi departemen bersifat baca-saja dan ditetapkan oleh pimpinan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Email Akun
              </span>
              <p className="text-sm font-semibold text-foreground">
                {currentUser.email}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Peran Pengguna (Role)
              </span>
              <div>
                <Badge
                  variant={roleLabels[currentUser.role].variant}
                  className="font-medium"
                >
                  {roleLabels[currentUser.role].label}
                </Badge>
              </div>
            </div>

            {currentUser.role === "user" && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Departemen yang Dipimpin
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {currentUser.department?.nama || "Belum ditugaskan ke departemen"}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Status Akun
              </span>
              <div>
                <Badge
                  variant={currentUser.is_active ? "default" : "destructive"}
                  className="font-medium"
                >
                  {currentUser.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Foto Profil */}
      <AvatarUploadForm
        initialFotoUrl={currentUser.foto_url}
        nama={currentUser.nama}
      />

      {/* Form Edit Profil & Ganti Password */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <EditProfileForm
          initialNama={currentUser.nama}
          initialNoHp={currentUser.no_hp}
        />
        <UpdatePasswordForm />
      </div>
    </div>
  )
}
