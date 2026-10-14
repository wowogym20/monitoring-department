import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-6">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </div>
    </div>
  )
}
