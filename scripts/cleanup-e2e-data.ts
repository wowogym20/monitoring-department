import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// ==============================================================================
// Script: Pembersihan Data Percobaan E2E dari Database Live Supabase
// Penggunaan:
//   npx tsx scripts/cleanup-e2e-data.ts           (Eksekusi pembersihan)
//   npx tsx scripts/cleanup-e2e-data.ts --dry-run (Hanya melihat daftar data tanpa menghapus)
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
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum disetel di .env.local!")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  const isDryRun = process.argv.includes("--dry-run")

  console.log("==================================================================")
  console.log(`🧹 Skrip Pembersihan Data Percobaan E2E (${isDryRun ? "DRY RUN - SIMULASI" : "EKSEKUSI PENGHAPUSAN"})`)
  console.log("==================================================================")
  console.log(`Target URL: ${supabaseUrl}\n`)

  // 1. Cari Akun Auth & Profil E2E
  const { data: authUsersData, error: authListErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  })

  if (authListErr) {
    console.error("❌ Gagal membaca auth users:", authListErr.message)
    return
  }

  const e2eAuthUsers = (authUsersData.users || []).filter(
    (u) =>
      u.email?.toLowerCase().includes("e2e") ||
      u.user_metadata?.nama?.toLowerCase().includes("e2e")
  )

  const { data: e2eProfiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, nama, role")
    .ilike("nama", "%e2e%")

  if (profileErr) {
    console.error("❌ Gagal membaca profiles:", profileErr.message)
    return
  }

  // Gabungkan user ID dari auth dan profile
  const e2eUserIdSet = new Set<string>()
  e2eAuthUsers.forEach((u) => e2eUserIdSet.add(u.id))
  e2eProfiles?.forEach((p) => e2eUserIdSet.add(p.id))

  const e2eUserIds = Array.from(e2eUserIdSet)
  console.log(`📋 Ditemukan ${e2eUserIds.length} akun pengguna percobaan (E2E):`)
  e2eUserIds.forEach((uid) => {
    const authUser = e2eAuthUsers.find((u) => u.id === uid)
    const prof = e2eProfiles?.find((p) => p.id === uid)
    console.log(`   - ${prof?.nama || authUser?.user_metadata?.nama || "Tanpa Nama"} (${authUser?.email || "No Email"}) - ID: ${uid}`)
  })

  // 2. Cari Departemen yang Ditugaskan ke Akun E2E
  let deptsToReset: Array<{ id: string; nama: string; kode: string }> = []
  if (e2eUserIds.length > 0) {
    const { data: depts, error: deptErr } = await supabase
      .from("departments")
      .select("id, nama, kode, ketua_id")
      .in("ketua_id", e2eUserIds)

    if (deptErr) {
      console.error("❌ Gagal membaca departemen:", deptErr.message)
    } else {
      deptsToReset = depts || []
      console.log(`\n📋 Ditemukan ${deptsToReset.length} departemen yang ketua_id-nya menunjuk ke akun E2E:`)
      deptsToReset.forEach((d) => console.log(`   - ${d.nama} (${d.kode})`))
    }
  }

  // 3. Cari Periode Evaluasi E2E
  const { data: e2ePeriods, error: periodErr } = await supabase
    .from("assessment_periods")
    .select("id, nama, status")
    .ilike("nama", "%E2E%")

  if (periodErr) {
    console.error("❌ Gagal membaca assessment_periods:", periodErr.message)
    return
  }

  const e2ePeriodIds = (e2ePeriods || []).map((p) => p.id)
  console.log(`\n📋 Ditemukan ${e2ePeriods?.length || 0} periode penilaian percobaan (E2E):`)
  e2ePeriods?.forEach((p) => console.log(`   - ${p.nama} [${p.status}] - ID: ${p.id}`))

  // 4. Cari Anggota E2E
  const { data: e2eMembers, error: memberErr } = await supabase
    .from("members")
    .select("id, nama, nip, department_id")
    .or("nama.ilike.%e2e%,nip.ilike.%e2e%")

  if (memberErr) {
    console.error("❌ Gagal membaca members:", memberErr.message)
    return
  }

  const e2eMemberIds = (e2eMembers || []).map((m) => m.id)
  console.log(`\n📋 Ditemukan ${e2eMembers?.length || 0} data anggota percobaan (E2E):`)
  e2eMembers?.forEach((m) => console.log(`   - ${m.nama} (NIP: ${m.nip}) - ID: ${m.id}`))

  // 5. Cari Penilaian (Assessments) yang Berelasi dengan Data E2E
  let e2eAssessmentIds: string[] = []
  const conditions: string[] = []
  if (e2ePeriodIds.length > 0) conditions.push(`period_id.in.(${e2ePeriodIds.join(",")})`)
  if (e2eMemberIds.length > 0) conditions.push(`member_id.in.(${e2eMemberIds.join(",")})`)
  if (e2eUserIds.length > 0) conditions.push(`evaluator_id.in.(${e2eUserIds.join(",")})`)

  if (conditions.length > 0) {
    const { data: evals, error: evalErr } = await supabase
      .from("assessments")
      .select("id, member_id, status")
      .or(conditions.join(","))

    if (evalErr) {
      console.error("❌ Gagal membaca assessments:", evalErr.message)
    } else {
      e2eAssessmentIds = (evals || []).map((e) => e.id)
      console.log(`\n📋 Ditemukan ${e2eAssessmentIds.length} data penilaian terkait data E2E.`)
    }
  }

  // Jika Dry Run, berhenti di sini
  if (isDryRun) {
    console.log("\n🔍 Selesai penelusuran (DRY RUN). Tidak ada data yang dihapus.")
    console.log("Jalankan tanpa flag --dry-run untuk mengeksekusi penghapusan.")
    return
  }

  console.log("\n🚀 Memulai proses pembersihan di database...")

  // LANGKAH A: Reset ketua_id departemen yang menunjuk ke ketua E2E
  if (deptsToReset.length > 0) {
    const deptIds = deptsToReset.map((d) => d.id)
    const { error: resetDeptErr } = await supabase
      .from("departments")
      .update({ ketua_id: null })
      .in("id", deptIds)

    if (resetDeptErr) {
      console.error("⚠️ Gagal mereset ketua departemen:", resetDeptErr.message)
    } else {
      console.log(`✅ Berhasil mereset penugasan ketua pada ${deptIds.length} departemen.`)
    }
  }

  // LANGKAH B: Hapus data penilaian (assessment_comments, assessment_scores, assessments)
  if (e2eAssessmentIds.length > 0) {
    const { error: delCommentsErr } = await supabase
      .from("assessment_comments")
      .delete()
      .in("assessment_id", e2eAssessmentIds)

    if (delCommentsErr) {
      console.warn("⚠️ Peringatan saat menghapus assessment_comments:", delCommentsErr.message)
    }

    const { error: delScoresErr } = await supabase
      .from("assessment_scores")
      .delete()
      .in("assessment_id", e2eAssessmentIds)

    if (delScoresErr) {
      console.warn("⚠️ Peringatan saat menghapus assessment_scores:", delScoresErr.message)
    }

    const { error: delAssessmentsErr } = await supabase
      .from("assessments")
      .delete()
      .in("id", e2eAssessmentIds)

    if (delAssessmentsErr) {
      console.error("⚠️ Gagal menghapus assessments:", delAssessmentsErr.message)
    } else {
      console.log(`✅ Berhasil menghapus ${e2eAssessmentIds.length} rekaman assessments E2E.`)
    }
  }

  // LANGKAH C: Hapus data anggota percobaan E2E
  if (e2eMemberIds.length > 0) {
    const { error: delMemberErr } = await supabase
      .from("members")
      .delete()
      .in("id", e2eMemberIds)

    if (delMemberErr) {
      console.error("⚠️ Gagal menghapus members:", delMemberErr.message)
    } else {
      console.log(`✅ Berhasil menghapus ${e2eMemberIds.length} anggota percobaan E2E.`)
    }
  }

  // LANGKAH D: Hapus periode evaluasi E2E
  if (e2ePeriodIds.length > 0) {
    const { error: delPeriodErr } = await supabase
      .from("assessment_periods")
      .delete()
      .in("id", e2ePeriodIds)

    if (delPeriodErr) {
      console.error("⚠️ Gagal menghapus assessment_periods:", delPeriodErr.message)
    } else {
      console.log(`✅ Berhasil menghapus ${e2ePeriodIds.length} periode evaluasi E2E.`)
    }
  }

  // LANGKAH E: Hapus profil & akun Auth Supabase E2E
  if (e2eUserIds.length > 0) {
    // 1. Hapus profiles
    const { error: delProfileErr } = await supabase
      .from("profiles")
      .delete()
      .in("id", e2eUserIds)

    if (delProfileErr) {
      console.error("⚠️ Gagal menghapus profiles:", delProfileErr.message)
    } else {
      console.log(`✅ Berhasil menghapus ${e2eUserIds.length} profil pengguna E2E.`)
    }

    // 2. Hapus auth.users via Supabase Admin API
    let authDeletedCount = 0
    for (const userId of e2eUserIds) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(userId)
      if (authErr) {
        console.warn(`   ⚠️ Peringatan: Gagal menghapus auth user ${userId}:`, authErr.message)
      } else {
        authDeletedCount++
      }
    }
    console.log(`✅ Berhasil menghapus ${authDeletedCount} akun auth Supabase E2E.`)
  }

  console.log("\n🎉 SELURUH DATA PERCOBAAN E2E TELAH DIBERSIHKAN DENGAN SUKSES!")
  console.log("Database Anda kini bersih dari data dummy pengujian.")
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan fatal:", err)
  process.exit(1)
})
