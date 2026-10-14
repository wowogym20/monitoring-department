import { Skeleton } from "@/components/ui/skeleton"

export default function RekapDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-md" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-6 w-40 rounded" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-7 w-12 rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
