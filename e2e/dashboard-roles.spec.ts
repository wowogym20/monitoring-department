import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const ACCOUNTS = {
  superAdmin: {
    email: "superadmin@tazakka.or.id",
    password: "Password123!",
  },
  admin: {
    email: "admin.sdm@tazakka.or.id",
    password: "Password123!",
  },
  ketua: {
    email: "ketua.pendidikan@tazakka.or.id",
    password: "Password123!",
  },
}

test.describe("Dashboard Berbasis Role, Isolasi Data, & Aksesibilitas WCAG AA", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  // ===========================================================================
  // 1. DASHBOARD KETUA DEPARTEMEN (USER)
  // ===========================================================================
  test("1. Ketua Departemen login: hanya melihat widget miliknya dan angka departemen sendiri", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.ketua.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketua.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // A. Header & Identitas Role
    await expect(page.locator("text=Ketua Departemen").first()).toBeVisible()
    await expect(page.locator("text=Dept. Pendidikan dan Pengajaran").first()).toBeVisible()

    // B. Kartu KPI Ketua
    await expect(page.getByText('Anggota Departemen', { exact: true })).toBeVisible()
    await expect(page.getByText('Sudah Dinilai', { exact: true })).toBeVisible()
    await expect(page.getByText('Perlu Tindak Lanjut', { exact: true })).toBeVisible()
    await expect(page.getByText('Rata-rata Skor Departemen', { exact: true })).toBeVisible()

    // C. Kartu Progres Periode Berjalan
    await expect(page.locator("text=Progres Penilaian Anggota")).toBeVisible()
    await expect(page.locator("text=anggota sudah dinilai")).toBeVisible()
    await expect(page.locator("text=Tenggat Waktu Periode")).toBeVisible()
    await expect(page.locator("text=Umpan Balik SDM")).toBeVisible()

    // D. Daftar Perlu Tindak Lanjut Anggota
    await expect(page.locator("text=Daftar Perlu Tindak Lanjut Penilaian")).toBeVisible()

    // E. Isolasi Data: Ketua TIDAK boleh melihat widget Admin & Super-Admin
    await expect(page.locator("text=Total Departemen Aktif")).toHaveCount(0)
    await expect(page.locator("text=Rata-rata Skor per Departemen")).toHaveCount(0)
    await expect(page.locator("text=Persentase Penyelesaian per Departemen")).toHaveCount(0)
    await expect(page.locator("text=Perlu Tindak Lanjut SDM")).toHaveCount(0)
    await expect(page.locator("text=Tata Kelola & Struktur Departemen (Super-Admin)")).toHaveCount(0)
    await expect(page.locator("text=Pintasan Cepat Tata Kelola Pimpinan")).toHaveCount(0)

    // F. Uji Aksesibilitas WCAG AA (Light & Dark)
    const axeLight = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("[data-sonner-toaster]")
      .analyze()
    expect(axeLight.violations, `Axe WCAG violation pada Dashboard Ketua (Light): ${JSON.stringify(axeLight.violations, null, 2)}`).toEqual([])

    // Mode Gelap
    await page.click('button[aria-label="Ganti mode tema"]')
    await page.waitForTimeout(300)
    const axeDark = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("[data-sonner-toaster]")
      .analyze()
    expect(axeDark.violations, `Axe WCAG violation pada Dashboard Ketua (Dark): ${JSON.stringify(axeDark.violations, null, 2)}`).toEqual([])
  })

  // ===========================================================================
  // 2. DASHBOARD ADMIN (SDM)
  // ===========================================================================
  test("2. Admin SDM login: melihat KPI 14 departemen, kedua chart Recharts, tabel tindak lanjut, dan distribusi skor", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // A. Header & Identitas Role
    await expect(page.locator("text=Admin SDM").first()).toBeVisible()

    // B. Baris KPI Admin
    await expect(page.locator("text=Total Departemen Aktif")).toBeVisible()
    await expect(page.locator("text=Total Anggota")).toBeVisible()
    await expect(page.locator("text=Penilaian Selesai")).toBeVisible()
    await expect(page.locator("text=Rata-rata Skor Keseluruhan")).toBeVisible()

    // C. Grafik Recharts
    await expect(page.locator("text=Rata-rata Skor per Departemen")).toBeVisible()
    await expect(page.locator("text=Persentase Penyelesaian per Departemen")).toBeVisible()

    // D. Tabel Perlu Tindak Lanjut & Distribusi Skor
    await expect(page.locator("text=Perlu Tindak Lanjut SDM")).toBeVisible()
    await expect(page.locator("text=Distribusi Kategori Skor Kinerja")).toBeVisible()
    await expect(page.locator('[data-slot="badge"]:has-text("Sangat Baik")').first()).toBeVisible()
    await expect(page.locator('[data-slot="badge"]:has-text("Baik")').first()).toBeVisible()
    await expect(page.locator('[data-slot="badge"]:has-text("Cukup")').first()).toBeVisible()

    // E. Batasan Hak Akses: Admin SDM TIDAK melihat fitur khusus Super-Admin
    await expect(page.locator("text=Tata Kelola & Struktur Departemen (Super-Admin)")).toHaveCount(0)
    await expect(page.locator("text=Pintasan Cepat Tata Kelola Pimpinan")).toHaveCount(0)

    // F. Uji Aksesibilitas WCAG AA
    const axeLight = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("[data-sonner-toaster]")
      .analyze()
    expect(axeLight.violations, `Axe WCAG violation pada Dashboard Admin: ${JSON.stringify(axeLight.violations, null, 2)}`).toEqual([])
  })

  // ===========================================================================
  // 3. DASHBOARD SUPER-ADMIN
  // ===========================================================================
  test("3. Super-Admin login: melihat seluruh fitur admin + pintasan manajerial & ringkasan tata kelola ketua", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.superAdmin.email)
    await page.fill('input[type="password"]', ACCOUNTS.superAdmin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // A. Header & Identitas Role
    await expect(page.locator("text=Super-Admin").first()).toBeVisible()

    // B. Baris KPI & Grafik Admin
    await expect(page.locator("text=Total Departemen Aktif")).toBeVisible()
    await expect(page.locator("text=Rata-rata Skor per Departemen")).toBeVisible()
    await expect(page.locator("text=Persentase Penyelesaian per Departemen")).toBeVisible()

    // C. Fitur Khusus Super-Admin
    await expect(page.locator("text=Tata Kelola & Struktur Departemen (Super-Admin)")).toBeVisible()
    await expect(page.locator("text=Pintasan Cepat Tata Kelola Pimpinan")).toBeVisible()

    // D. Pintasan langsung ke /ekspor, /periode, /ketua, /departemen
    await expect(page.locator('a[href="/ekspor"]').first()).toBeVisible()
    await expect(page.locator('a[href="/periode"]').first()).toBeVisible()
    await expect(page.locator('a[href="/ketua"]').first()).toBeVisible()
    await expect(page.locator('a[href="/departemen"]').first()).toBeVisible()

    // E. Uji Aksesibilitas WCAG AA (Light & Dark)
    const axeLight = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("[data-sonner-toaster]")
      .analyze()
    expect(axeLight.violations, `Axe WCAG violation pada Dashboard Super-Admin (Light): ${JSON.stringify(axeLight.violations, null, 2)}`).toEqual([])

    await page.click('button[aria-label="Ganti mode tema"]')
    await page.waitForTimeout(300)
    const axeDark = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("[data-sonner-toaster]")
      .analyze()
    expect(axeDark.violations, `Axe WCAG violation pada Dashboard Super-Admin (Dark): ${JSON.stringify(axeDark.violations, null, 2)}`).toEqual([])
  })

  // ===========================================================================
  // 4. RESPONSIF MOBILE (360px VIEWPORT)
  // ===========================================================================
  test("4. Dashboard responsif pada viewport mobile 360px tanpa layout jebol atau horizontal scrollbar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // Pastikan kartu KPI dan grafik ter-render dengan rapi
    await expect(page.locator("text=Total Departemen Aktif")).toBeVisible()
    await expect(page.locator("text=Rata-rata Skor per Departemen")).toBeVisible()

    // Verifikasi lebar body tidak melebihi viewport 360px (tidak ada overflow horizontal)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2) // toleransi 2px subpixel rounding
  })
})
