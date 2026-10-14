import { Skeleton } from "@/components/ui/skeleton"

export default function EksporLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-52 rounded" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </div>
    </div>
  )
}
