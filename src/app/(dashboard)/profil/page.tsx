import { requireRole } from "@/lib/auth"
import {
  AccountProfileCard,
  EditProfileForm,
  UpdatePasswordForm,
} from "./profile-forms"
import { UserCheck } from "lucide-react"

export default async function ProfilPage() {
  const currentUser = await requireRole()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
          <UserCheck className="size-7 text-primary shrink-0" />
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi personal, foto profil, dan keamanan akun Anda.
        </p>
      </div>

      {/* Gabungan Informasi Akun & Foto Profil */}
      <AccountProfileCard
        initialFotoUrl={currentUser.foto_url}
        nama={currentUser.nama}
        email={currentUser.email}
        role={currentUser.role}
        isActive={currentUser.is_active}
        departmentNama={currentUser.department?.nama}
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
