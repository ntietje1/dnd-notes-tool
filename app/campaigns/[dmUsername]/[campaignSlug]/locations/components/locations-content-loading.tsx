import { CardGridSkeleton } from "@/components/ui/content-grid-page/card-grid-skeleton";

export function LocationsContentLoading() {
  return (
    <CardGridSkeleton 
      count={6} 
      showCreateCard={true}
      cardHeight="h-[180px]"
    />
  );
} 