"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { FolderNode } from "@/convex/notes/types";

interface DraggableFolderProps {
  folder: FolderNode;
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
