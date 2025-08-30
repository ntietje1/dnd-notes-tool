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
import type { FolderNode } from "convex/notes/types";
import { DraggableFolder } from "./draggable-folder";

interface FolderButtonProps {
  folder: FolderNode;
  isExpanded: boolean;
  isRenaming: boolean;
  hasItems: boolean;
  onToggleExpanded: () => void;
  onStartRename: () => void;
  onFinishRename: (name: string) => void;
  onDelete: () => void;
  onNewPage: () => void;
  onNewFolder: () => void;
}

export function FolderButton({
  folder,
  isExpanded,
  isRenaming,
  hasItems,
  onToggleExpanded,
  onStartRename,
  onFinishRename,
  onDelete,
  onNewPage,
  onNewFolder,
}: FolderButtonProps) {
  return (
    <DraggableFolder folder={folder}>
      <FolderContextMenu
        onRename={onStartRename}
        onDelete={onDelete}
        onNewPage={onNewPage}
        onNewFolder={onNewFolder}
      >
        <Button
          variant="ghost"
          className="w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0"
          onClick={onToggleExpanded}
        >
          <div className="flex items-center gap-1 min-w-0 w-full">
            <div className="flex items-center h-4 w-3 shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-2 w-2 pl-1 pr-0.5" />
              ) : (
                <ChevronRight className="h-2 w-2 pl-1 pr-0.5" />
              )}
            </div>
            {isRenaming ? (
              <FolderEditIcon className="h-4 w-4 shrink-0" />
            ) : isExpanded ? (
              hasItems ? (
                <FolderOpenDotIcon className="h-4 w-4 shrink-0" />
              ) : (
                <FolderOpenIcon className="h-4 w-4 shrink-0" />
              )
            ) : hasItems ? (
              <FolderDotIcon className="h-4 w-4 shrink-0" />
            ) : (
              <FolderIcon className="h-4 w-4 shrink-0" />
            )}
            <FolderName
              folder={folder}
              isRenaming={isRenaming}
              onFinishRename={onFinishRename}
            />
          </div>
        </Button>
      </FolderContextMenu>
    </DraggableFolder>
  );
}
