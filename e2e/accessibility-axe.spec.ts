import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ACCOUNTS = {
  superAdmin: {
    email: 'superadmin@tazakka.id',
    password: 'Password123!',
  },
  admin: {
    email: 'admin.sdm@tazakka.id',
    password: 'Password123!',
  },
  ketua: {
    email: 'ketua.pendidikan@tazakka.id',
    password: 'Password123!',
  },
}

test.describe('Audit Aksesibilitas WCAG 2.1 AA (@axe-core/playwright)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('1. Halaman /login memenuhi standar WCAG 2.1 AA (Light & Dark)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Pindai mode terang
    const axeLight = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(axeLight.violations, `Temuan WCAG pada /login (Light): ${JSON.stringify(axeLight.violations, null, 2)}`).toEqual([])

    // Pindai mode gelap
    await page.click('button[aria-label="Ganti mode tema"]')
    await page.waitForTimeout(300)
    const axeDark = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(axeDark.violations, `Temuan WCAG pada /login (Dark): ${JSON.stringify(axeDark.violations, null, 2)}`).toEqual([])
  })

  test('2. Halaman Super-Admin (/dashboard, /departemen, /ketua, /periode, /aspek, /profil) memenuhi standar WCAG 2.1 AA', async ({
    page,
  }) => {
    // Login sebagai Super Admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ACCOUNTS.superAdmin.email)
    await page.fill('input[type="password"]', ACCOUNTS.superAdmin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    const routesToScan = ['/dashboard', '/departemen', '/ketua', '/periode', '/aspek', '/profil']

    for (const route of routesToScan) {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(500)

      const scanResult = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Sembunyikan elemen toast sonner jika ada yang beranimasi
        .exclude('[data-sonner-toaster]')
        .analyze()

      expect(
        scanResult.violations,
        `Temuan WCAG pada rute Super-Admin ${route}: ${JSON.stringify(scanResult.violations, null, 2)}`
      ).toEqual([])
    }
  })

  test('3. Halaman Admin SDM (/rekap, /ekspor) memenuhi standar WCAG 2.1 AA', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    const routesToScan = ['/rekap', '/ekspor']

    for (const route of routesToScan) {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(500)

      const scanResult = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('[data-sonner-toaster]')
        .analyze()

      expect(
        scanResult.violations,
        `Temuan WCAG pada rute Admin ${route}: ${JSON.stringify(scanResult.violations, null, 2)}`
      ).toEqual([])
    }
  })

  test('4. Halaman Ketua Departemen (/anggota, /penilaian) memenuhi standar WCAG 2.1 AA', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ACCOUNTS.ketua.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketua.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    const routesToScan = ['/anggota', '/penilaian']

    for (const route of routesToScan) {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(500)

      const scanResult = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('[data-sonner-toaster]')
        .analyze()

      expect(
        scanResult.violations,
        `Temuan WCAG pada rute Ketua ${route}: ${JSON.stringify(scanResult.violations, null, 2)}`
      ).toEqual([])
    }
  })
})
