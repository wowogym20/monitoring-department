import { test, expect } from "@playwright/test"

const SUPER_ADMIN = {
  email: "superadmin@tazakka.or.id",
  password: "Password123!",
}

test.describe("Alur Master Data: Super Admin Mengelola Ketua, Departemen, dan Periode", () => {
  const timestamp = Date.now().toString().slice(-6)
  const ketuaNama = `Ustadz E2E ${timestamp}`
  const ketuaEmail = `ketua.e2e.${timestamp}@tazakka.or.id`
  const periodeNama = `Periode Evaluasi E2E ${timestamp}`

  test("Super-Admin membuat ketua, menetapkannya ke departemen, dan membuat periode penilaian", async ({
    page,
  }) => {
    test.setTimeout(90000)

    // 1. Login sebagai Super-Admin
    await page.goto("/login")
    await page.fill('input[type="email"]', SUPER_ADMIN.email)
    await page.fill('input[type="password"]', SUPER_ADMIN.password)
    await page.click('button[type="submit"]')

    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Super-Admin").first()).toBeVisible({ timeout: 15000 })

    // 2. Navigasi ke /ketua dan Buat Akun Ketua Baru
    await page.goto("/ketua", { waitUntil: "domcontentloaded" })
    await page.waitForURL("**/ketua")
    await expect(
      page.getByRole("heading", { name: /Akun (Kepala|Ketua) Departemen/i })
    ).toBeVisible({ timeout: 15000 })

    // Buka modal pembuatan akun
    await page.locator('button:has-text("Buat Akun Kadep Baru"), button:has-text("Buat Akun Ketua Baru")').click()
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: /Buat Akun/i })
    ).toBeVisible({ timeout: 10000 })

    // Isi formulir ketua baru
    await page.fill("#ketua-nama", ketuaNama)
    await page.fill("#ketua-email", ketuaEmail)
    await page.fill("#ketua-pass", "Password123!")
    await page.fill("#ketua-hp", "081234567890")

    // Submit form
    await page.click('button[type="submit"]:has-text("Buat Akun")')

    // Verifikasi akun ketua baru muncul di tabel
    await expect(page.locator("table").locator(`text=${ketuaNama}`)).toBeVisible({ timeout: 15000 })

    // 3. Navigasi ke /departemen dan Tetapkan Ketua ke Departemen
    await page.goto("/departemen", { waitUntil: "domcontentloaded" })
    await page.waitForURL("**/departemen")
    await expect(page.locator('main h1:has-text("Departemen")')).toBeVisible({ timeout: 15000 })

    // Cari baris departemen yang memiliki tombol "Pilih" / "Ganti" ketua di dalam tabel
    const assignButton = page
      .locator("table tbody tr")
      .first()
      .locator('button:has-text("Pilih"), button:has-text("Ganti")')
    await expect(assignButton).toBeVisible({ timeout: 15000 })
    await assignButton.click()

    // Tunggu dialog pemilihan ketua terbuka
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: /Pilih atau Ganti/i })
    ).toBeVisible({ timeout: 10000 })

    // Buka Select akun ketua
    await page.click("#select-ketua")

    // Pilih ketua yang baru saja dibuat
    const ketuaOption = page.locator('[role="option"]').filter({ hasText: ketuaNama })
    await expect(ketuaOption).toBeVisible({ timeout: 10000 })
    await ketuaOption.click()

    // Simpan penetapan ketua
    await page.click('button[type="submit"]:has-text("Simpan Penugasan")')

    // Verifikasi nama ketua tampil di tabel departemen
    await expect(page.locator(`text=${ketuaNama}`).first()).toBeVisible({ timeout: 15000 })

    // 4. Navigasi ke /periode dan Buat Periode Penilaian Baru
    await page.goto("/periode", { waitUntil: "domcontentloaded" })
    await page.waitForURL("**/periode")
    await expect(page.locator('main h1:has-text("Periode Penilaian")')).toBeVisible({ timeout: 15000 })

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
    await expect(page.locator("table").locator(`text=${periodeNama}`)).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=Terbuka (Open)").first()).toBeVisible()
  })
})
