import { Skeleton } from "@/components/ui/skeleton"

export default function AnggotaLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-full sm:w-32 rounded-md" />
            <Skeleton className="h-9 w-full sm:w-28 rounded-md" />
          </div>
          <Skeleton className="h-9 w-full sm:w-36 rounded-md" />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Skeleton className="h-9 flex-1 rounded-md w-full" />
          <Skeleton className="h-9 w-40 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
