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
