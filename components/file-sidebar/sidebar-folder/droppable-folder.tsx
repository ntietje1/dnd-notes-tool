"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableFolderProps {
  folder: any;
  children: React.ReactNode;
}

export function DroppableFolder({ folder, children }: DroppableFolderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: folder._id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("transition-colors min-w-0 w-full", isOver && "bg-muted")}
    >
      {children}
    </div>
  );
}
