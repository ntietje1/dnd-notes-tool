import { useDroppable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import { RootContextMenu } from "./root-context-menu";

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
      accepts: ["folders", "notes"],
      id: "root",
    },
  });
  

  return (
    <div ref={setNodeRef} className={cn(className, isOver && "bg-muted")}>
      <RootContextMenu className="h-full flex-1">
        {children}
      </RootContextMenu>
    </div>
  );
}
