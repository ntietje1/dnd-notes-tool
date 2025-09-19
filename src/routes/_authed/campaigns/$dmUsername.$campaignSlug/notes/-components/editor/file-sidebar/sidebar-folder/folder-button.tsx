import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  FolderEdit as FolderEditIcon,
  MoreHorizontal,
} from "~/lib/icons";
import { Button } from "~/components/shadcn/ui/button";
import { FolderName } from "./folder-name";
import type { Folder } from "convex/notes/types";
import { DraggableFolder } from "./draggable-folder";
import { useFolderState } from "~/hooks/useFolderState";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { toast } from "sonner";
import { HoverToggleButton } from "~/components/hover-toggle-button";
import { FolderContextMenu } from "./folder-context-menu";

interface FolderButtonProps {
  folder: Folder;
}

export function FolderButton({
  folder,
}: FolderButtonProps) {
  const { isExpanded, toggleExpanded } = useFolderState(folder._id)
  const { renamingId } = useFileSidebar();
  
  const handleFolderClick = () => {
    toast.info("Folder clicked - functionality coming soon!");
  };

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("More options - functionality coming soon!");
  };
  
  return (
    <FolderContextMenu folder={folder}>
      <DraggableFolder folder={folder}>
        <div className="group relative flex items-center w-full h-8 px-1 rounded-sm hover:bg-muted/50 transition-colors">
          {/* Folder Icon / Chevron Toggle */}
          <HoverToggleButton
            className="relative h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground"
            nonHoverComponent={
              renamingId === folder._id ? (
                <FolderEditIcon className="h-4 w-4" />
              ) : (
                <FolderIcon className="h-4 w-4" />
              )
            }
            hoverComponent={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 hover:text-foreground hover:bg-muted-foreground/10 rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
              > 
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            }
          />

          {/* Folder Name */}
          <div 
            className="flex items-center min-w-0 flex-1 px-1 py-1 rounded-sm"
            onClick={handleFolderClick}
          >
            <FolderName folder={folder}/>
          </div>

          {/* More Options Button */}
          <HoverToggleButton
            className="relative h-6 w-6 shrink-0 flex items-center justify-center"
            nonHoverComponent={null}
            hoverComponent={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-sm"
                onClick={handleMoreOptions}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </DraggableFolder>
    </FolderContextMenu>
  );
}
