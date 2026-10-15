import { Skeleton } from "@/components/ui/skeleton"

export default function DepartemenLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-52 rounded" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Skeleton Kartu Statistik Responsif (4 Kartu) */}
      <div className="space-y-3">
        <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2.5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-56 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 sm:p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="size-7 sm:size-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-12 rounded" />
              <Skeleton className="h-2.5 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Skeleton className="h-9 max-w-sm flex-1 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
