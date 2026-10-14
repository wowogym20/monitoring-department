import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data dashboard">
      {/* Header Banner Skeleton */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Period Selector Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-5 w-28 rounded-md" />
      </div>

      {/* KPI Cards Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border shadow-xs pt-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-8 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center">
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center">
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Attention List Skeleton */}
      <Card className="border-border shadow-xs">
        <CardHeader className="space-y-2 pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
