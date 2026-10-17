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
        <Skeleton className="h-7 w-32 rounded-full shrink-0" />
      </div>

      {/* Filter / Action Bar Skeleton */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Skeleton className="h-9 flex-1 rounded-md w-full" />
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Content Skeleton Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-20 w-full rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
