import { Skeleton } from "@/components/ui/skeleton"

export default function FormPenilaianLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-md" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-3 w-3/4 rounded" />
          <div className="grid grid-cols-5 gap-2 pt-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
