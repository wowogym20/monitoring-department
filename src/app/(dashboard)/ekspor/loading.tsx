import { Skeleton } from "@/components/ui/skeleton"

export default function EksporLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-3.5 w-72 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>
        <div className="lg:col-span-5 rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-20 rounded-md" />
          <Skeleton className="h-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}
