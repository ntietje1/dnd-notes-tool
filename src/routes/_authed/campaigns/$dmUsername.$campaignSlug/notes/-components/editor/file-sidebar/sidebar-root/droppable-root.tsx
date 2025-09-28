import { useDroppable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import { RootContextMenu } from "./root-context-menu";
import { SIDEBAR_ITEM_TYPES } from "convex/notes/types";

interface DroppableRootProps {
  children: React.ReactNode;
  className?: string;
}

export function DroppableRoot({
  children,
  className,
}: DroppableRootProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
    data: {
      accepts: [SIDEBAR_ITEM_TYPES.folders, SIDEBAR_ITEM_TYPES.notes],
      id: "root",
    },
  });
  

  return (
    <div ref={setNodeRef} className={cn(className, isOver && "bg-muted")}>
      <RootContextMenu className="flex flex-col flex-1 bg-purple">
        {children}
      </RootContextMenu>
    </div>
  );
}
