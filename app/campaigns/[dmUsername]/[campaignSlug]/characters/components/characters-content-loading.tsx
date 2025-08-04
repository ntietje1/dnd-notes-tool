import { CardGridSkeleton } from "@/components/ui/content-grid-page/card-grid-skeleton";


export function CharactersContentLoading() {
  return (
    <CardGridSkeleton
      count={6}
      showCreateCard={true}
      cardHeight="h-[180px]"
    />
  );
} 