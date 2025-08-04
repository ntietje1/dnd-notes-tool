import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export function CharactersHeaderLoading() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-6 h-6 text-slate-600" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-4 w-96" />
    </div>
  );
} 