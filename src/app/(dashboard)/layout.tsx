import { requireRole } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifikasi role dan sesi pengguna terautentikasi
  const currentUser = await requireRole()

  return (
    <AppShell
      user={{
        nama: currentUser.nama,
        email: currentUser.email,
        role: currentUser.role,
        departmentName: currentUser.department?.nama || null,
        fotoUrl: currentUser.foto_url,
      }}
    >
      {children}
    </AppShell>
  )
}
