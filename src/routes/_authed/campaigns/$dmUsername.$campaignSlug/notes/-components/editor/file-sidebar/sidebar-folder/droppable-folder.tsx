import { useDroppable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import type { Folder } from "convex/notes/types";

interface DroppableFolderProps {
  folder: Folder;
  children: React.ReactNode;
}

export function DroppableFolder({ folder, children }: DroppableFolderProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: folder._id,
    data: {
      accepts: ["folders", "notes"],
      id: folder._id,
    },
  });

  const canDrop =
    active?.data.current?.type === "folders" ||
    active?.data.current?.type === "notes";
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
