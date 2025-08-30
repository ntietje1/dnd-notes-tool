import { useDraggable } from "@dnd-kit/core";
import { cn } from "~/lib/utils";

interface DraggableSystemFolderProps {
  id: string;
  children: React.ReactNode;
}

export function DraggableSystemFolder({
  id,
  children,
}: DraggableSystemFolderProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: {
      type: "system-folder",
      id: id,
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
