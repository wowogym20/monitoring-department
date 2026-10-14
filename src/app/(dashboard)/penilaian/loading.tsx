import { Skeleton } from "@/components/ui/skeleton"

export default function PenilaianLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-56 rounded" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
