import { Skeleton } from "../../components/ui/skeleton";

export function FileTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border bg-background"
      aria-label="Loading documents"
    >
      <span className="sr-only">Loading documents...</span>
      <div className="grid grid-cols-[minmax(0,1fr)_9rem_8rem_5rem_3rem] gap-4 border-b bg-muted/50 px-4 py-3">
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
        <Skeleton className="h-3" />
      </div>
      <div className="flex flex-col">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1fr)_9rem_8rem_5rem_3rem] items-center gap-4 border-b px-4 py-3 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-9" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="size-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
