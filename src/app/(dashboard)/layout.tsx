import { cookies } from "next/headers"
import { requireRole } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"
import {
  SidebarProvider,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_PREF_COOKIE,
} from "@/components/layout/sidebar-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifikasi role dan sesi pengguna terautentikasi
  const currentUser = await requireRole()

  // Baca preferensi sidebar dari cookie di Server Component untuk menghindari hydration mismatch / flicker
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value
  const hasPrefCookie = cookieStore.get(SIDEBAR_PREF_COOKIE)?.value === "true"

  const initialCollapsed = sidebarCookie === "collapsed"
  const hasUserPreference = hasPrefCookie || Boolean(sidebarCookie)

  return (
    <SidebarProvider
      initialCollapsed={initialCollapsed}
      hasUserPreference={hasUserPreference}
    >
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
    </SidebarProvider>
  )
}
