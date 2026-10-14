import { test, expect } from "@playwright/test"

const ACCOUNTS = {
  admin: {
    email: "admin.sdm@tazakka.or.id",
    password: "Password123!",
  },
  ketuaPendidikan: {
    email: "ketua.pendidikan@tazakka.or.id",
    password: "Password123!",
  },
}

test.describe("Alur SDM & Ketua: Rekap, Minta Revisi, Komentar Balasan, dan Transisi Status", () => {
  test("Alur Lengkap: SDM filter & minta revisi -> Ketua terima notifikasi, balas komentar, dan perbarui nilai -> Status kembali Submitted", async ({
    page,
  }) => {
    test.setTimeout(90000)

    // =========================================================================
    // BAGIAN 1: SDM MEMFILTER REKAP, MEMBUKA DETAIL, DAN MEMINTA REVISI
    // =========================================================================

    // 1. Login sebagai Admin SDM
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // 2. Navigasi ke Halaman /rekap
    await page.goto("/rekap")
    await page.waitForURL("**/rekap**")
    await expect(page.locator('h1:has-text("Rekap Penilaian Kinerja")')).toBeVisible()

    // 3. Verifikasi Ringkasan per Departemen & Indikator US-10
    await expect(page.locator("text=Ringkasan Progres per Departemen")).toBeVisible()

    // 4. Filter Departemen: Pilih Dept. Pendidikan agar sesuai dengan akun Ketua Pendidikan
    const deptFilter = page.locator("#select-filter-dept")
    await expect(deptFilter).toBeVisible()
    await deptFilter.click()
    const optionDept = page.locator('div[role="option"]:has-text("Pendidikan")').first()
    await expect(optionDept).toBeVisible()
    await optionDept.click()

    // Tunggu tabel memuat baris hasil filter
    await page.waitForTimeout(600)

    // 5. Ambil baris pertama dari tabel hasil filter
    const detailBtn = page.locator('a[id^="btn-detail-"]').first()
    await expect(detailBtn).toBeVisible()

    const href = await detailBtn.getAttribute("href")
    expect(href).toBeTruthy()
    const match = href?.match(/\/rekap\/([^?]+)/)
    const assessmentId = match ? match[1] : ""
    expect(assessmentId).not.toBe("")

    // 6. Buka Detail Penilaian
    await detailBtn.click()
    await page.waitForURL(`**/rekap/${assessmentId}**`)

    // 7. Verifikasi Halaman Detail, SkorBadge, dan Tab
    await expect(page.locator("#tab-trigger-aspek")).toBeVisible()
    await expect(page.locator("#tab-trigger-komentar")).toBeVisible()
    await expect(page.locator("#tab-trigger-riwayat")).toBeVisible()

    // 8. Klik Tombol "Minta Revisi" (Tombol Oren)
    const btnMintaRevisi = page.locator("#btn-minta-revisi")
    await expect(btnMintaRevisi).toBeVisible()
    await btnMintaRevisi.click()

    // Dialog konfirmasi revisi muncul
    await expect(page.locator("text=Minta Revisi Penilaian")).toBeVisible()
    const inputCatatan = page.locator("#input-catatan-revisi")
    await expect(inputCatatan).toBeVisible()

    const catatanRevisiText = `Catatan Revisi SDM E2E ${Date.now()}`
    await inputCatatan.fill(catatanRevisiText)

    // Klik Kirim Permintaan Revisi
    const btnKonfirmasi = page.locator("#btn-konfirmasi-revisi")
    await expect(btnKonfirmasi).toBeEnabled()
    await btnKonfirmasi.click()

    // 9. Tunggu notifikasi toast berhasil dan status berubah menjadi "Revision Requested"
    await expect(
      page.locator("text=Permintaan revisi dan catatan berhasil dikirimkan").first()
    ).toBeVisible({ timeout: 10000 })
    await expect(page.locator('span:has-text("Revision Requested")').first()).toBeVisible({ timeout: 10000 })

    // =========================================================================
    // BAGIAN 2: KETUA MENERIMA NOTIFIKASI, MEMBALAS KOMENTAR, & MENGUBAH NILAI
    // =========================================================================

    // 10. Bersihkan sesi dan Login sebagai Ketua Pendidikan
    await page.context().clearCookies()
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.ketuaPendidikan.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketuaPendidikan.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // 11. Buka halaman detail penilaian yang baru diminta revisi
    await page.goto(`/rekap/${assessmentId}`)
    await page.waitForURL(`**/rekap/${assessmentId}**`)

    // 12. Verifikasi Banner Peringatan Revisi tampil khusus untuk Ketua
    await expect(page.locator("text=Penilaian Memerlukan Revisi")).toBeVisible()

    // 13. Buka Tab Komentar & Balas Komentar SDM
    const tabKomentar = page.locator("#tab-trigger-komentar")
    await tabKomentar.click()

    // Verifikasi komentar revisi SDM terlihat di utas
    await expect(page.locator(`text=${catatanRevisiText}`).first()).toBeVisible({ timeout: 10000 })

    // Tulis balasan komentar dari Ketua
    const inputKomentar = page.locator("#input-komentar-baru")
    await inputKomentar.fill(`Siap, catatan revisi sudah kami tindak lanjuti ${Date.now()}`)
    await page.locator("#btn-kirim-komentar").click()

    // Verifikasi balasan muncul di tab komentar
    await expect(page.locator("text=Siap, catatan revisi").first()).toBeVisible({ timeout: 10000 })

    // 14. Buka Tab Riwayat Perubahan untuk memverifikasi jejak audit
    const tabRiwayat = page.locator("#tab-trigger-riwayat")
    await tabRiwayat.click()
    await expect(page.locator("text=Jejak Audit & Riwayat Perubahan Nilai")).toBeVisible()

    // 15. Klik "Ubah Penilaian" untuk memperbarui evaluasi
    const btnUbah = page.locator('a:has-text("Ubah Penilaian")').first()
    await expect(btnUbah).toBeVisible()
    await btnUbah.click()
    await page.waitForURL("**/penilaian/**")

    // Ubah nilai aspek (pilih radio nilai 5 pada aspek pertama)
    const radio5 = page.locator('label[for$="-5"]').first()
    await radio5.click()

    // Perbarui catatan evaluasi
    const catatanInput = page.locator("#input-catatan")
    await catatanInput.fill(`Catatan evaluasi diperbarui pasca revisi SDM ${Date.now()}`)

    // 16. Kirim Penilaian (Submit)
    const btnKirim = page.locator("#btn-kirim-penilaian")
    await expect(btnKirim).toBeEnabled()
    await btnKirim.click()

    // 17. Verifikasi Status otomatis kembali ke "Submitted"
    await page.waitForURL("**/penilaian**", { timeout: 15000 })
    await expect(page.locator('span:has-text("Submitted"):visible').first()).toBeVisible()
  })
})
