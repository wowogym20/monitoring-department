interface RateLimitRecord {
  count: number
  resetTime: number
}

const memoryStore = new Map<string, RateLimitRecord>()

/**
 * Rate limiter sederhana di sisi server (in-memory).
 * Digunakan untuk membatasi frekuensi percobaan aksi sensitif seperti login.
 *
 * @param key Identifier unik (misalnya alamat email atau IP)
 * @param maxAttempts Jumlah maksimal percobaan yang diizinkan dalam satu jendela waktu
 * @param windowMs Durasi jendela waktu dalam milidetik (default: 60 detik)
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now()
  const record = memoryStore.get(key)

  if (!record || now > record.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterSeconds: 0,
    }
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSeconds: 0,
  }
}

/**
 * Reset catatan percobaan jika aksi berhasil (misal login sukses).
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key)
}
