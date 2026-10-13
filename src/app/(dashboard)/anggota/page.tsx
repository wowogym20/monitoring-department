import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getMembersServer } from "@/lib/actions/member"
import { AnggotaManager } from "./anggota-manager"

export default async function AnggotaPage() {
  const currentUser = await requireRole("super_admin", "admin", "user")
  const supabase = await createClient()

  // Ambil daftar departemen aktif untuk filter dan formulir tambah
  const { data: departments } = await supabase
    .from("departments")
    .select("id, nama, kode")
    .eq("is_active", true)
    .order("nama", { ascending: true })

  const initialData = await getMembersServer({
    page: 1,
    pageSize: 10,
    status: "all",
  })

  return (
    <AnggotaManager
      userRole={currentUser.role}
      userDepartmentId={currentUser.department?.id || null}
      userDepartmentName={currentUser.department?.nama || null}
      departments={departments || []}
      initialData={initialData}
    />
  )
}
