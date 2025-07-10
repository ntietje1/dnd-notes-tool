"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableRootProps {
  children: React.ReactNode;
  className?: string;
}

export function DroppableRoot({ children, className }: DroppableRootProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
  });

  return (
    <div ref={setNodeRef} className={cn(className, isOver && "bg-muted")}>
      {children}
    </div>
  );
}
