import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilLoading() {
  return (
    <div className="max-w-4xl space-y-4 sm:space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-6 w-44 rounded-md" />
        <Skeleton className="h-3.5 w-64 rounded-md" />
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
        <Skeleton className="size-20 sm:size-22 rounded-full shrink-0" />
        <div className="space-y-2 flex-1 w-full sm:w-auto">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>
      </div>
    </div>
  )
}
