import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// ==============================================================================
// Script: Pembuatan Akun Super-Admin Pertama (Deploy Perdana)
// Penggunaan:
//   npx tsx scripts/create-superadmin.ts <email> <password> "<nama-lengkap>"
// ==============================================================================

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
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum disetel!")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.log(`
Penggunaan:
  npx tsx scripts/create-superadmin.ts <email> <password> "<nama-lengkap>"

Contoh:
  npx tsx scripts/create-superadmin.ts pimpinan@tazakka.or.id "RahasiaSuper2026!" "KH. Anang Rikza Masyhadi, M.A."
    `)
    process.exit(1)
  }

  const [email, password, nama] = args

  if (password.length < 8) {
    console.error("❌ Password harus memiliki minimal 8 karakter sesuai PRD!")
    process.exit(1)
  }

  console.log(`🚀 Memproses akun Super-Admin: ${email} (${nama})...`)

  // Cek apakah user sudah ada
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error("❌ Gagal membaca daftar user auth:", listError.message)
    process.exit(1)
  }

  let userId: string | null = null
  const existingUser = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (existingUser) {
    userId = existingUser.id
    console.log(`✓ Pengguna auth ditemukan (ID: ${userId}). Memperbarui password...`)
    const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { nama },
    })
    if (updateAuthErr) {
      console.error("❌ Gagal memperbarui user auth:", updateAuthErr.message)
      process.exit(1)
    }
  } else {
    console.log(`+ Membuat pengguna baru di Supabase Auth...`)
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama },
    })

    if (createError || !createData.user) {
      console.error("❌ Gagal membuat user auth:", createError?.message)
      process.exit(1)
    }
    userId = createData.user.id
    console.log(`✓ Akun auth berhasil dibuat (ID: ${userId})`)
  }

  // Set role super_admin di public.profiles
  console.log(`+ Menetapkan role 'super_admin' di public.profiles...`)
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        nama,
        role: "super_admin",
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (profileError) {
    console.error("❌ Gagal upsert profiles:", profileError.message)
    process.exit(1)
  }

  console.log("\n==================================================================")
  console.log("🎉 Akun Super-Admin Pertama Berhasil Dikonfigurasi!")
  console.log(`   Email : ${email}`)
  console.log(`   Nama  : ${nama}`)
  console.log(`   Role  : super_admin`)
  console.log("==================================================================\n")
}

main().catch((err) => {
  console.error("Terjadi error tak terduga:", err)
  process.exit(1)
})
