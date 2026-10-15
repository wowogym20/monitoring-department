import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
  Building2,
  UserCog,
  CalendarDays,
  ListOrdered,
  FileSpreadsheet,
  User,
  BookOpen,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import { UserRole } from "@/types/database"

export type NavSection = "main" | "admin"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  section: NavSection
  unreadCount?: number
}

export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  main: "Main",
  admin: "Menu Admin",
}

export const navigationItems: NavItem[] = [
  // --- MENU MAIN (Operasional & Monitoring) ---
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "user"],
    section: "main",
  },
  {
    title: "Data Anggota",
    href: "/anggota",
    icon: Users,
    roles: ["super_admin", "admin", "user"],
    section: "main",
  },
  {
    title: "Penilaian",
    href: "/penilaian",
    icon: ClipboardCheck,
    roles: ["super_admin", "admin", "user"],
    section: "main",
    unreadCount: 0, // Slot badge counter komentar baru (PRD 10.1.D)
  },
  {
    title: "Rekap Penilaian",
    href: "/rekap",
    icon: BarChart3,
    roles: ["super_admin", "admin", "user"],
    section: "main",
  },
  {
    title: "Departemen",
    href: "/departemen",
    icon: Building2,
    roles: ["super_admin", "admin"],
    section: "main",
  },
  {
    title: "Periode",
    href: "/periode",
    icon: CalendarDays,
    roles: ["super_admin", "admin"],
    section: "main",
  },
  {
    title: "Aspek Penilaian",
    href: "/aspek",
    icon: ListOrdered,
    roles: ["super_admin", "admin"],
    section: "main",
  },
  {
    title: "Ekspor Laporan",
    href: "/ekspor",
    icon: FileSpreadsheet,
    roles: ["super_admin", "admin"],
    section: "main",
  },
  {
    title: "Profil Saya",
    href: "/profil",
    icon: User,
    roles: ["super_admin", "admin", "user"],
    section: "main",
  },

  // --- MENU ADMIN (Khusus Super Admin) ---
  {
    title: "Manajemen Pengguna",
    href: "/pengguna",
    icon: UsersRound,
    roles: ["super_admin"],
    section: "admin",
  },
  {
    title: "Kepala Departemen",
    href: "/ketua",
    icon: UserCog,
    roles: ["super_admin"],
    section: "admin",
  },
  {
    title: "Buku & Panduan",
    href: "/panduan",
    icon: BookOpen,
    roles: ["super_admin"],
    section: "admin",
  },
  {
    title: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
    roles: ["super_admin"],
    section: "admin",
  },
]
