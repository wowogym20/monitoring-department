"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Settings,
  Building2,
  Megaphone,
  Scale,
  Wrench,
  Bell,
  Clock,
  UserCheck,
  ShieldCheck,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AllSystemSettings } from "@/lib/settings/default-settings"
import { GeneralTab } from "./components/general-tab"
import { ContentTab } from "./components/content-tab"
import { ScoringTab } from "./components/scoring-tab"
import { MaintenanceTab } from "./components/maintenance-tab"
import { NotificationsTab } from "./components/notifications-tab"

interface PengaturanClientProps {
  initialSettings: AllSystemSettings
}

export function PengaturanClient({ initialSettings }: PengaturanClientProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<AllSystemSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState("general")

  const handleFullReset = () => {
    router.refresh()
  }

  const formatLastUpdated = (iso?: string) => {
    if (!iso) return "Belum pernah diperbarui"
    try {
      const d = new Date(iso)
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman Pengaturan */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-gradient-to-r from-card via-card to-muted/30 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="size-9 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-600/20 shadow-2xs">
                <Settings className="size-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Pengaturan Sistem
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold text-xs gap-1"
              >
                <ShieldCheck className="size-3" />
                Khusus Super Admin
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Konfigurasi terpusat seluruh parameter sistem: identitas instansi, siaran pengumuman dashboard, ambang batas predikat penilaian, mode pemeliharaan, serta retensi tempat sampah.
            </p>
          </div>

          {/* Info Terakhir Diperbarui */}
          {settings.updatedAt && (
            <div className="text-left sm:text-right shrink-0 p-3 rounded-xl border border-border bg-card shadow-2xs text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground sm:justify-end">
                <Clock className="size-3.5" />
                <span>Terakhir Disimpan:</span>
              </div>
              <p className="font-semibold text-foreground">
                {formatLastUpdated(settings.updatedAt)}
              </p>
              {settings.updatedByName && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground sm:justify-end">
                  <UserCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Oleh: {settings.updatedByName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Tab Navigasi Pengaturan */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-nowrap w-max min-w-full sm:w-auto border border-border">
            <TabsTrigger
              value="general"
              className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            >
              <Building2 className="size-4 shrink-0" />
              <span>Identitas & Branding</span>
            </TabsTrigger>

            <TabsTrigger
              value="content"
              className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            >
              <Megaphone className="size-4 shrink-0" />
              <span>Konten & Pengumuman</span>
              {settings.content.announcement.isActive && (
                <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="scoring"
              className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            >
              <Scale className="size-4 shrink-0" />
              <span>Kebijakan Penilaian</span>
            </TabsTrigger>

            <TabsTrigger
              value="maintenance"
              className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            >
              <Wrench className="size-4 shrink-0" />
              <span>Pemeliharaan & Sistem</span>
              {settings.system.maintenance.isActive && (
                <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20 animate-pulse" />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            >
              <Bell className="size-4 shrink-0" />
              <span>Notifikasi & Pengingat</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Identitas & Branding */}
        <TabsContent value="general" className="mt-0 focus-visible:outline-none">
          <GeneralTab
            initialSettings={settings.general}
            onSettingsSaved={(updated) =>
              setSettings((prev) => ({
                ...prev,
                general: updated,
                updatedAt: new Date().toISOString(),
              }))
            }
          />
        </TabsContent>

        {/* Tab 2: Konten & Pengumuman */}
        <TabsContent value="content" className="mt-0 focus-visible:outline-none">
          <ContentTab
            initialSettings={settings.content}
            onSettingsSaved={(updated) =>
              setSettings((prev) => ({
                ...prev,
                content: updated,
                updatedAt: new Date().toISOString(),
              }))
            }
          />
        </TabsContent>

        {/* Tab 3: Kebijakan Penilaian */}
        <TabsContent value="scoring" className="mt-0 focus-visible:outline-none">
          <ScoringTab
            initialSettings={settings.scoring}
            onSettingsSaved={(updated) =>
              setSettings((prev) => ({
                ...prev,
                scoring: updated,
                updatedAt: new Date().toISOString(),
              }))
            }
          />
        </TabsContent>

        {/* Tab 4: Pemeliharaan & Sistem */}
        <TabsContent value="maintenance" className="mt-0 focus-visible:outline-none">
          <MaintenanceTab
            initialSettings={settings.system}
            onSettingsSaved={(updated) =>
              setSettings((prev) => ({
                ...prev,
                system: updated,
                updatedAt: new Date().toISOString(),
              }))
            }
            onFullReset={handleFullReset}
          />
        </TabsContent>

        {/* Tab 5: Notifikasi & Pengingat */}
        <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
          <NotificationsTab
            initialSettings={settings.notifications}
            onSettingsSaved={(updated) =>
              setSettings((prev) => ({
                ...prev,
                notifications: updated,
                updatedAt: new Date().toISOString(),
              }))
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
