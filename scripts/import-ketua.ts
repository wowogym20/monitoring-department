import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// ==============================================================================
// Script: Import & Setup 14 Akun Ketua Departemen (Service Role - Lokal Saja)
// Digunakan sebelum peluncuran produksi untuk mengonfigurasi ketua 14 departemen.
// Penggunaan:
//   npx tsx scripts/import-ketua.ts <file.csv> [--dry-run]
// Format CSV (dengan header):
//   nama,email,departemen_kode[,password]
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
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local!")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface CsvRow {
  nama: string
  email: string
  departemen_kode: string
  password?: string
  lineNumber: number
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/)
  const rows: CsvRow[] = []

  let headerIndexMap: { [key: string]: number } = {}
  let isHeaderParsed = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("#")) continue

    // Pemisahan kolom CSV sederhana dengan penanganan kutip ganda
    const tokens: string[] = []
    let current = ""
    let insideQuotes = false

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const c = line[charIdx]
      if (c === '"') {
        insideQuotes = !insideQuotes
      } else if (c === "," && !insideQuotes) {
        tokens.push(current.trim())
        current = ""
      } else {
        current += c
      }
    }
    tokens.push(current.trim())

    const cleanTokens = tokens.map((t) => t.replace(/^["']|["']$/g, "").trim())

    if (!isHeaderParsed) {
      // Periksa header
      const lower = cleanTokens.map((t) => t.toLowerCase())
      const namaIdx = lower.indexOf("nama")
      const emailIdx = lower.indexOf("email")
      const deptIdx = lower.findIndex((k) => k === "departemen_kode" || k === "kode_departemen" || k === "kode" || k === "dept_kode")
      const passIdx = lower.indexOf("password")

      if (namaIdx !== -1 && emailIdx !== -1 && deptIdx !== -1) {
        headerIndexMap = {
          nama: namaIdx,
          email: emailIdx,
          departemen_kode: deptIdx,
          password: passIdx,
        }
        isHeaderParsed = true
        continue
      } else {
        // Asumsi format default tanpa header nama,email,departemen_kode
        headerIndexMap = { nama: 0, email: 1, departemen_kode: 2, password: 3 }
        isHeaderParsed = true
      }
    }

    const nama = cleanTokens[headerIndexMap.nama] || ""
    const email = cleanTokens[headerIndexMap.email] || ""
    const departemen_kode = cleanTokens[headerIndexMap.departemen_kode] || ""
    const password = headerIndexMap.password !== -1 && cleanTokens[headerIndexMap.password] ? cleanTokens[headerIndexMap.password] : undefined

    if (nama || email || departemen_kode) {
      rows.push({
        nama,
        email,
        departemen_kode,
        password,
        lineNumber: i + 1,
      })
    }
  }

  return rows
}

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes("--dry-run")
  const fileArgs = args.filter((a) => !a.startsWith("--"))

  if (fileArgs.length === 0) {
    console.log(`
Penggunaan:
  npx tsx scripts/import-ketua.ts <path-ke-file.csv> [--dry-run]

Contoh:
  npx tsx scripts/import-ketua.ts data/ketua-14-departemen.csv --dry-run
  npx tsx scripts/import-ketua.ts data/ketua-14-departemen.csv

Format CSV:
  nama,email,departemen_kode[,password]
    `)
    process.exit(1)
  }

  const csvPath = path.resolve(process.cwd(), fileArgs[0])
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File CSV tidak ditemukan: ${csvPath}`)
    process.exit(1)
  }

  console.log("==================================================================")
  console.log(" 🏢 IMPORT & PENETAPAN KETUA 14 DEPARTEMEN")
  console.log(` Mode     : ${isDryRun ? "🔍 DRY-RUN (Simulasi / Validasi Saja)" : "🚀 EKSEKUSI PRODUKSI"}`)
  console.log(` File CSV : ${csvPath}`)
  console.log("==================================================================\n")

  const csvContent = fs.readFileSync(csvPath, "utf-8")
  const rows = parseCsv(csvContent)

  if (rows.length === 0) {
    console.error("❌ File CSV kosong atau tidak memiliki baris data yang valid.")
    process.exit(1)
  }

  console.log(`📋 Membaca ${rows.length} baris data calon ketua...`)

  // 1. Ambil seluruh departemen dari database
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, nama, kode, ketua_id, is_active")

  if (deptError || !departments) {
    console.error("❌ Gagal memuat data departemen dari Supabase:", deptError?.message)
    process.exit(1)
  }

  const deptMap = new Map<string, typeof departments[0]>()
  for (const dept of departments) {
    deptMap.set(dept.kode.toUpperCase(), dept)
  }

  // 2. Ambil seluruh pengguna yang ada di Supabase Auth
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) {
    console.error("❌ Gagal memuat daftar pengguna auth:", listError.message)
    process.exit(1)
  }
  const existingUsers = listData.users || []
  const userByEmail = new Map<string, typeof existingUsers[0]>()
  for (const u of existingUsers) {
    if (u.email) userByEmail.set(u.email.toLowerCase(), u)
  }

  // 3. Validasi baris demi baris
  let hasValidationErrors = false
  const plannedActions: {
    row: CsvRow
    dept: typeof departments[0]
    existingUserId: string | null
    defaultPassword: string
  }[] = []

  const assignedDeptKodes = new Set<string>()

  for (const r of rows) {
    const errors: string[] = []
    if (!r.nama || r.nama.length < 3) {
      errors.push("Nama minimal 3 karakter")
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!r.email || !emailRegex.test(r.email)) {
      errors.push(`Format email tidak valid (${r.email})`)
    }

    const deptKey = r.departemen_kode.trim().toUpperCase()
    const targetDept = deptMap.get(deptKey)
    if (!targetDept) {
      errors.push(`Kode departemen '${r.departemen_kode}' tidak terdaftar di database!`)
    } else {
      if (assignedDeptKodes.has(deptKey)) {
        errors.push(`Duplikasi departemen '${r.departemen_kode}': satu departemen hanya boleh punya 1 ketua!`)
      }
      assignedDeptKodes.add(deptKey)
    }

    if (errors.length > 0) {
      hasValidationErrors = true
      console.error(`❌ Baris ${r.lineNumber} [${r.email || "Tanpa Email"}]: ${errors.join("; ")}`)
    } else if (targetDept) {
      const existingUser = userByEmail.get(r.email.toLowerCase())
      plannedActions.push({
        row: r,
        dept: targetDept,
        existingUserId: existingUser ? existingUser.id : null,
        defaultPassword: r.password || "TazakkaKetua2026!",
      })
    }
  }

  if (hasValidationErrors) {
    console.error("\n❌ Validasi CSV gagal! Silakan perbaiki file CSV sebelum melanjutkan.")
    process.exit(1)
  }

  console.log(`\n✅ Validasi berhasil: ${plannedActions.length} data calon ketua valid dan siap diproses.\n`)

  // Tampilkan ringkasan tindakan yang akan diambil
  console.log("Rincian Pemetaan:")
  plannedActions.forEach((item, idx) => {
    const statusUser = item.existingUserId ? "Perbarui user lama" : "Buat user baru"
    console.log(
      `  ${idx + 1}. [${item.dept.kode}] ${item.dept.nama}\n     👤 ${item.row.nama} <${item.row.email}> -> ${statusUser}`
    )
  })

  if (isDryRun) {
    console.log("\n==================================================================")
    console.log("🔍 HASIL DRY-RUN:")
    console.log(`  - Total Departemen Siap Ditetapkan : ${plannedActions.length}`)
    console.log("  - Status Database: TIDAK ADA PERUBAHAN (mode --dry-run aktif)")
    console.log("  - Untuk menjalankan rilis, jalankan tanpa opsi --dry-run.")
    console.log("==================================================================\n")
    return
  }

  // 4. Eksekusi Aktual
  console.log("\nMemulai eksekusi pembuatan akun dan penetapan ketua...")
  let successCount = 0
  const credentialRecords: { email: string; pass: string; dept: string; nama: string }[] = []

  for (const item of plannedActions) {
    const { row, dept, defaultPassword } = item
    let userId = item.existingUserId

    try {
      if (!userId) {
        // Buat user auth baru
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: row.email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: { nama: row.nama },
        })

        if (createError || !createData.user) {
          throw new Error(`Gagal membuat auth user: ${createError?.message}`)
        }
        userId = createData.user.id
        console.log(`  + [AUTH] Berhasil membuat user: ${row.email} (ID: ${userId})`)
      } else {
        // Perbarui data user auth jika sudah ada
        const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true,
          user_metadata: { nama: row.nama },
          ...(row.password ? { password: row.password } : {}),
        })
        if (updateAuthErr) {
          console.warn(`  ⚠️ Peringatan update auth: ${updateAuthErr.message}`)
        }
        console.log(`  ✓ [AUTH] User lama digunakan: ${row.email} (ID: ${userId})`)
      }

      // Upsert ke tabel public.profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            nama: row.nama,
            role: "user", // Role ketua adalah 'user' sesuai PRD
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )

      if (profileError) {
        throw new Error(`Gagal upsert profile: ${profileError.message}`)
      }

      // Tetapkan ke tabel public.departments (ketua_id)
      const { error: updateDeptError } = await supabase
        .from("departments")
        .update({
          ketua_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dept.id)

      if (updateDeptError) {
        throw new Error(`Gagal update ketua departemen: ${updateDeptError.message}`)
      }

      console.log(`  ✅ [DEPT] Berhasil menetapkan ${row.nama} sebagai Ketua ${dept.kode} (${dept.nama})\n`)
      successCount++
      credentialRecords.push({
        email: row.email,
        pass: defaultPassword,
        dept: `${dept.kode} - ${dept.nama}`,
        nama: row.nama,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ Gagal memproses baris ${row.lineNumber} [${row.email}]:`, message)
    }
  }

  console.log("==================================================================")
  console.log(`🎉 SELESAI: ${successCount} dari ${plannedActions.length} ketua berhasil diimpor & ditetapkan!`)
  console.log("==================================================================")

  // Buat berkas rekaman kredensial lokal (abaikan di git jika perlu)
  const reportPath = path.resolve(process.cwd(), "scripts", ".last-imported-ketua.log")
  let reportText = `REKAMAN IMPORT KETUA DEPARTEMEN - ${new Date().toISOString()}\n`
  reportText += `Total Berhasil: ${successCount}/${plannedActions.length}\n\n`
  reportText += `Format: Nama | Email | Departemen | Default Password\n`
  reportText += `------------------------------------------------------------------\n`
  for (const cr of credentialRecords) {
    reportText += `${cr.nama} | ${cr.email} | ${cr.dept} | ${cr.pass}\n`
  }
  fs.writeFileSync(reportPath, reportText, "utf-8")
  console.log(`ℹ️ Catatan kredensial disimpan sementara di ${reportPath} (Rahasiakan file ini).`)
}

main().catch((err) => {
  console.error("Terjadi error fatal saat menjalankan import-ketua:", err)
  process.exit(1)
})
