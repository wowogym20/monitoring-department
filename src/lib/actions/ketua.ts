"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import {
  createKetuaSchema,
  updateKetuaSchema,
  deleteKetuaSchema,
  toggleKetuaStatusSchema,
  resetKetuaPasswordSchema,
  type CreateKetuaInput,
  type UpdateKetuaInput,
  type ToggleKetuaStatusInput,
  type ResetKetuaPasswordInput,
} from "@/lib/validations/master-data"

export interface DepartmentOption {
  id: string
  nama: string
  kode: string
  ketua_id: string | null
}

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
 * Mengambil daftar seluruh departemen aktif untuk opsi dropdown penetapan ketua.
 * Khusus Super Admin.
 */
export async function getDepartmentOptionsServer(): Promise<DepartmentOption[]> {
  await requireRole("super_admin")
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("departments")
    .select("id, nama, kode, ketua_id")
    .eq("is_active", true)
    .order("nama", { ascending: true })

  if (error || !data) {
    console.error("Gagal mengambil opsi departemen:", error?.message)
    return []
  }

  return data
}

/**
 * Server Action: Buat Akun Ketua Baru (Khusus Super Admin)
 * Menggunakan admin client (service role) untuk membuat auth.users,
 * kemudian membuat baris public.profiles dengan role 'user', dan opsional menetapkan departemen.
 */
