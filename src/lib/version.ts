/**
 * Konfigurasi versi aplikasi yang terhubung otomatis dengan package.json / environment variable Vercel.
 */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || "1.0"

/**
 * Mengambil string versi aplikasi yang rapi (misal: "1.0").
 */
export function getAppVersion(): string {
  return APP_VERSION.replace(/^v/i, "").trim()
}
