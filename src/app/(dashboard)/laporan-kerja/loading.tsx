import { Skeleton } from "@/components/ui/skeleton"

export default function LaporanKerjaLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-7 w-12 rounded" />
            </div>
            <Skeleton className="size-10 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Filter / Action Bar Skeleton */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Skeleton className="h-9 flex-1 rounded-md w-full" />
          <Skeleton className="h-9 w-48 rounded-md shrink-0" />
        </div>
      </div>

      {/* Table Content Skeleton Card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
