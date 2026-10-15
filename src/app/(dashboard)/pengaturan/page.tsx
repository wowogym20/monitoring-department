import { Metadata } from "next"
import { requireRole } from "@/lib/auth"
import { getSystemSettingsAction } from "@/lib/actions/settings"
import { PengaturanClient } from "./pengaturan-client"

export const metadata: Metadata = {
  title: "Pengaturan Sistem | Super-Admin Monitoring Departemen",
  description:
    "Konfigurasi terpusat sistem monitoring departemen: identitas aplikasi, pengumuman, kebijakan skor, dan mode pemeliharaan.",
}

export default async function PengaturanPage() {
  // Hanya role super_admin yang berhak mengakses halaman ini
  await requireRole("super_admin")

  // Ambil pengaturan sistem terkini dari Supabase / default fallback
  const settings = await getSystemSettingsAction()

  return <PengaturanClient initialSettings={settings} />
}
