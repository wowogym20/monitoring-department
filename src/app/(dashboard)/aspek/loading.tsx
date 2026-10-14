import { Skeleton } from "@/components/ui/skeleton"

export default function AspekLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-52 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
