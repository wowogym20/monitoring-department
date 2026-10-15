"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireRole, getCurrentUser } from "@/lib/auth"
import { UserRole } from "@/types/database"
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  toggleUserStatusSchema,
  resetUserPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ToggleUserStatusInput,
  type ResetUserPasswordInput,
} from "@/lib/validations/user-management"
import { DepartmentOption, getDepartmentOptionsServer } from "@/lib/actions/ketua"

export type { DepartmentOption }
export { getDepartmentOptionsServer }

export interface UserItem {
  id: string
  nama: string
  email: string
  no_hp: string | null
  foto_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  department: {
    id: string
    nama: string
    kode: string
  } | null
}

/**
 * Mengambil daftar seluruh pengguna sistem (Super Admin, SDM, dan Ketua Departemen).
 * Khusus Super Admin.
 */
export async function getUsersServer(): Promise<UserItem[]> {
  await requireRole("super_admin")

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Ambil seluruh data profil beserta relasi departemen (jika ada)
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
    .order("created_at", { ascending: false })

  if (profileErr || !profiles) {
    console.error("Gagal mengambil data pengguna:", profileErr?.message)
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
      role: p.role,
      is_active: p.is_active,
      created_at: p.created_at,
      department,
    }
  })
}

/**
 * Server Action: Buat Pengguna Baru (Khusus Super Admin)
 * Mendukung role: 'super_admin' (Super Admin), 'admin' (SDM), dan 'user' (Ketua Departemen).
 */
export async function createUserAction(input: CreateUserInput) {
  try {
    await requireRole("super_admin")

    const validated = createUserSchema.parse(input)
    const adminClient = createAdminClient()
    const supabase = await createClient()

    // 1. Jika role adalah 'user' dan memilih departemen, cek apakah departemen sudah memiliki ketua
    if (validated.role === "user" && validated.department_id) {
      const { data: targetDept } = await supabase
        .from("departments")
        .select("id, nama, ketua_id")
        .eq("id", validated.department_id)
        .maybeSingle()

      if (targetDept?.ketua_id) {
        return {
          success: false,
          error: `Departemen '${targetDept.nama}' sudah memiliki ketua. Silakan pilih departemen lain atau kosongkan.`,
        }
      }
    }

    // 2. Cek apakah email sudah terdaftar di Supabase Auth
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

    // 3. Buat akun di Supabase Auth
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

    // 4. Masukkan ke tabel public.profiles dengan role yang dipilih
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        nama: validated.nama,
        no_hp: validated.no_hp,
        role: validated.role,
        is_active: true,
      },
      { onConflict: "id" }
    )

    if (profileError) {
      // Rollback auth user jika insert profile gagal
      await adminClient.auth.admin.deleteUser(userId)
      return {
        success: false,
        error: `Gagal menyimpan profil pengguna: ${profileError.message}`,
      }
    }

    // 5. Jika role user dan memilih departemen, tetapkan ke departemen tersebut
    if (validated.role === "user" && validated.department_id) {
      const { error: assignError } = await supabase
        .from("departments")
        .update({
          ketua_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.department_id)

      if (assignError) {
        console.error("Gagal menetapkan departemen:", assignError.message)
      }
    }

    revalidatePath("/pengguna")
    revalidatePath("/ketua")
    revalidatePath("/departemen")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: `Pengguna '${validated.nama}' berhasil ditambahkan dengan role '${validated.role}'.`,
    }
  } catch (err: unknown) {
    console.error("Kesalahan createUserAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat membuat pengguna.",
    }
  }
}

/**
 * Server Action: Ubah Data Profil & Role Pengguna (Khusus Super Admin)
 */
