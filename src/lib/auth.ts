import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserRole, Department } from "@/types/database"

export interface CurrentUser {
  id: string
  email: string
  nama: string
  role: UserRole
  no_hp: string | null
  foto_url: string | null
  is_active: boolean
  department: Department | null
}

/**
 * Mengambil informasi pengguna yang sedang login beserta profil dan departemennya.
 * Mengembalikan null jika pengguna belum terautentikasi atau data profil tidak ditemukan.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role, no_hp, foto_url, is_active")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return null
  }

  let department: Department | null = null

  // Jika role user (ketua departemen), ambil departemen yang dipimpinnya
  if (profile.role === "user") {
    const { data: dept } = await supabase
      .from("departments")
      .select("*")
      .eq("ketua_id", user.id)
      .single()

    if (dept) {
      department = dept as Department
    }
  }

  return {
    id: user.id,
    email: user.email || "",
    nama: profile.nama,
    role: profile.role,
    no_hp: profile.no_hp || null,
    foto_url: profile.foto_url || null,
    is_active: profile.is_active,
    department,
  }
}

/**
 * Memastikan pengguna memiliki salah satu role yang diizinkan.
 * Jika belum login -> diarahkan ke /login.
 * Jika akun nonaktif -> diarahkan ke /login dengan pesan error.
 * Jika role tidak cocok -> diarahkan ke /dashboard.
 */
export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  if (!currentUser.is_active) {
    redirect("/login?error=Akun+Anda+telah+dinonaktifkan")
  }

  if (roles.length > 0 && !roles.includes(currentUser.role)) {
    redirect("/dashboard")
  }

  return currentUser
}
