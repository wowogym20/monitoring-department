import { test, expect } from "@playwright/test"

const ADMIN_ACCOUNT = {
  email: "superadmin@tazakka.id",
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

  test("1. Sidebar desktop default terbuka, dapat di-collapse dan di-expand dengan toggle button", async ({
    page,
  }) => {
    // 1. Login
    await page.goto("/login")
    await page.fill('input[type="email"]', ADMIN_ACCOUNT.email)
    await page.fill('input[type="password"]', ADMIN_ACCOUNT.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // Pastikan sidebar awal terbuka (w-64)
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveClass(/w-64/)

    // Tombol toggle harus punya aria-expanded="true" dan aria-label
    const toggleCollapseBtn = sidebar.locator('button[aria-label="Tutup sidebar"]').first()
    await expect(toggleCollapseBtn).toBeVisible()
    await expect(toggleCollapseBtn).toHaveAttribute("aria-expanded", "true")

    // 2. Klik tombol toggle untuk menutup sidebar
    await toggleCollapseBtn.click()

    // Sidebar harus mengecil menjadi icon-only (w-16)
    await expect(sidebar).toHaveClass(/w-16/)

    // Tombol toggle bawah/atas harus berubah aria-expanded="false" dan aria-label="Buka sidebar"
    const toggleExpandBtn = sidebar.locator('button[aria-label="Buka sidebar"]').first()
    await expect(toggleExpandBtn).toBeVisible()
    await expect(toggleExpandBtn).toHaveAttribute("aria-expanded", "false")

    // Cek bahwa cookie sidebar_state telah diset ke "collapsed"
    const cookies = await page.context().cookies()
    const sidebarCookie = cookies.find((c) => c.name === "sidebar_state")
    expect(sidebarCookie?.value).toBe("collapsed")

    // 3. Klik tombol toggle untuk membuka kembali
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
    // Tutup sidebar
    const toggleCollapseBtn = sidebar.locator('button[aria-label="Tutup sidebar"]').first()
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
    context,
  }) => {
    // Set cookie secara eksplisit bahwa pengguna menginginkan sidebar "expanded"
    await context.addCookies([
      {
        name: "sidebar_state",
        value: "expanded",
        domain: "localhost",
        path: "/",
      },
      {
        name: "sidebar_custom_pref",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ])

    // Set viewport tablet portrait (820 x 1180)
    await page.setViewportSize({ width: 820, height: 1180 })

    await page.goto("/dashboard")
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeVisible()
    // Karena preferensi pengguna diutamakan, sidebar tetap terbuka (w-64)
    await expect(sidebar).toHaveClass(/w-64/)
  })

  test("5. Responsif: Mobile drawer overlay tertutup secara default dan dapat dibuka via hamburger", async ({
    page,
  }) => {
    // Set viewport mobile iPhone
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto("/dashboard")

    // Desktop sidebar harus hidden
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
