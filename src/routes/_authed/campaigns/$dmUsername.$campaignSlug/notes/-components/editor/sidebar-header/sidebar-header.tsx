import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/shadcn/ui/tooltip";
import { SortMenu } from "./sort-menu";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { useNotes } from "~/contexts/NotesContext";

export function SidebarHeader() {
  const { status } = useNotes();

  if (status === "pending") {
    return <HeaderLoading />;
  }

  return (
    <div className="flex items-center justify-between px-2 pl-4 h-12 border-b bg-background">
      <h2 className="text-lg font-semibold">Files</h2>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <SortMenu />
          </TooltipTrigger>
          <TooltipContent>Sort by</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function HeaderLoading() {
  return (
    <div className="flex items-center justify-between border-b p-2 h-12">
      <div className="flex items-center justify-between w-full">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  );
}