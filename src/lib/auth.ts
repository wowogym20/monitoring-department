import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserRole, Department, Profile } from "@/types/database"

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
 * Mengembalikan null HANYA jika pengguna benar-benar belum login di Supabase Auth.
 * Jika akun valid di auth.users namun baris di public.profiles belum ada,
 * fungsi ini akan otomatis menginisialisasi profil default agar tidak terjadi redirect loop.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("nama, role, no_hp, foto_url, is_active")
    .eq("id", user.id)
    .single()

  let profile: Pick<Profile, "nama" | "role" | "no_hp" | "foto_url" | "is_active"> | null = profileData

  // Jika user auth ada namun baris public.profiles belum dibuat di database:
  // Buat profil default otomatis agar sesi valid dan tidak memicu redirect loop
  if (!profile) {
    const fallbackNama =
      user.user_metadata?.nama || user.email?.split("@")[0] || "Pengguna"

    const { data: createdProfile } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        nama: fallbackNama,
        role: "user",
        is_active: true,
      })
      .select("nama, role, no_hp, foto_url, is_active")
      .single()

    if (createdProfile) {
      profile = createdProfile
    } else {
      // Fallback in-memory yang aman jika query database terkendala
      profile = {
        nama: fallbackNama,
        role: "user",
        no_hp: null,
        foto_url: null,
        is_active: true,
      }
    }
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
 * Jika akun nonaktif -> signOut dan diarahkan ke /login dengan pesan error.
 * Jika role tidak cocok -> diarahkan ke /dashboard.
 */
export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  if (!currentUser.is_active) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login?error=Akun+Anda+telah+dinonaktifkan")
  }

  if (roles.length > 0 && !roles.includes(currentUser.role)) {
    redirect("/dashboard")
  }

  return currentUser
}
