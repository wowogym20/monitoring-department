import { test, expect } from "@playwright/test"

const ADMIN_ACCOUNT = {
  email: "superadmin@tazakka.or.id",
  password: "Password123!",
}

test.describe("Fitur Collapsible Sidebar & Persistensi Cookie", () => {
  test.beforeEach(async ({ page }) => {
    // Pantau error hydration di console
    page.on("console", (msg) => {
      const text = msg.text()
      if (text.includes("Hydration failed") || text.includes("hydration mismatch")) {
        throw new Error(`Deteksi hydration mismatch di console: ${text}`)
      }
    })
  })

  test("1. Sidebar desktop default terbuka, toggle buka/tutup hanya ada di header app", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', ADMIN_ACCOUNT.email)
    await page.fill('input[type="password"]', ADMIN_ACCOUNT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // Pastikan sidebar awal terbuka (w-64)
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveClass(/w-64/)

    // Pastikan di sidebar TIDAK ADA tombol toggle tutup maupun buka
    await expect(sidebar.locator('button[aria-label="Tutup sidebar"]')).toHaveCount(0)
    await expect(sidebar.locator('button[aria-label="Buka sidebar"]')).toHaveCount(0)

    // Tombol toggle harus ada di header app, punya aria-expanded="true" dan aria-label="Tutup sidebar"
    const toggleCollapseBtn = page.locator('header button[aria-label="Tutup sidebar"]').first()
    await expect(toggleCollapseBtn).toBeVisible()
    await expect(toggleCollapseBtn).toHaveAttribute("aria-expanded", "true")

    // 2. Klik tombol toggle di header app untuk menutup sidebar
    await toggleCollapseBtn.click()

    // Sidebar harus mengecil menjadi icon-only (w-16)
    await expect(sidebar).toHaveClass(/w-16/)

    // Tombol toggle di header app harus berubah aria-expanded="false" dan aria-label="Buka sidebar"
    const toggleExpandBtn = page.locator('header button[aria-label="Buka sidebar"]').first()
    await expect(toggleExpandBtn).toBeVisible()
    await expect(toggleExpandBtn).toHaveAttribute("aria-expanded", "false")

    // Di sidebar tetap tidak ada tombol toggle
    await expect(sidebar.locator('button[aria-label="Buka sidebar"]')).toHaveCount(0)

    // Cek bahwa cookie sidebar_state telah diset ke "collapsed"
    const cookies = await page.context().cookies()
    const sidebarCookie = cookies.find((c) => c.name === "sidebar_state")
    expect(sidebarCookie?.value).toBe("collapsed")

    // 3. Klik tombol toggle di header app untuk membuka kembali
    await toggleExpandBtn.click()
    await expect(sidebar).toHaveClass(/w-64/)

    // Cookie terupdate ke "expanded"
    const updatedCookies = await page.context().cookies()
    const updatedCookie = updatedCookies.find((c) => c.name === "sidebar_state")
    expect(updatedCookie?.value).toBe("expanded")
  })

  test("2. Persistensi state: saat ditutup lalu direfresh atau tab dibuka ulang, sidebar tetap tertutup", async ({
    page,
  }) => {
    // 1. Login
    await page.goto("/login")
    await page.fill('input[type="email"]', ADMIN_ACCOUNT.email)
    await page.fill('input[type="password"]', ADMIN_ACCOUNT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    const sidebar = page.locator("aside")
    // Tutup sidebar via tombol di header app
    const toggleCollapseBtn = page.locator('header button[aria-label="Tutup sidebar"]').first()
    await toggleCollapseBtn.click()
    await expect(sidebar).toHaveClass(/w-16/)

    // 2. Refresh halaman
    await page.reload()
    await page.waitForLoadState("domcontentloaded")

    // Sidebar harus langsung dalam keadaan tertutup (w-16) dari SSR tanpa flicker
    await expect(sidebar).toHaveClass(/w-16/)

    // 3. Navigasi ke halaman lain (misal /departemen)
    await page.goto("/departemen")
    await page.waitForLoadState("domcontentloaded")
    await expect(sidebar).toHaveClass(/w-16/)
  })

  test("3. Responsif: Tablet portrait default tertutup jika belum ada preferensi tersimpan", async ({
    page,
    context,
  }) => {
    // Bersihkan cookie agar menyimulasikan pengguna baru
    await context.clearCookies()

    // Set viewport tablet portrait (iPad: 820 x 1180)
    await page.setViewportSize({ width: 820, height: 1180 })

    await page.goto("/login")
    await page.fill('input[type="email"]', ADMIN_ACCOUNT.email)
    await page.fill('input[type="password"]', ADMIN_ACCOUNT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // Pada tablet portrait tanpa preferensi tersimpan, sidebar harus otomatis tertutup (w-16)
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveClass(/w-16/)
  })

  test("4. Responsif: Tablet portrait mengutamakan preferensi pengguna jika sudah ada", async ({
    page,
  }) => {
    // 1. Login terlebih dahulu di desktop
    await page.goto("/login")
    await page.fill('input[type="email"]', ADMIN_ACCOUNT.email)
    await page.fill('input[type="password"]', ADMIN_ACCOUNT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    const sidebar = page.locator("aside")
    await expect(sidebar).toHaveClass(/w-64/)

    // Jika user secara manual memastikan sidebar terbuka (atau klik toggle tutup lalu buka di header app)
    const toggleCollapseBtn = page.locator('header button[aria-label="Tutup sidebar"]').first()
    await toggleCollapseBtn.click()
    await expect(sidebar).toHaveClass(/w-16/)

    const toggleExpandBtn = page.locator('header button[aria-label="Buka sidebar"]').first()
    await toggleExpandBtn.click()
    await expect(sidebar).toHaveClass(/w-64/)

    // Sekarang resize viewport ke tablet portrait (820 x 1180)
    await page.setViewportSize({ width: 820, height: 1180 })
    await page.reload()
    await page.waitForLoadState("domcontentloaded")

    // Karena preferensi pengguna adalah terbuka (expanded), preferensi pengguna diutamakan
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveClass(/w-64/)
  })

  test("5. Responsif: Mobile drawer overlay tertutup secara default dan dapat dibuka via hamburger", async ({
    page,
  }) => {
    // Set viewport mobile iPhone
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto("/login")
    await page.fill('input[type="email"]', ADMIN_ACCOUNT.email)
    await page.fill('input[type="password"]', ADMIN_ACCOUNT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // Desktop sidebar harus hidden di mobile
    const desktopSidebar = page.locator("aside")
    await expect(desktopSidebar).toBeHidden()

    // Mobile hamburger harus terlihat
    const hamburger = page.locator('button[aria-label="Buka navigasi menu"]')
    await expect(hamburger).toBeVisible()

    // Buka Sheet drawer
    await hamburger.click()
    const sheet = page.locator('[role="dialog"]')
    await expect(sheet).toBeVisible()
    await expect(sheet.locator("text=Monitoring Departemen")).toBeVisible()
  })
})
