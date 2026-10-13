import { test, expect } from "@playwright/test"

const SUPER_ADMIN = {
  email: "superadmin@tazakka.id",
  password: "Password123!",
}

test.describe("Alur Master Data: Super Admin Mengelola Ketua, Departemen, dan Periode", () => {
  const timestamp = Date.now().toString().slice(-6)
  const ketuaNama = `Ustadz E2E ${timestamp}`
  const ketuaEmail = `ketua.e2e.${timestamp}@tazakka.id`
  const periodeNama = `Periode Evaluasi E2E ${timestamp}`

  test("Super-Admin membuat ketua, menetapkannya ke departemen, dan membuat periode penilaian", async ({
    page,
  }) => {
    // 1. Login sebagai Super-Admin
    await page.goto("/login")
    await page.fill('input[type="email"]', SUPER_ADMIN.email)
    await page.fill('input[type="password"]', SUPER_ADMIN.password)
    await page.click('button[type="submit"]')

    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Super-Admin").first()).toBeVisible()

    // 2. Navigasi ke /ketua dan Buat Akun Ketua Baru
    await page.goto("/ketua")
    await page.waitForURL("**/ketua")
    await expect(page.locator("text=Akun Ketua Departemen")).toBeVisible()

    // Buka modal pembuatan akun
    await page.click('button:has-text("Buat Akun Ketua Baru")')
    await expect(page.locator('text=Buat Akun Ketua Baru').first()).toBeVisible()

    // Isi formulir ketua baru
    await page.fill("#ketua-nama", ketuaNama)
    await page.fill("#ketua-email", ketuaEmail)
    await page.fill("#ketua-pass", "Password123!")
    await page.fill("#ketua-hp", "081234567890")

    // Submit form
    await page.click('button[type="submit"]:has-text("Buat Akun")')

    // Verifikasi akun ketua baru muncul di tabel
    await expect(page.locator(`text=${ketuaNama}`)).toBeVisible({ timeout: 10000 })

    // 3. Navigasi ke /departemen dan Tetapkan Ketua ke Departemen
    await page.goto("/departemen")
    await page.waitForURL("**/departemen")
    await expect(page.locator('main h1:has-text("Departemen")')).toBeVisible()

    // Cari baris departemen yang memiliki tombol "Pilih" / "Ganti" ketua di dalam tabel
    const assignButton = page
      .locator("table tbody tr")
      .first()
      .locator('button:has-text("Pilih"), button:has-text("Ganti")')
    await expect(assignButton).toBeVisible()
    await assignButton.click()

    // Tunggu dialog pemilihan ketua terbuka
    await expect(page.locator("text=Pilih atau Ganti Ketua Departemen")).toBeVisible()

    // Buka Select akun ketua
    await page.click("#select-ketua")

    // Pilih ketua yang baru saja dibuat
    const ketuaOption = page.locator('[role="option"]').filter({ hasText: ketuaNama })
    await expect(ketuaOption).toBeVisible({ timeout: 5000 })
    await ketuaOption.click()

    // Simpan penetapan ketua
    await page.click('button[type="submit"]:has-text("Simpan Penugasan")')

    // Verifikasi nama ketua tampil di tabel departemen
    await expect(page.locator(`text=${ketuaNama}`).first()).toBeVisible({ timeout: 10000 })

    // 4. Navigasi ke /periode dan Buat Periode Penilaian Baru
    await page.goto("/periode")
    await page.waitForURL("**/periode")
    await expect(page.locator('main h1:has-text("Periode Penilaian")')).toBeVisible()

    // Buka modal pembuatan periode baru
    await page.click('button:has-text("Buka Periode Baru")')
    await expect(page.locator('text=Buka Periode Penilaian Baru').first()).toBeVisible()

    // Isi formulir periode baru
    await page.fill("#periode-nama", periodeNama)
    await page.fill("#tgl-mulai", "2026-10-01")
    await page.fill("#tgl-akhir", "2026-12-31")

    // Submit form
    await page.click('button[type="submit"]:has-text("Buat Periode")')

    // Verifikasi periode baru muncul di tabel dengan status Terbuka (Open)
    await expect(page.locator(`text=${periodeNama}`)).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Terbuka (Open)").first()).toBeVisible()
  })
})
