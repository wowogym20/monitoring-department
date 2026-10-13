import { test, expect } from "@playwright/test"

const ACCOUNTS = {
  superAdmin: {
    email: "superadmin@tazakka.id",
    password: "Password123!",
  },
  admin: {
    email: "admin.sdm@tazakka.id",
    password: "Password123!",
  },
  ketua: {
    email: "ketua.pendidikan@tazakka.id",
    password: "Password123!",
  },
}

test.describe("Proteksi Otorisasi & Menu Navigasi Berbasis Role", () => {
  test("1. Tamu belum login diarahkan ke /login saat mengakses rute terproteksi", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login\?redirect=.*dashboard/)
    await expect(page.locator("text=Masuk ke Akun")).toBeVisible()
  })

  test("2. Super Admin login dan dapat melihat seluruh menu navigasi", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.superAdmin.email)
    await page.fill('input[type="password"]', ACCOUNTS.superAdmin.password)
    await page.click('button[type="submit"]')

    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Super-Admin")).toBeVisible()

    // Menu khusus Super Admin harus muncul di sidebar
    await expect(page.locator('aside a[href="/ketua"]')).toBeVisible()
    await expect(page.locator('aside a[href="/aspek"]')).toBeVisible()
    await expect(page.locator('aside a[href="/departemen"]')).toBeVisible()
    await expect(page.locator('aside a[href="/periode"]')).toBeVisible()
    await expect(page.locator('aside a[href="/ekspor"]')).toBeVisible()
  })

  test("3. Admin (SDM) login dan hanya melihat menu yang diizinkan (tidak melihat menu khusus Super Admin)", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')

    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Admin SDM")).toBeVisible()

    // Menu admin diizinkan di sidebar
    await expect(page.locator('aside a[href="/departemen"]')).toBeVisible()
    await expect(page.locator('aside a[href="/periode"]')).toBeVisible()
    await expect(page.locator('aside a[href="/ekspor"]')).toBeVisible()

    // Menu khusus super admin TIDAK boleh terlihat oleh admin di sidebar
    await expect(page.locator('aside a[href="/ketua"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/aspek"]')).toHaveCount(0)

    // Akses URL terlarang (/ketua) harus dialihkan ke /dashboard
    await page.goto("/ketua")
    await page.waitForURL("**/dashboard")

    // Akses form penilaian anggota (/penilaian/[anggotaId]) harus ditolak untuk admin
    await page.goto("/penilaian/anggota-dummy")
    await page.waitForURL("**/penilaian")
  })

  test("4. Ketua Departemen (user) login dan hanya melihat menu operasional departemen", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.ketua.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketua.password)
    await page.click('button[type="submit"]')

    await page.waitForURL("**/dashboard")
    await expect(page.locator("text=Ketua Departemen")).toBeVisible()

    // Menu ketua yang diizinkan di sidebar
    await expect(page.locator('aside a[href="/anggota"]')).toBeVisible()
    await expect(page.locator('aside a[href="/penilaian"]')).toBeVisible()
    await expect(page.locator('aside a[href="/rekap"]')).toBeVisible()

    // Menu manajerial tidak boleh terlihat oleh ketua di sidebar
    await expect(page.locator('aside a[href="/departemen"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/ketua"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/periode"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/aspek"]')).toHaveCount(0)
    await expect(page.locator('aside a[href="/ekspor"]')).toHaveCount(0)

    // Akses URL langsung yang dilarang harus dialihkan kembali ke /dashboard
    await page.goto("/departemen")
    await page.waitForURL("**/dashboard")

    await page.goto("/ketua")
    await page.waitForURL("**/dashboard")
  })
})
