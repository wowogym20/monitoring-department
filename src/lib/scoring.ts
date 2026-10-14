export interface KategoriSkorResult {
  kategori: string
  skorFormatted: string
  skorRounded: number | null
  badgeClass: string
  meaning: string
}

/**
 * Membulatkan angka ke 2 desimal secara matematis presisi
 */
export function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100
}

/**
 * Menghitung kategori skor akhir sesuai PRD Bagian 8.
 * Rentang skor:
 * - 4,50 – 5,00: Sangat Baik (Emerald Solid)
 * - 3,50 – 4,49: Baik (Emerald Soft)
 * - 2,50 – 3,49: Cukup (Netral Slate)
 * - 1,50 – 2,49: Kurang (Oren Amber Soft)
 * - 1,00 – 1,49: Sangat Kurang (Oren Pekat / Coral)
 * - null/undefined/<1: Belum Dinilai
 */
export function kategoriSkor(skor: number | null | undefined): KategoriSkorResult {
  if (skor === null || skor === undefined || Number.isNaN(skor) || skor < 1) {
    return {
      kategori: "Belum Dinilai",
      skorFormatted: "-",
      skorRounded: null,
      badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
      meaning: "Belum ada nilai atau tidak memenuhi rentang evaluasi",
    }
  }

  // Bulatkan 2 desimal
  const rounded = roundToTwoDecimals(skor)
  const formatted = rounded.toFixed(2)

  if (rounded >= 4.50) {
    return {
      kategori: "Sangat Baik",
      skorFormatted: formatted,
      skorRounded: rounded,
      badgeClass: "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-700",
      meaning: "Capaian istimewa, konsisten melampaui standar",
    }
  }

  if (rounded >= 3.50) {
    return {
      kategori: "Baik",
      skorFormatted: formatted,
      skorRounded: rounded,
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70",
      meaning: "Kinerja solid memenuhi ekspektasi",
    }
  }

  if (rounded >= 2.50) {
    return {
      kategori: "Cukup",
      skorFormatted: formatted,
      skorRounded: rounded,
      badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
      meaning: "Memenuhi kriteria minimum standar",
    }
  }

  if (rounded >= 1.50) {
    return {
      kategori: "Kurang",
      skorFormatted: formatted,
      skorRounded: rounded,
      badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/70",
      meaning: "Butuh pembinaan dan peningkatan aktif",
    }
  }

  return {
    kategori: "Sangat Kurang",
    skorFormatted: formatted,
    skorRounded: rounded,
    badgeClass: "bg-orange-700 text-white border-orange-800 dark:bg-orange-800 dark:border-orange-900 hover:bg-orange-700",
    meaning: "Memerlukan intervensi & pendampingan intensif",
  }
}