export async function updateUserAction(input: UpdateUserInput) {
  try {
    await requireRole("super_admin")

    const validated = updateUserSchema.parse(input)
    const adminClient = createAdminClient()
    const supabase = await createClient()

    // 1. Ambil data profil & auth saat ini
    const { data: currentProfile, error: profileGetErr } = await supabase
      .from("profiles")
      .select("id, nama, role")
      .eq("id", validated.id)
      .single()

    if (profileGetErr || !currentProfile) {
      return {
        success: false,
        error: "Data profil pengguna tidak ditemukan.",
      }
    }

    const { data: currentAuth, error: authGetErr } =
      await adminClient.auth.admin.getUserById(validated.id)

    if (authGetErr || !currentAuth.user) {
      return {
        success: false,
        error: "Data autentikasi pengguna tidak ditemukan.",
      }
    }

    // 2. Jika email diubah, cek duplikasi email lain
    if (currentAuth.user.email?.toLowerCase() !== validated.email.toLowerCase()) {
      const { data: listUsers } = await adminClient.auth.admin.listUsers()
      const duplicate = listUsers?.users?.find(
        (u) =>
          u.id !== validated.id &&
          u.email?.toLowerCase() === validated.email.toLowerCase()
      )

      if (duplicate) {
        return {
          success: false,
          error: `Email '${validated.email}' sudah digunakan oleh pengguna lain.`,
        }
      }

      const { error: updateEmailErr } =
        await adminClient.auth.admin.updateUserById(validated.id, {
          email: validated.email,
          email_confirm: true,
        })

      if (updateEmailErr) {
        return {
          success: false,
          error: `Gagal memperbarui email: ${updateEmailErr.message}`,
        }
      }
    }

    // 3. Update metadata nama di auth jika nama berubah
    if (currentAuth.user.user_metadata?.nama !== validated.nama) {
      await adminClient.auth.admin.updateUserById(validated.id, {
        user_metadata: {
          ...currentAuth.user.user_metadata,
          nama: validated.nama,
        },
      })
    }

    // 4. Update tabel public.profiles
    const { error: updateProfileErr } = await adminClient
      .from("profiles")
      .update({
        nama: validated.nama,
        no_hp: validated.no_hp,
        role: validated.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)

    if (updateProfileErr) {
      return {
        success: false,
        error: `Gagal memperbarui data profil: ${updateProfileErr.message}`,
      }
    }

    // 5. Kelola penugasan departemen:
    // Lepaskan departemen sebelumnya yang diketuai oleh user ini
    const { data: existingDept } = await supabase
      .from("departments")
      .select("id")
      .eq("ketua_id", validated.id)
      .maybeSingle()

    if (validated.role === "user") {
      if (validated.department_id) {
        // Jika berganti departemen atau sebelumnya belum ada:
        if (existingDept?.id !== validated.department_id) {
          if (existingDept) {
            await supabase
              .from("departments")
              .update({ ketua_id: null, updated_at: new Date().toISOString() })
              .eq("id", existingDept.id)
          }

          // Cek apakah departemen target sudah ada ketua lain
          const { data: targetDept } = await supabase
            .from("departments")
            .select("id, nama, ketua_id")
            .eq("id", validated.department_id)
            .maybeSingle()

          if (targetDept?.ketua_id && targetDept.ketua_id !== validated.id) {
            return {
              success: false,
              error: `Departemen '${targetDept.nama}' sudah memiliki ketua lain.`,
            }
          }

          await supabase
            .from("departments")
            .update({
              ketua_id: validated.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", validated.department_id)
        }
      } else {
        // Jika department_id dikosongkan, hapus relasi lama
        if (existingDept) {
          await supabase
            .from("departments")
            .update({ ketua_id: null, updated_at: new Date().toISOString() })
            .eq("id", existingDept.id)
        }
      }
    } else {
      // Jika role bukan 'user' (misal diubah ke SDM atau Super Admin), pastikan tidak ada departemen yang dipimpin
      if (existingDept) {
        await supabase
          .from("departments")
          .update({ ketua_id: null, updated_at: new Date().toISOString() })
          .eq("id", existingDept.id)
      }
    }

    revalidatePath("/pengguna")
    revalidatePath("/ketua")
    revalidatePath("/departemen")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: `Data pengguna '${validated.nama}' berhasil diperbarui.`,
    }
  } catch (err: unknown) {
    console.error("Kesalahan updateUserAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui pengguna.",
    }
  }
}

/**
 * Server Action: Aktifkan / Nonaktifkan Akun Pengguna (Khusus Super Admin)
 */
export async function toggleUserStatusAction(input: ToggleUserStatusInput) {
  try {
    await requireRole("super_admin")
    const currentUser = await getCurrentUser()

    const validated = toggleUserStatusSchema.parse(input)

    // Cegah penonaktifan akun sendiri
    if (currentUser?.id === validated.id && !validated.is_active) {
      return {
        success: false,
        error: "Anda tidak dapat menonaktifkan akun Anda sendiri demi keamanan sistem.",
      }
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("profiles")
      .update({
        is_active: validated.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)

    if (error) {
      return {
        success: false,
        error: `Gagal mengubah status akun: ${error.message}`,
      }
    }

    revalidatePath("/pengguna")
    revalidatePath("/ketua")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: `Status akun pengguna berhasil ${validated.is_active ? "diaktifkan" : "dinonaktifkan"}.`,
    }
  } catch (err: unknown) {
    console.error("Kesalahan toggleUserStatusAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status akun.",
    }
  }
}

/**
 * Server Action: Reset Password Akun Pengguna (Khusus Super Admin)
 */
export async function resetUserPasswordAction(input: ResetUserPasswordInput) {
  try {
    await requireRole("super_admin")

    const validated = resetUserPasswordSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient.auth.admin.updateUserById(validated.id, {
      password: validated.passwordBaru,
    })

    if (error) {
      return {
        success: false,
        error: `Gagal mereset kata sandi: ${error.message}`,
      }
    }

    return {
      success: true,
      message: "Kata sandi pengguna berhasil diperbarui.",
    }
  } catch (err: unknown) {
    console.error("Kesalahan resetUserPasswordAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat mereset kata sandi.",
    }
  }
}

/**
 * Server Action: Hapus Pengguna Permanen (Khusus Super Admin)
 */
export async function deleteUserAction(input: { id: string }) {
  try {
    await requireRole("super_admin")
    const currentUser = await getCurrentUser()

    const validated = deleteUserSchema.parse(input)

    // Cegah penghapusan akun sendiri
    if (currentUser?.id === validated.id) {
      return {
        success: false,
        error: "Anda tidak dapat menghapus akun Anda sendiri.",
      }
    }

    const adminClient = createAdminClient()
    const supabase = await createClient()

    // 1. Lepaskan jabatan ketua jika user ini memimpin departemen
    await supabase
      .from("departments")
      .update({
        ketua_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("ketua_id", validated.id)

    // 2. Hapus baris dari tabel profiles
    await adminClient.from("profiles").delete().eq("id", validated.id)

    // 3. Hapus pengguna dari Supabase Auth
    const { error: deleteAuthErr } =
      await adminClient.auth.admin.deleteUser(validated.id)

    if (deleteAuthErr) {
      return {
        success: false,
        error: `Gagal menghapus akun autentikasi: ${deleteAuthErr.message}`,
      }
    }

    revalidatePath("/pengguna")
    revalidatePath("/ketua")
    revalidatePath("/departemen")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Pengguna berhasil dihapus secara permanen dari sistem.",
    }
  } catch (err: unknown) {
    console.error("Kesalahan deleteUserAction:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus pengguna.",
    }
  }
}
