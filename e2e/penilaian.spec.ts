import { test, expect } from "@playwright/test"

const ACCOUNTS = {
  admin: {
    email: "admin.sdm@tazakka.id",
    password: "Password123!",
  },
  ketuaPendidikan: {
    email: "ketua.pendidikan@tazakka.id",
    password: "Password123!",
  },
  ketuaTI: {
    email: "ketua.ti@tazakka.id",
    password: "Password123!",
  },
}

test.describe("Alur Penilaian Kinerja Ketua Departemen & Hak Akses", () => {
  let memberPendidikanId: string = ""
  let memberTIId: string = ""

  test("1. Alur lengkap Ketua menilai anggota dari viewport mobile 360px (Buka -> Draf -> Lanjutkan -> Kirim)", async ({
    page,
  }) => {
    // Set viewport mobile 360px sesuai kriteria PRD 10.1.D
    await page.setViewportSize({ width: 360, height: 740 })

    // 1. Login sebagai Ketua Pendidikan
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.ketuaPendidikan.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketuaPendidikan.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // 2. Navigasi ke halaman /penilaian
    await page.goto("/penilaian")
    await page.waitForURL("**/penilaian**")

    await expect(page.locator('h1:has-text("Penilaian Anggota")')).toBeVisible()

    // Verifikasi Selector Periode tampil
    const periodeSelector = page.locator("#select-periode")
    await expect(periodeSelector).toBeVisible()

    // Verifikasi Ringkasan Progres & Progress Bar Emerald
    await expect(page.locator("text=Progres Penilaian")).toBeVisible()
    await expect(page.locator("text=anggota sudah dinilai")).toBeVisible()

    // Verifikasi bahwa untuk Ketua, dropdown filter departemen TIDAK tampil (otomatis terisolasi)
    await expect(page.locator("#select-filter-dept")).not.toBeVisible()

    // 3. Ambil salah satu anggota pendidikan dari tampilan kartu mobile (elemen yang terlihat di 360px)
    const firstNilaiBtn = page.locator('a[href^="/penilaian/"]:visible').first()
    await expect(firstNilaiBtn).toBeVisible()

    // Ambil href untuk mendapatkan ID anggota
    const href = await firstNilaiBtn.getAttribute("href")
    expect(href).toBeTruthy()
    const memberIdMatch = href?.match(/\/penilaian\/([^?]+)/)
    memberPendidikanId = memberIdMatch ? memberIdMatch[1] : ""
    expect(memberPendidikanId).not.toBe("")

    // Klik tombol untuk membuka form penilaian
    await firstNilaiBtn.click()
    await page.waitForURL(`**/penilaian/${memberPendidikanId}**`)

    // 4. Periksa komponen Form Penilaian
    await expect(page.locator("text=Aspek Penilaian")).toBeVisible()
    await expect(page.locator("text=Catatan Evaluasi (Opsional)")).toBeVisible()
    await expect(page.locator("#btn-simpan-draf")).toBeVisible()
    await expect(page.locator("#btn-kirim-penilaian")).toBeVisible()

    // 5. Isi Aspek 1 dengan nilai 4 (Baik - Emerald)
    const aspectCards = page.locator(".space-y-4 > .border")
    const aspectCount = await aspectCards.count()
    expect(aspectCount).toBeGreaterThanOrEqual(1)

    // Pilih nilai 4 pada aspek 1
    const firstAspectRadio4 = page.locator('label[for$="-4"]').first()
    await firstAspectRadio4.click()

    // Pilih nilai 5 pada aspek 2 jika ada
    if (aspectCount > 1) {
      const secondAspectRadio5 = page.locator('label[for$="-5"]').nth(1)
      await secondAspectRadio5.click()
    }

    // 6. Tulis catatan evaluasi draf
    const catatanInput = page.locator("#input-catatan")
    const draftCatatanText = `Catatan Draf E2E ${Date.now()}`
    await catatanInput.fill(draftCatatanText)

    // Verifikasi pratinjau skor real-time muncul
    await expect(page.locator("text=Pratinjau Skor")).toBeVisible()

    // 7. Klik "Simpan Draf"
    const btnSimpanDraf = page.locator("#btn-simpan-draf")
    await btnSimpanDraf.click()

    // Form menyimpan dan kembali ke halaman /penilaian
    await page.waitForURL("**/penilaian**", { timeout: 15000 })

    // Verifikasi di daftar penilaian bahwa status anggota memiliki badge "Draft"
    await expect(page.locator('span:has-text("Draft"):visible').first()).toBeVisible()

    // 8. Buka kembali form anggota tersebut untuk melanjutkan penilaian
    const editBtn = page.locator(`a[href*="/penilaian/${memberPendidikanId}"]:visible`).first()
    await editBtn.click()
    await page.waitForURL(`**/penilaian/${memberPendidikanId}**`)

    // Verifikasi bahwa data draf tersimpan (catatan terisi)
    await expect(page.locator("#input-catatan")).toHaveValue(draftCatatanText)

    // 9. Lengkapi SELURUH aspek (1 s.d. total aspek)
    for (let i = 0; i < aspectCount; i++) {
      // Klik nilai 4 atau 5 untuk setiap aspek
      const val = i % 2 === 0 ? 5 : 4
      const aspectRadio = page.locator(`label[for$="-${val}"]`).nth(i)
      await aspectRadio.click()
    }

    // Verifikasi indikator kelengkapan "Semua aspek terisi"
    await expect(page.locator("text=Semua aspek terisi")).toBeVisible()

    // Tombol Kirim Penilaian sekarang aktif (enabled)
    const btnKirim = page.locator("#btn-kirim-penilaian")
    await expect(btnKirim).toBeEnabled()

    // 10. Klik "Kirim Penilaian"
    await btnKirim.click()

    // Verifikasi kembali ke /penilaian dan status berubah menjadi Submitted
    await page.waitForURL("**/penilaian**", { timeout: 15000 })
    await expect(page.locator('span:has-text("Submitted"):visible').first()).toBeVisible()
  })

  test("2. Isolasi Departemen: Ketua Pendidikan TIDAK BISA membuka form penilaian anggota Dept TI", async ({
    page,
  }) => {
    // Bersihkan sesi cookies sebelum login
    await page.context().clearCookies()

    // 1. Login sebagai Ketua TI untuk mendapatkan salah satu ID anggota TI
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.ketuaTI.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketuaTI.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    await page.goto("/penilaian")
    await page.waitForURL("**/penilaian**")

    const tiNilaiBtn = page.locator('a[href^="/penilaian/"]:visible').first()
    await expect(tiNilaiBtn).toBeVisible()
    const tiHref = await tiNilaiBtn.getAttribute("href")
    expect(tiHref).toBeTruthy()
    const match = tiHref?.match(/\/penilaian\/([^?]+)/)
    memberTIId = match ? match[1] : ""
    expect(memberTIId).not.toBe("")

    // Bersihkan sesi (Logout)
    await page.context().clearCookies()

    // 2. Login sebagai Ketua Pendidikan
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.ketuaPendidikan.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketuaPendidikan.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // 3. Coba akses langsung URL form penilaian milik anggota Dept TI
    await page.goto(`/penilaian/${memberTIId}`)

    // 4. Verifikasi bahwa akses ditolak dan pesan error isolasi departemen muncul
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "Akses ditolak: Anda hanya dapat menilai anggota departemen Anda sendiri"
    )

    // Form penilaian tidak boleh dirender
    await expect(page.locator("#btn-kirim-penilaian")).not.toBeVisible()
    await expect(page.locator("#btn-simpan-draf")).not.toBeVisible()
  })

  test("3. Proteksi Akses: Role Admin SDM TIDAK BISA membuka form /penilaian/[anggotaId]", async ({
    page,
  }) => {
    // Bersihkan sesi sebelum login
    await page.context().clearCookies()

    // Target member ID untuk tes
    const targetMember = memberPendidikanId || "7c83951b-6eee-4707-ac82-cd5fb6c6324a"

    // Login sebagai Admin SDM
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // Coba akses form penilaian anggota (sesuai matriks PRD baris 316, Admin = Tidak)
    await page.goto(`/penilaian/${targetMember}`)

    // Admin SDM ditolak membuka form penilaian (dialihkan oleh guard middleware/role)
    await page.waitForURL((url) => !url.pathname.includes(`/penilaian/${targetMember}`))

    // Form penilaian tidak boleh terbuka bagi Admin
    await expect(page.locator("#btn-kirim-penilaian")).not.toBeVisible()
    await expect(page.locator("#btn-simpan-draf")).not.toBeVisible()
  })
})
