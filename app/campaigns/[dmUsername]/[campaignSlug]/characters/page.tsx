import { Suspense } from "react";
import { CharactersContentWrapper } from "./components/characters-content-wrapper";
import { CharactersHeaderWrapper } from "./components/characters-header-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

function CharactersPageLoading() {
  return (
    <div className="h-full p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-slate-600" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function CharactersPage() {
  return (
    <div className="h-full p-6">
      <Suspense fallback={<CharactersPageLoading />}>
        <CharactersHeaderWrapper />
        <CharactersContentWrapper />
      </Suspense>
    </div>
  );
}