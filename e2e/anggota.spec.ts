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
}

test.describe("Alur Manajemen Anggota: Ketua (Mobile 360px) & Admin SDM (Impor Massal)", () => {
  const timestamp = Date.now().toString().slice(-5)
  const namaAnggota = `Ust. Ahmad E2E ${timestamp}`
  const nipAnggota = `NIP${timestamp}`
  const jabatanAwal = "Pengajar Fiqih"
  const jabatanBaru = "Kepala Kurikulum Fiqih"

  test("1. Ketua mengelola CRUD anggota departemen sendiri dari viewport mobile 360px", async ({
    page,
  }) => {
    // Set viewport mobile 360px sesuai kebutuhan non-fungsional dan PRD
    await page.setViewportSize({ width: 360, height: 740 })

    // 1. Login sebagai Ketua Pendidikan
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.ketuaPendidikan.email)
    await page.fill('input[type="password"]', ACCOUNTS.ketuaPendidikan.password)
    await page.click('button[type="submit"]')

    await page.waitForURL("**/dashboard")

    // 2. Navigasi ke /anggota
    await page.goto("/anggota")
    await page.waitForURL("**/anggota")

    await expect(page.locator('h1:has-text("Manajemen Anggota")')).toBeVisible()
    await expect(page.locator('[data-testid="user-dept-indicator"]')).toBeVisible()

    // 3. Tambah Anggota Baru via Dialog (mobile friendly)
    const btnTambah = page.locator("#btn-tambah-anggota")
    await expect(btnTambah).toBeVisible()
    await btnTambah.click()

    await expect(page.locator('text=Tambah Anggota Baru')).toBeVisible()

    // Verifikasi bahwa untuk Ketua, tidak ada dropdown departemen client-side (departemen otomatis terikat)
    await expect(page.locator("#select-departemen")).not.toBeVisible()

    // Isi formulir anggota
    await page.fill("#input-nama", namaAnggota)
    await page.fill("#input-nip", nipAnggota)
    await page.fill("#input-jabatan", jabatanAwal)
    await page.fill("#input-no-hp", "081234567890")

    // Submit tambah anggota
    await page.click("#btn-submit-member")

    // Verifikasi kartu anggota baru tampil di viewport mobile
    const card = page.locator('[data-testid="member-card"]').filter({ hasText: namaAnggota })
    await expect(card).toBeVisible({ timeout: 10000 })
    await expect(card.getByText(jabatanAwal)).toBeVisible()

    // 4. Pencarian Anggota
    await page.fill("#search-anggota", nipAnggota)
    await expect(card).toBeVisible({ timeout: 5000 })

    // 5. Ubah Data Anggota (Edit)
    const btnUbah = card.locator('button:has-text("Ubah")')
    await btnUbah.click()

    await expect(page.locator('text=Ubah Data Anggota')).toBeVisible()
    await page.fill("#input-jabatan", jabatanBaru)
    await page.click("#btn-submit-member")

    // Verifikasi jabatan baru muncul di kartu
    await expect(card.getByText(jabatanBaru)).toBeVisible({ timeout: 10000 })

    // 6. Nonaktifkan Status Anggota
    const btnToggle = card.locator('button:has-text("Nonaktifkan"), button:has-text("Aktifkan")').first()
    await btnToggle.click()

    // Verifikasi status berubah
    await expect(card.locator("text=Nonaktif").first()).toBeVisible({ timeout: 10000 })

    // 7. Hapus Anggota dengan AlertDialog Konfirmasi
    const btnHapus = card.locator('button:has-text("Hapus")')
    await btnHapus.click()

    // AlertDialog konfirmasi muncul
    await expect(page.locator("text=Hapus Anggota Departemen?")).toBeVisible()
    await expect(page.locator("text=soft delete")).toBeVisible()

    // Klik tombol konfirmasi hapus
    await page.click("#btn-confirm-delete")

    // Verifikasi anggota terhapus dari daftar pencarian
    await expect(card).not.toBeVisible({ timeout: 10000 })
  })

  test("2. Admin SDM melihat semua departemen dan mengimpor file data anggota massal", async ({
    page,
  }) => {
    // 1. Login sebagai Admin SDM
    await page.goto("/login")
    await page.fill('input[type="email"]', ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')

    await page.waitForURL("**/dashboard")

    // 2. Navigasi ke /anggota
    await page.goto("/anggota")
    await page.waitForURL("**/anggota")

    // Admin dapat melihat filter departemen
    await expect(page.locator("#filter-departemen")).toBeVisible()

    // Admin TIDAK boleh memiliki tombol tambah anggota langsung (sesuai matriks hak akses)
    await expect(page.locator("#btn-tambah-anggota")).not.toBeVisible()

    // 3. Buka Modal Impor Massal
    const btnImport = page.locator("#btn-open-import")
    await expect(btnImport).toBeVisible()
    await btnImport.click()

    await expect(page.locator("text=Impor Massal Data Anggota")).toBeVisible()

    // Verifikasi tautan unduh template
    await expect(page.locator('a[href*="/api/members/template?format=xlsx"]')).toBeVisible()

    // 4. Siapkan file CSV untuk impor
    const importNip = `IMP${timestamp}`
    const importNama = `Ustadz Impor E2E ${timestamp}`
    const csvContent = `kode_departemen,nip,nama,jabatan,no_hp\nTI,${importNip},${importNama},Staff Database,081234567899\n`

    // Unggah file ke input
    await page.setInputFiles("#file-input-anggota", {
      name: "anggota-test.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent, "utf-8"),
    })

    // Klik tombol Mulai Impor
    await page.click("#btn-upload-import")

    // 5. Verifikasi Feedback Hasil Impor
    await expect(page.locator('[data-testid="import-result"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator("text=1 Berhasil")).toBeVisible()

    // Tutup dialog impor
    await page.click('button:has-text("Selesai")')

    // 6. Cari data yang baru diimpor di tabel
    await page.fill("#search-anggota", importNama)
    await expect(page.locator(`text=${importNama}`).first()).toBeVisible({ timeout: 10000 })
  })
})
