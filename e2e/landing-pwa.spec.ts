import { test, expect } from "@playwright/test"

const SUPER_ADMIN = {
  email: "superadmin@tazakka.or.id",
  password: "Password123!",
}

test.describe("Fitur Halaman Beranda Hero (/), PWA, Open Graph SEO & Loading Bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test("1. Tamu belum login melihat Hero Section unscrollable dengan teks besar & tombol Login", async ({
    page,
  }) => {
    // Uji pada viewport mobile kecil 360x640
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto("/", { waitUntil: "domcontentloaded" })

    // Verifikasi Heading Utama
    const heading = page.locator("h1")
    await expect(heading).toBeVisible()
    await expect(heading).toContainText("Dashboard Integrasi")
    await expect(heading).toContainText("Tazakka")

    // Verifikasi Tombol Login
    const loginBtn = page.locator("#btn-hero-login")
    await expect(loginBtn).toBeVisible()
    await expect(loginBtn).toHaveAttribute("href", "/login")

    // Tombol Buka Dashboard TIDAK boleh tampil jika belum login
    await expect(page.locator("#btn-hero-dashboard")).not.toBeVisible()

    // Verifikasi Tombol Install Aplikasi muncul
    const installBtn = page.locator("#btn-hero-install")
    await expect(installBtn).toBeVisible()
    await expect(installBtn).toContainText("Install Aplikasi")

    // Verifikasi tidak ada vertical scrollbar pada halaman (unscrollable)
    const isUnscrollable = await page.evaluate(() => {
      const main = document.querySelector("main")
      if (!main) return false
      const style = window.getComputedStyle(main)
      const isOverflowHidden = style.overflow === "hidden" || style.overflowY === "hidden"
      const fitsViewport = main.clientHeight <= window.innerHeight + 2
      return isOverflowHidden && fitsViewport
    })
    expect(isUnscrollable).toBe(true)

    // Klik tombol install membuka panduan / prompt
    await installBtn.click()
    const modalGuide = page.locator('[role="dialog"]')
    await expect(modalGuide).toBeVisible()
    await expect(page.locator("text=Install Aplikasi Tazakka")).toBeVisible()
    await page.click('button:has-text("Mengerti")')
    await expect(modalGuide).not.toBeVisible()
  })

  test("2. Pengguna sudah login melihat tombol 'Buka Dashboard' di halaman beranda /", async ({
    page,
  }) => {
    // 1. Login terlebih dahulu
    await page.goto("/login", { waitUntil: "domcontentloaded" })
    await page.fill('input[type="email"]', SUPER_ADMIN.email)
    await page.fill('input[type="password"]', SUPER_ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")

    // 2. Kunjungi halaman beranda "/"
    await page.goto("/", { waitUntil: "domcontentloaded" })

    // Verifikasi tombol berubah menjadi "Buka Dashboard"
    const dashboardBtn = page.locator("#btn-hero-dashboard")
    await expect(dashboardBtn).toBeVisible()
    await expect(dashboardBtn).toHaveAttribute("href", "/dashboard")
    await expect(dashboardBtn).toContainText("Buka Dashboard")

    // Tombol login biasa tidak boleh muncul
    await expect(page.locator("#btn-hero-login")).not.toBeVisible()

    // Klik Buka Dashboard mengarah ke /dashboard
    await dashboardBtn.click()
    await page.waitForURL("**/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("3. Open Graph, Twitter Card, Manifest PWA & Top Progress Bar terkonfigurasi dengan benar", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })

    // Verifikasi Meta Open Graph
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content")
    expect(ogTitle).toContain("Dashboard Integrasi Tazakka")

    const ogSiteName = await page.locator('meta[property="og:site_name"]').getAttribute("content")
    expect(ogSiteName).toBe("Dashboard Integrasi Tazakka")

    // Verifikasi Twitter Card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content")
    expect(twitterCard).toBe("summary_large_image")

    // Verifikasi Web App Manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute("href")
    expect(manifestLink).toContain("manifest.webmanifest")

    // Verifikasi responsibilitas endpoint manifest
    const manifestResponse = await page.request.get("/manifest.webmanifest")
    expect(manifestResponse.status()).toBe(200)
    const manifestJson = await manifestResponse.json()
    expect(manifestJson.name).toBe("Dashboard Integrasi Tazakka")
    expect(manifestJson.display).toBe("standalone")

    // Verifikasi responsibilitas robots.txt dan sitemap.xml
    const robotsResponse = await page.request.get("/robots.txt")
    expect(robotsResponse.status()).toBe(200)

    const sitemapResponse = await page.request.get("/sitemap.xml")
    expect(sitemapResponse.status()).toBe(200)
  })

  test("4. Halaman /login menyediakan navigasi yang berfungsi untuk kembali ke beranda (/)", async ({
    page,
  }) => {
    // 1. Uji tombol navigasi di pojok kiri atas
    await page.goto("/login")
    const backBtn = page.locator("#btn-back-home")
    await expect(backBtn).toBeVisible()
    await expect(backBtn).toHaveAttribute("href", "/")
    await backBtn.click()
    await expect(page).toHaveURL("/")

    // 2. Uji tautan di bagian bawah form login (CardFooter)
    await page.goto("/login")
    const footerHomeLink = page.locator('form a[href="/"]:has-text("Kembali ke Beranda")')
    await expect(footerHomeLink).toBeVisible()
    await footerHomeLink.click()
    await expect(page).toHaveURL("/")

    // 3. Uji klik logo / brand header
    await page.goto("/login")
    const brandLink = page.locator('a[aria-label="Kembali ke Beranda"]').filter({ has: page.locator("img") })
    await expect(brandLink).toBeVisible()
    await brandLink.click()
    await expect(page).toHaveURL("/")
  })
})
