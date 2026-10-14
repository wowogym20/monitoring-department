import { Skeleton } from "@/components/ui/skeleton"

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <Skeleton className="h-6 w-3/4 mx-auto rounded-md" />
        <Skeleton className="h-4 w-1/2 mx-auto rounded-md" />
        <p className="text-xs text-muted-foreground mt-4 animate-pulse">
          Memuat data aplikasi...
        </p>
      </div>
    </div>
  )
}
