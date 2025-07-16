"use client";

import { useDraggable } from "@dnd-kit/core";
import { Folder } from "@/convex/notes/types";
import { cn } from "@/lib/utils";

interface DraggableFolderProps {
  folder: Folder;
  children: React.ReactNode;
}

export function DraggableFolder({ folder, children }: DraggableFolderProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: folder._id,
    data: {
      type: "folder",
      id: folder._id,
    },
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
