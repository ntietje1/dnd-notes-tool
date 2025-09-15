
import { DroppableRoot } from "./sidebar-root/droppable-root";
import { SidebarItem } from "./sidebar-item/sidebar-item";
import { SystemFolders } from "./sidebar-system-folder/system-folders";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { useSidebarItems } from "~/hooks/useSidebarItems";
import { FileSidebarProvider, useFileSidebar } from "~/contexts/FileSidebarContext";
import { DragOverlay } from "@dnd-kit/core";
import { ClientOnly } from "@tanstack/react-router";


function FileSidebarContent() {
  const sidebarItems = useSidebarItems();
  const { activeDragItem } = useFileSidebar();

  if (sidebarItems.status === "pending") {
    return <SidebarLoading />;
  }

  return (
    <div className="h-full bg-background flex flex-1 flex-col min-h-0 min-w-0">
      <DroppableRoot className="flex-1 p-1 transition-colors overflow-y-auto">
        <SystemFolders />

        <div className="my-2 border-t border-muted-foreground/20" />

        {sidebarItems.data?.map((item) => (
          <SidebarItem key={item._id} item={item} />
        ))}
      </DroppableRoot>
      
      <DragOverlay dropAnimation={null}>
        {activeDragItem && (
          <SidebarItem item={activeDragItem} />
        )}
      </DragOverlay>
    </div>
  );
}

export function FileSidebar() {
  return (
    <ClientOnly fallback={<SidebarLoading />}>
      <FileSidebarContent />
    </ClientOnly>
  );
}

function SidebarLoading() {
  return (
    <div className="flex-1 p-2">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
