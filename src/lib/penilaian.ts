/**
 * Utility functions untuk modul penilaian kinerja anggota dan ketua departemen.
 * Modul ini tidak menggunakan direktif "use server" sehingga aman mengekspor
 * fungsi utilitas murni sinkron (pure synchronous helper).
 */

/**
 * Memeriksa apakah seorang anggota (member) merupakan Ketua Departemen
 * berdasarkan variasi jabatan atau kecocokan profil ketua departemen.
 */
export function isKetuaMember(
  member: { nama: string; jabatan: string; no_hp?: string | null },
  ketuaProfile?: { id?: string; nama?: string; no_hp?: string | null } | null
): boolean {
  // 1. Cek jabatan (Ketua Departemen, Kepala Departemen, Kadep, dll dan bukan wakil/sub)
  const j = member.jabatan ? member.jabatan.toLowerCase().trim() : ""
  const isKetuaByJabatan =
    (j.includes("ketua") || j.includes("kepala") || j.includes("kadep")) &&
    !j.includes("wakil") &&
    !j.includes("sub")

  if (isKetuaByJabatan) return true

  // 2. Cek kesesuaian dengan profil ketua departemen (nama atau kontak)
  if (ketuaProfile && ketuaProfile.nama) {
    const cleanKetua = ketuaProfile.nama
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .trim()
    const cleanMember = member.nama
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .trim()

    if (
      cleanKetua &&
      cleanMember &&
      (cleanKetua === cleanMember ||
        cleanKetua.includes(cleanMember) ||
        cleanMember.includes(cleanKetua))
    ) {
      return true
    }

    if (
      member.no_hp &&
      ketuaProfile.no_hp &&
      member.no_hp.replace(/\D/g, "") === ketuaProfile.no_hp.replace(/\D/g, "") &&
      member.no_hp.replace(/\D/g, "").length >= 8
    ) {
      return true
    }
  }

  return false
}

export interface AssessmentComments {
  evaluasi: string
  proker: string
  hasil_usaha: string
}

/**
 * Parsing data catatan penilaian ke objek 3 komentar terstruktur:
 * - evaluasi
 * - proker
 * - hasil_usaha
 * Menjaga kompatibilitas dengan format teks lama (legacy plain text string).
 */
export function parseAssessmentComments(raw: string | null | undefined): AssessmentComments {
  if (!raw || !raw.trim()) {
    return { evaluasi: "", proker: "", hasil_usaha: "" }
  }

  const trimmed = raw.trim()

  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === "object") {
      return {
        evaluasi: typeof parsed.evaluasi === "string" ? parsed.evaluasi : "",
        proker: typeof parsed.proker === "string" ? parsed.proker : "",
        hasil_usaha: typeof parsed.hasil_usaha === "string" ? parsed.hasil_usaha : "",
      }
    }
  } catch {
    // Jika bukan JSON (format lama teks biasa), masukkan ke bagian evaluasi
    return {
      evaluasi: trimmed,
      proker: "",
      hasil_usaha: "",
    }
  }

  return { evaluasi: "", proker: "", hasil_usaha: "" }
}

/**
 * Serialisasi 3 komentar menjadi JSON string untuk disimpan ke kolom `catatan`.
 * Mengembalikan `null` jika ketiga komentar kosong setelah di-trim.
 */
export function serializeAssessmentComments(comments: AssessmentComments): string | null {
  const evaluasi = comments.evaluasi?.trim() || ""
  const proker = comments.proker?.trim() || ""
  const hasil_usaha = comments.hasil_usaha?.trim() || ""

  if (!evaluasi && !proker && !hasil_usaha) {
    return null
  }

  return JSON.stringify({
    evaluasi,
    proker,
    hasil_usaha,
  })
}

/**
 * Memeriksa apakah minimal salah satu komentar telah diisi.
 */
export function hasAssessmentComments(comments: AssessmentComments): boolean {
  return Boolean(
    comments.evaluasi?.trim() ||
    comments.proker?.trim() ||
    comments.hasil_usaha?.trim()
  )
}

