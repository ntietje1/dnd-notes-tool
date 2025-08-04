import { Skeleton } from "@/components/ui/skeleton";

export function LocationsHeaderLoading() {
  return (
    <div className="mb-8">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
  );
} 