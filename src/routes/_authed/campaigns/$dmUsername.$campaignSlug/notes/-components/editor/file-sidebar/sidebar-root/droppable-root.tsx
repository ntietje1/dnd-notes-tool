import { useDroppable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";
import { RootContextMenu } from "./root-context-menu";

interface DroppableRootProps {
  children: React.ReactNode;
  className?: string;
  onNewPage: () => void;
  onNewFolder: () => void;
}

export function DroppableRoot({
  children,
  className,
  onNewPage,
  onNewFolder,
}: DroppableRootProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
    data: {
      accepts: ["folder", "note"],
      id: "root",
    },
  });

  return (
    <div ref={setNodeRef} className={cn(className, isOver && "bg-muted")}>
      <RootContextMenu className="h-full" onNewPage={onNewPage} onNewFolder={onNewFolder}>
        {children}
      </RootContextMenu>
    </div>
  );
}
