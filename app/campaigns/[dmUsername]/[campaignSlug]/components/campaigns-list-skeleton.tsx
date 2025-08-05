import { CardGridSkeleton } from "@/components/ui/content-grid-page/card-grid-skeleton";

export function CampaignsListSkeleton() {
  return (
    <CardGridSkeleton
      count={4}
      showCreateCard={true}
      cardHeight="h-64"
    />
  );
} 