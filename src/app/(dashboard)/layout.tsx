import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/layout/app-shell"
import { UserRole } from "@/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Ambil profil akun dari public.profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role, is_active")
    .eq("id", user.id)
    .single()

  const userRole: UserRole = profile?.role || "user"
  const userName = profile?.nama || user.email?.split("@")[0] || "Pengguna"

  let departmentName: string | null = null

  // Jika role ketua (user), cari nama departemen miliknya
  if (userRole === "user") {
    const { data: dept } = await supabase
      .from("departments")
      .select("nama")
      .eq("ketua_id", user.id)
      .single()

    if (dept) {
      departmentName = dept.nama
    }
  }

  return (
    <AppShell
      user={{
        nama: userName,
        email: user.email || "",
        role: userRole,
        departmentName,
      }}
    >
      {children}
    </AppShell>
  )
}
