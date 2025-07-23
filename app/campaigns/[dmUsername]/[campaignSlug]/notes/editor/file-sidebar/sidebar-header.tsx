import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FolderPlus, FilePlus } from "lucide-react";
import { SortMenu } from "./sort-menu";
import { useNotes } from "@/contexts/NotesContext";

export function SidebarHeader() {
  const { createFolder, createNote } = useNotes();
  return (
    <div className="flex items-center justify-between px-4 h-12 border-b bg-background">
      <h2 className="text-lg font-semibold">Files</h2>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <SortMenu />
          </TooltipTrigger>
          <TooltipContent>Sort by</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => createFolder()}>
              <FolderPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Folder</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => createNote()}>
              <FilePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Page</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
