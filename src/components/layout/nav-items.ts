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
  type LucideIcon,
} from "lucide-react"
import { UserRole } from "@/types/database"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  badge?: string
}

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "user"],
  },
  {
    title: "Data Anggota",
    href: "/anggota",
    icon: Users,
    roles: ["super_admin", "admin", "user"],
  },
  {
    title: "Penilaian",
    href: "/penilaian",
    icon: ClipboardCheck,
    roles: ["super_admin", "admin", "user"],
  },
  {
    title: "Rekap Penilaian",
    href: "/rekap",
    icon: BarChart3,
    roles: ["super_admin", "admin", "user"],
  },
  {
    title: "Departemen",
    href: "/departemen",
    icon: Building2,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Akun Ketua",
    href: "/ketua",
    icon: UserCog,
    roles: ["super_admin"],
  },
  {
    title: "Periode",
    href: "/periode",
    icon: CalendarDays,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Aspek Penilaian",
    href: "/aspek",
    icon: ListOrdered,
    roles: ["super_admin"],
  },
  {
    title: "Ekspor Laporan",
    href: "/ekspor",
    icon: FileSpreadsheet,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Profil Saya",
    href: "/profil",
    icon: User,
    roles: ["super_admin", "admin", "user"],
  },
]
