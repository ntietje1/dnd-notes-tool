import { useDroppable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import { SIDEBAR_ITEM_TYPES, type Folder } from "convex/notes/types";

interface DroppableFolderProps {
  folder: Folder;
  children: React.ReactNode;
}

export function DroppableFolder({ folder, children }: DroppableFolderProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: folder._id,
    data: {
      accepts: [SIDEBAR_ITEM_TYPES.folders, SIDEBAR_ITEM_TYPES.notes],
      id: folder._id,
    },
  });

  const canDrop =
    active?.data.current?.type === SIDEBAR_ITEM_TYPES.folders ||
    active?.data.current?.type === SIDEBAR_ITEM_TYPES.notes;
  const isValidDrop = isOver && canDrop;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors min-w-0 w-full",
        isValidDrop ? "bg-muted" : "bg-background",
      )}
    >
      {children}
    </div>
  );
}
