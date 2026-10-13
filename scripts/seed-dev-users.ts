import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Fungsi pembaca .env.local sederhana
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum disetel di .env.local!")
  process.exit(1)
}

// Inisialisasi klien Supabase Admin (HANYA berjalan di skrip server)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface DevUserSeed {
  email: string
  password: string
  nama: string
  role: "super_admin" | "admin" | "user"
  deptKode?: string
}

const DEV_USERS: DevUserSeed[] = [
  {
    email: "superadmin@tazakka.id",
    password: "Password123!",
    nama: "KH. Anang Rikza Masyhadi, M.A.",
    role: "super_admin",
  },
  {
    email: "admin.sdm@tazakka.id",
    password: "Password123!",
    nama: "Ustadz Haris (SDM)",
    role: "admin",
  },
  {
    email: "ketua.pendidikan@tazakka.id",
    password: "Password123!",
    nama: "Ustadz Hakim (Ketua Pendidikan)",
    role: "user",
    deptKode: "PEND-AJAR",
  },
  {
    email: "ketua.ti@tazakka.id",
    password: "Password123!",
    nama: "Ustadz Fajar (Ketua TI)",
    role: "user",
    deptKode: "TI",
  },
]

async function seedDevUsers() {
  console.log("🚀 Memulai proses seeding akun dev pengguna...")

  for (const item of DEV_USERS) {
    console.log(`\nMemproses akun: ${item.email} (${item.role})...`)

    // 1. Cek apakah user sudah ada di auth.users
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error(`Gagal mengambil daftar user:`, listError.message)
      continue
    }

    let userId: string | null = null
    const existing = listData.users.find((u) => u.email?.toLowerCase() === item.email.toLowerCase())

    if (existing) {
      userId = existing.id
      console.log(`✓ User auth sudah ada (ID: ${userId}). Memperbarui password...`)
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
        password: item.password,
        email_confirm: true,
      })
      if (updateAuthError) {
        console.warn(`Peringatan: Gagal memperbarui password user auth:`, updateAuthError.message)
      }
    } else {
      console.log(`+ Membuat user baru di auth.users...`)
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: item.email,
        password: item.password,
        email_confirm: true,
        user_metadata: { nama: item.nama },
      })

      if (createError || !createData.user) {
        console.error(`Gagal membuat user auth:`, createError?.message)
        continue
      }
      userId = createData.user.id
      console.log(`✓ Berhasil dibuat di auth.users (ID: ${userId})`)
    }

    // 2. Upsert ke tabel public.profiles
    console.log(`+ Mengatur profil di public.profiles...`)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          nama: item.nama,
          role: item.role,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    if (profileError) {
      console.error(`Gagal upsert profile:`, profileError.message)
      continue
    }
    console.log(`✓ Profil berhasil diperbarui di public.profiles.`)

    // 3. Jika akun ketua departemen, asosiasikan ke departments.ketua_id
    if (item.role === "user" && item.deptKode) {
      console.log(`+ Menghubungkan ketua ke departemen kode '${item.deptKode}'...`)
      const { error: deptError } = await supabase
        .from("departments")
        .update({
          ketua_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("kode", item.deptKode)

      if (deptError) {
        console.error(`Gagal menghubungkan departemen:`, deptError.message)
      } else {
        console.log(`✓ Departemen '${item.deptKode}' berhasil diasosiasikan ke ketua.`)
      }
    }
  }

  console.log("\n=======================================================")
  console.log("🎉 Seeding 4 Akun Dev Berhasil Selesai!")
  console.log("Daftar Akun Dev (Password untuk semua: Password123!):")
  console.log("1. Super Admin : superadmin@tazakka.id")
  console.log("2. Admin (SDM) : admin.sdm@tazakka.id")
  console.log("3. Ketua DIK   : ketua.pendidikan@tazakka.id (Dept. Pendidikan)")
  console.log("4. Ketua TI    : ketua.ti@tazakka.id (Dept. Pengembangan TI)")
  console.log("=======================================================\n")
}

seedDevUsers().catch((err) => {
  console.error("Terjadi error fatal saat menjalankan seed:", err)
  process.exit(1)
})
