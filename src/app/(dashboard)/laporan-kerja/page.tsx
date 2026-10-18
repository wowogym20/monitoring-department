import { Metadata } from "next"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { getLaporanKerjaServer, type LaporanKerjaApiResponse } from "@/lib/actions/laporan-kerja"
import { LaporanKerjaClient, type DepartmentMemberOption } from "./components/laporan-kerja-client"

export const metadata: Metadata = {
  title: "Laporan Kerja Anggota | Monitoring Departemen",
  description: "Pusat rekapitulasi dan pemantauan laporan kerja harian anggota departemen terintegrasi.",
}

export default async function LaporanKerjaPage() {
  // Akses terbuka untuk seluruh role resmi terautentikasi (super_admin, admin, user): CRUD, bulk action, approval
  const currentUser = await requireRole("super_admin", "admin", "user")
  const supabase = await createClient()

  let departmentMembers: DepartmentMemberOption[] = []
  let initialData: LaporanKerjaApiResponse

  if (currentUser.role === "user") {
    // 1. Role User (Ketua Departemen): Hanya boleh melihat & mengelola laporan kerja anggotanya sendiri
    const userDeptId = currentUser.department?.id

    if (!userDeptId) {
      // Jika akun user belum terhubung ke departemen di database
      initialData = {
        status: "success",
        total: 0,
        page: 1,
        limit: 100,
        total_pages: 0,
        data: [],
      }
      return (
        <LaporanKerjaClient
          initialData={initialData}
          userRole={currentUser.role}
          departmentName={null}
          departmentMembers={[]}
        />
      )
    }

    // Ambil seluruh data anggota di Supabase yang memiliki departemen sama dengan ketua
    const { data: membersData } = await supabase
      .from("members")
      .select("id, nip, nama, jabatan")
      .eq("department_id", userDeptId)
      .is("deleted_at", null)
      .order("nama", { ascending: true })

    departmentMembers = (membersData || []).map((m) => ({
      id: m.id,
      nip: m.nip,
      nama: m.nama,
      jabatan: m.jabatan,
    }))

    // Himpunan ID & NIP anggota departemen untuk pencocokan cepat
    const allowedNips = new Set<string>()
    const allowedIds = new Set<string>()
    const allowedNames = new Set<string>()

    for (const m of departmentMembers) {
      if (m.nip && m.nip.trim()) {
        allowedNips.add(m.nip.trim().toLowerCase())
      }
      if (m.id && m.id.trim()) {
        allowedIds.add(m.id.trim().toLowerCase())
      }
      if (m.nama && m.nama.trim()) {
        allowedNames.add(m.nama.trim().toLowerCase())
      }
    }

    // Ambil data laporan kerja dari API Tazakka
    const rawData = await getLaporanKerjaServer({ limit: 200 })

    // Saring laporan: hanya ambil laporan yang ID atau NIP anggotanya cocok dengan anggota departemen
    const filteredItems = (rawData.data || []).filter((item) => {
      const itemNip = (item.nip || "").trim().toLowerCase()
      const itemNama = (item.nama_pegawai || "").trim().toLowerCase()

      // 1. Cocokkan berdasarkan NIP / NIG
      if (itemNip && (allowedNips.has(itemNip) || allowedIds.has(itemNip))) {
        return true
      }

      // 2. Fallback pencocokan nama pegawai jika NIP kosong pada rekaman tertentu
      if (itemNama && allowedNames.has(itemNama)) {
        return true
      }

      return false
    })

    initialData = {
      ...rawData,
      total: filteredItems.length,
      total_pages: Math.ceil(filteredItems.length / (rawData.limit || 50)),
      data: filteredItems,
    }
  } else {
    // 2. Role Super Admin & Admin: Melihat seluruh laporan kerja dari 14 departemen
    initialData = await getLaporanKerjaServer({ limit: 100 })
  }

  return (
    <LaporanKerjaClient
      initialData={initialData}
      userRole={currentUser.role}
      departmentName={currentUser.department?.nama || null}
      departmentMembers={departmentMembers}
    />
  )
}
