/**
 * Helper pemformatan tanggal dengan zona waktu Asia/Jakarta.
 * Format standar: "dd MMM yyyy" (contoh: "13 Okt 2026") dan "dd MMM yyyy, HH:mm".
 */

const JAKARTA_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const JAKARTA_DATETIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

/**
 * Format string ISO / string YYYY-MM-DD / Date ke format "dd MMM yyyy" (Asia/Jakarta)
 */
export function formatDateJakarta(
  dateInput: string | Date | null | undefined,
  fallback = "-"
): string {
  if (!dateInput) return fallback

  try {
    let dateObj: Date

    if (typeof dateInput === "string") {
      // Jika format tanggal murni YYYY-MM-DD tanpa jam, parse aman agar tidak bergeser tanggal karena timezone
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split("-").map(Number)
        // Gunakan UTC noon untuk menghindari efek offset jam mundur ke hari sebelumnya
        dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      } else {
        dateObj = new Date(dateInput)
      }
    } else {
      dateObj = dateInput
    }

    if (isNaN(dateObj.getTime())) {
      return fallback
    }

    // Ganti titik pada singkatan bulan bahasa Indonesia jika ada (misal "Okt." -> "Okt")
    return JAKARTA_FORMATTER.format(dateObj).replace(/\./g, "")
  } catch {
    return fallback
  }
}

/**
 * Format string ISO / Date ke format "dd MMM yyyy, HH:mm" (Asia/Jakarta)
 */
export function formatDateTimeJakarta(
  dateInput: string | Date | null | undefined,
  fallback = "-"
): string {
  if (!dateInput) return fallback

  try {
    const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    if (isNaN(dateObj.getTime())) return fallback

    return JAKARTA_DATETIME_FORMATTER.format(dateObj).replace(/\./g, "").replace(/\./g, ":")
  } catch {
    return fallback
  }
}

// Alias untuk kemudahan penamaan lokalisasi ID
export const formatDateId = formatDateJakarta
export const formatDateTimeId = formatDateTimeJakarta
