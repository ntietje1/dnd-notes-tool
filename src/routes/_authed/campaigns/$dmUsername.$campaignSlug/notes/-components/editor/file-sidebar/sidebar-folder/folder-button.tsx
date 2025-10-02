import type { Folder } from "convex/notes/types";
import { DraggableFolder } from "./draggable-folder";
import { useFolderState } from "~/hooks/useFolderState";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { toast } from "sonner";
import { FolderContextMenu } from "./folder-context-menu";
import { FolderButtonBase } from "./folder-button-base";
import { useRef } from "react";
import type { ContextMenuRef } from "~/components/context-menu/context-menu";

interface FolderButtonProps {
  folder: Folder;
}

export function FolderButton({
  folder,
}: FolderButtonProps) {
  const { isExpanded, toggleExpanded } = useFolderState(folder._id)
  const { renamingId } = useFileSidebar();
  const contextMenuRef = useRef<ContextMenuRef>(null);
  
  const handleFolderClick = () => {
    toast.info("Folder clicked - functionality coming soon!");
  };

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    contextMenuRef.current?.open({ x: e.clientX + 4, y: e.clientY + 4 });
  };
  
  return (
    <FolderContextMenu ref={contextMenuRef} folder={folder}>
      <DraggableFolder folder={folder}>
        <FolderButtonBase
          folder={folder}
          handleToggleExpanded={toggleExpanded}
          handleSelect={handleFolderClick}
          handleMoreOptions={handleMoreOptions}
          isExpanded={isExpanded}
          isSelected={false}
          isRenaming={renamingId === folder._id}
        />
      </DraggableFolder>
    </FolderContextMenu>
  );
}
