import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  FolderOpenDot as FolderOpenDotIcon,
  FolderDot as FolderDotIcon,
  FolderEdit as FolderEditIcon,
} from "~/lib/icons";
import { Button } from "~/components/shadcn/ui/button";
import { FolderName } from "./folder-name";
import { FolderContextMenu } from "./folder-context-menu";
import type { Folder } from "convex/notes/types";
import { DraggableFolder } from "./draggable-folder";
import { useFolderState } from "~/hooks/useFolderState";
import { useSidebarItems } from "~/hooks/useSidebarItems";
import { useFileSidebar } from "~/contexts/FileSidebarContext";

interface FolderButtonProps {
  folder: Folder;
}

export function FolderButton({
  folder,
}: FolderButtonProps) {
  const { isExpanded, toggleExpanded } = useFolderState(folder._id)
  const { renamingId } = useFileSidebar();
  const children = useSidebarItems(folder._id);
  const hasChildren = (children.data && children.data.length > 0) || false;
  
  return (
    <DraggableFolder folder={folder}>
      <FolderContextMenu folder={folder}>
        <Button
          variant="ghost"
          className="w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-1 min-w-0 w-full">
            <div className="flex items-center h-4 w-3 shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-2 w-2 pl-1 pr-0.5" />
              ) : (
                <ChevronRight className="h-2 w-2 pl-1 pr-0.5" />
              )}
            </div>
            {renamingId === folder._id ? (
              <FolderEditIcon className="h-4 w-4 shrink-0" />
            ) : isExpanded ? (
              hasChildren ? (
                <FolderOpenDotIcon className="h-4 w-4 shrink-0" />
              ) : (
                <FolderOpenIcon className="h-4 w-4 shrink-0" />
              )
            ) : hasChildren ? (
              <FolderDotIcon className="h-4 w-4 shrink-0" />
            ) : (
              <FolderIcon className="h-4 w-4 shrink-0" />
            )}
            <FolderName folder={folder}/>
          </div>
        </Button>
      </FolderContextMenu>
    </DraggableFolder>
  );
}