export async function createKetuaAction(input: CreateKetuaInput) {
  try {
    await requireRole("super_admin")

    const validated = createKetuaSchema.parse(input)
    const adminClient = createAdminClient()
    const supabase = await createClient()

    // 1. Cek jika department_id dipilih, apakah sudah memiliki ketua
    if (validated.department_id) {
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

    // 2. Cek apakah email sudah terdaftar di auth
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

    // 4. Masukkan ke tabel public.profiles dengan role user
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

    // 5. Jika memilih departemen, tetapkan ke departemen tersebut
    if (validated.department_id) {
      const { error: assignError } = await supabase
        .from("departments")
        .update({
          ketua_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.department_id)

      if (assignError) {
        console.error("Gagal menetapkan ketua ke departemen:", assignError.message)
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
 * Server Action: Ubah Data Profil & Penugasan Departemen Ketua (Khusus Super Admin)
 */
export async function updateKetuaAction(input: UpdateKetuaInput) {
  try {
    await requireRole("super_admin")

    const validated = updateKetuaSchema.parse(input)
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // 1. Ambil data user auth saat ini
    const { data: currentAuth, error: authGetErr } = await adminClient.auth.admin.getUserById(validated.id)
    if (authGetErr || !currentAuth?.user) {
      return { success: false, error: "Data akun pengguna tidak ditemukan di sistem autentikasi." }
    }

    // 2. Jika email diubah, periksa duplikasi dan update auth.users
    const currentEmail = currentAuth.user.email?.toLowerCase()
    const targetEmail = validated.email.toLowerCase()

    if (currentEmail !== targetEmail) {
      const { data: listUsers } = await adminClient.auth.admin.listUsers()
      const duplicate = listUsers?.users?.find(
        (u) => u.id !== validated.id && u.email?.toLowerCase() === targetEmail
      )
      if (duplicate) {
        return {
          success: false,
          error: `Email '${validated.email}' sudah digunakan oleh akun lain.`,
        }
      }

      const { error: updateEmailErr } = await adminClient.auth.admin.updateUserById(validated.id, {
        email: targetEmail,
        email_confirm: true,
        user_metadata: {
          nama: validated.nama,
        },
      })
      if (updateEmailErr) {
        return { success: false, error: `Gagal memperbarui email akun: ${updateEmailErr.message}` }
      }
    } else {
      // Update user_metadata nama
      await adminClient.auth.admin.updateUserById(validated.id, {
        user_metadata: {
          nama: validated.nama,
        },
      })
    }

    // 3. Update profil di public.profiles
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        nama: validated.nama,
        no_hp: validated.no_hp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .eq("role", "user")

    if (profileErr) {
      return { success: false, error: `Gagal memperbarui profil: ${profileErr.message}` }
    }

    // 4. Update penugasan departemen
    // Cari departemen lama yang saat ini dipimpin oleh ketua ini
    const { data: oldDept } = await supabase
      .from("departments")
      .select("id, nama")
      .eq("ketua_id", validated.id)
      .maybeSingle()

    const oldDeptId = oldDept?.id || null
    const newDeptId = validated.department_id || null

    if (oldDeptId !== newDeptId) {
      // Jika sebelumnya memimpin departemen dan sekarang dipindah / dikosongkan
      if (oldDeptId) {
        await supabase
          .from("departments")
          .update({ ketua_id: null, updated_at: new Date().toISOString() })
          .eq("id", oldDeptId)
      }

      // Jika ada departemen baru yang dipilih
      if (newDeptId) {
        // Pastikan departemen baru belum dipimpin orang lain
        const { data: targetDept } = await supabase
          .from("departments")
          .select("id, nama, ketua_id")
          .eq("id", newDeptId)
          .maybeSingle()

        if (targetDept?.ketua_id && targetDept.ketua_id !== validated.id) {
          return {
            success: false,
            error: `Departemen '${targetDept.nama}' sudah dipimpin oleh ketua lain.`,
          }
        }

        const { error: assignErr } = await supabase
          .from("departments")
          .update({
            ketua_id: validated.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", newDeptId)

        if (assignErr) {
          return { success: false, error: `Gagal menugaskan ke departemen baru: ${assignErr.message}` }
        }
      }
    }

    revalidatePath("/ketua")
    revalidatePath("/departemen")
    return {
      success: true,
      message: `Data ketua '${validated.nama}' berhasil diperbarui.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Hapus Akun Ketua Permanen (Khusus Super Admin)
 * Aturan Bisnis:
 * 1. Jika ketua sudah memiliki riwayat penilaian di lembar evaluasi (assessments.evaluator_id),
 *    penghapusan DITOLAK demi integritas riwayat penilaian. Admin disarankan menonaktifkan akun.
 * 2. Jika belum ada penilaian, departemen terkait dilepas dan akun dihapus permanen.
 */
export async function deleteKetuaAction(id: string) {
  try {
    await requireRole("super_admin")

    const validated = deleteKetuaSchema.parse({ id })
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // 1. Periksa riwayat penilaian ketua ini
    const { count: assessmentCount, error: countErr } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true })
      .eq("evaluator_id", validated.id)

    if (countErr) {
      return { success: false, error: `Gagal memeriksa riwayat penilaian: ${countErr.message}` }
    }

    if (assessmentCount && assessmentCount > 0) {
      return {
        success: false,
        error: `Akun ketua tidak dapat dihapus permanen karena telah memiliki riwayat penilaian (${assessmentCount} lembar penilaian). Silakan nonaktifkan akun atau lepaskan penugasan departemennya.`,
      }
    }

    // 2. Lepaskan penugasan departemen jika masih memimpin departemen
    const { error: unassignErr } = await supabase
      .from("departments")
      .update({ ketua_id: null, updated_at: new Date().toISOString() })
      .eq("ketua_id", validated.id)

    if (unassignErr) {
      return { success: false, error: `Gagal melepas departemen terkait: ${unassignErr.message}` }
    }

    // 3. Hapus profil dari public.profiles
    const { error: deleteProfileErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", validated.id)

    if (deleteProfileErr) {
      return { success: false, error: `Gagal menghapus profil ketua: ${deleteProfileErr.message}` }
    }

    // 4. Hapus akun dari auth.users via admin client
    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(validated.id)
    if (deleteAuthErr) {
      console.warn("Peringatan: Gagal menghapus auth user:", deleteAuthErr.message)
    }

    revalidatePath("/ketua")
    revalidatePath("/departemen")
    return {
      success: true,
      message: "Akun ketua departemen berhasil dihapus secara permanen.",
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

