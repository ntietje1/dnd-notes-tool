"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableRootProps {
  children: React.ReactNode;
}

export function DroppableRoot({ children }: DroppableRootProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors p-2 space-y-1 min-w-0 w-full",
        isOver && "bg-muted",
      )}
    >
      {children}
    </div>
  );
}
