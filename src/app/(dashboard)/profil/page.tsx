import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EditProfileForm, UpdatePasswordForm } from "./profile-forms"
import { UserRole } from "@/types/database"

export default async function ProfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role, no_hp, is_active, created_at")
    .eq("id", user.id)
    .single()

  const role: UserRole = profile?.role || "user"

  let departmentName: string | null = null
  if (role === "user") {
    const { data: dept } = await supabase
      .from("departments")
      .select("nama")
      .eq("ketua_id", user.id)
      .single()

    if (dept) {
      departmentName = dept.nama
    }
  }

  const roleLabels: Record<UserRole, { label: string; variant: "default" | "secondary" | "outline" }> = {
    super_admin: { label: "Super Admin", variant: "default" },
    admin: { label: "Admin Pengurus", variant: "secondary" },
    user: { label: "Ketua Departemen", variant: "outline" },
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi akun, kontak, dan keamanan kredensial login Anda.
        </p>
      </div>

      {/* Ringkasan Akun */}
      <Card className="border border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Informasi Akun
          </CardTitle>
          <CardDescription>
            Detail akun yang terdaftar pada sistem Monitoring Departemen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Email Terdaftar
              </span>
              <p className="text-sm font-medium text-foreground">
                {user.email || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Peran (Role)
              </span>
              <div>
                <Badge variant={roleLabels[role].variant} className="font-medium">
                  {roleLabels[role].label}
                </Badge>
              </div>
            </div>

            {role === "user" && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Departemen yang Dipimpin
                </span>
                <p className="text-sm font-medium text-foreground">
                  {departmentName || "Belum ditugaskan ke departemen"}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Status Akun
              </span>
              <div>
                <Badge
                  variant={profile?.is_active ? "default" : "destructive"}
                  className="font-medium"
                >
                  {profile?.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Edit Profil & Ganti Password */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <EditProfileForm
          initialNama={profile?.nama || ""}
          initialNoHp={profile?.no_hp || null}
        />
        <UpdatePasswordForm />
      </div>
    </div>
  )
}
