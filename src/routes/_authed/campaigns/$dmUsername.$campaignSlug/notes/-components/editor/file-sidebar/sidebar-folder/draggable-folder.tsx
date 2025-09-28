import { useDraggable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import type { Folder } from "convex/notes/types";

interface DraggableFolderProps {
  folder: Folder;
  children: React.ReactNode;
}

export function DraggableFolder({ folder, children }: DraggableFolderProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: folder._id,
    data: folder,
  });

  return (
    <div
      className={cn("flex w-full min-w-0", isDragging && "opacity-50")}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
