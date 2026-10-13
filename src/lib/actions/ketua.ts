"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import {
  createKetuaSchema,
  toggleKetuaStatusSchema,
  resetKetuaPasswordSchema,
  type CreateKetuaInput,
  type ToggleKetuaStatusInput,
  type ResetKetuaPasswordInput,
} from "@/lib/validations/master-data"

export interface KetuaAccountItem {
  id: string
  nama: string
  email: string
  no_hp: string | null
  foto_url: string | null
  is_active: boolean
  created_at: string
  department: {
    id: string
    nama: string
    kode: string
  } | null
}

/**
 * Mengambil daftar seluruh akun ketua departemen (role: user) beserta informasi departemen yang dipimpin.
 * Khusus Super Admin.
 */
export async function getKetuaAccountsServer(): Promise<KetuaAccountItem[]> {
  await requireRole("super_admin")

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Ambil data profil role user beserta departemen yang dipimpin
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select(
      `
      id,
      nama,
      no_hp,
      foto_url,
      role,
      is_active,
      created_at,
      departments(id, nama, kode)
    `
    )
    .eq("role", "user")
    .order("nama", { ascending: true })

  if (profileErr || !profiles) {
    console.error("Gagal mengambil akun ketua:", profileErr?.message)
    return []
  }

  // 2. Ambil email akun dari auth.users via admin client
  const { data: authUsersData } = await adminClient.auth.admin.listUsers()
  const emailMap = new Map<string, string>()
  authUsersData?.users?.forEach((u) => {
    if (u.email) {
      emailMap.set(u.id, u.email)
    }
  })

  return profiles.map((p) => {
    const deptData = p.departments as unknown as
      | { id: string; nama: string; kode: string }
      | Array<{ id: string; nama: string; kode: string }>
      | null

    let department: { id: string; nama: string; kode: string } | null = null
    if (Array.isArray(deptData) && deptData.length > 0) {
      department = deptData[0]
    } else if (deptData && !Array.isArray(deptData) && "id" in deptData) {
      department = deptData
    }

    return {
      id: p.id,
      nama: p.nama,
      email: emailMap.get(p.id) || "-",
      no_hp: p.no_hp,
      foto_url: p.foto_url,
      is_active: p.is_active,
      created_at: p.created_at,
      department,
    }
  })
}

/**
 * Server Action: Buat Akun Ketua Baru (Khusus Super Admin)
 * Menggunakan admin client (service role) untuk membuat auth.users,
 * kemudian membuat baris public.profiles dengan role 'user'.
 */
export async function createKetuaAction(input: CreateKetuaInput) {
  try {
    await requireRole("super_admin")

    const validated = createKetuaSchema.parse(input)
    const adminClient = createAdminClient()

    // 1. Cek apakah email sudah terdaftar di auth
    const { data: listUsers } = await adminClient.auth.admin.listUsers()
    const existing = listUsers?.users?.find(
      (u) => u.email?.toLowerCase() === validated.email.toLowerCase()
    )

    if (existing) {
      return {
        success: false,
        error: `Pengguna dengan email '${validated.email}' sudah terdaftar.`,
      }
    }

    // 2. Buat akun di Supabase Auth
    const { data: authResult, error: authError } =
      await adminClient.auth.admin.createUser({
        email: validated.email,
        password: validated.password,
        email_confirm: true,
        user_metadata: {
          nama: validated.nama,
        },
      })

    if (authError || !authResult.user) {
      return {
        success: false,
        error: `Gagal membuat akun autentikasi: ${authError?.message || "Terjadi kesalahan"}`,
      }
    }

    const userId = authResult.user.id

    // 3. Masukkan ke tabel public.profiles dengan role user
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        nama: validated.nama,
        no_hp: validated.no_hp,
        role: "user",
        is_active: true,
      },
      { onConflict: "id" }
    )

    if (profileError) {
      // Rollback auth user jika insert profile gagal
      await adminClient.auth.admin.deleteUser(userId)
      return {
        success: false,
        error: `Gagal menyimpan profil ketua: ${profileError.message}`,
      }
    }

    revalidatePath("/ketua")
    revalidatePath("/departemen")
    return {
      success: true,
      message: `Akun ketua untuk '${validated.nama}' (${validated.email}) berhasil dibuat.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Aktifkan / Nonaktifkan Akun Ketua (Khusus Super Admin)
 */
export async function toggleKetuaStatusAction(input: ToggleKetuaStatusInput) {
  try {
    await requireRole("super_admin")

    const validated = toggleKetuaStatusSchema.parse(input)
    const supabase = await createClient()

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: validated.is_active })
      .eq("id", validated.id)
      .eq("role", "user")

    if (error) {
      return { success: false, error: `Gagal mengubah status akun: ${error.message}` }
    }

    revalidatePath("/ketua")
    revalidatePath("/departemen")
    return {
      success: true,
      message: `Akun ketua berhasil di${validated.is_active ? "aktifkan" : "nonaktifkan"}.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Reset Password Akun Ketua (Khusus Super Admin)
 */
export async function resetKetuaPasswordAction(input: ResetKetuaPasswordInput) {
  try {
    await requireRole("super_admin")

    const validated = resetKetuaPasswordSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient.auth.admin.updateUserById(validated.id, {
      password: validated.passwordBaru,
    })

    if (error) {
      return { success: false, error: `Gagal mereset password: ${error.message}` }
    }

    revalidatePath("/ketua")
    return {
      success: true,
      message: "Password akun ketua berhasil direset.",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}
