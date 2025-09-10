import { useCallback, useState } from "react";
import type { Id } from "convex/_generated/dataModel";
import type { AnySidebarItem } from "convex/notes/types";
import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { DroppableRoot } from "./sidebar-root/droppable-root";
import { useNotes } from "~/contexts/NotesContext";
import { SidebarItem } from "./sidebar-item/sidebar-item";
import { SystemFolders } from "./sidebar-system-folder/system-folders";
import { Skeleton } from "~/components/shadcn/ui/skeleton";

type DraggableItem =
  | {
      id: Id<"notes">;
      type: "note";
    }
  | {
      id: Id<"folders">;
      type: "folder";
    };

export function FileSidebar() {
  const {
    openFolder,
    moveNote,
    moveFolder,
    createNote,
    createFolder,
    sidebarData,
    findNoteRecursively,
    findFolderRecursively,
    isFolderDescendant,
  } = useNotes();

  const [renamingId, setRenamingId] = useState<
    Id<"folders"> | Id<"notes"> | null
  >(null);
  const [activeDragItem, setActiveDragItem] = useState<AnySidebarItem | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const handleNewPage = useCallback(
    async (parentFolderId?: Id<"folders">) => {
      const noteId = await createNote(parentFolderId);
      if (noteId) {
        setRenamingId(noteId);
      }
    },
    [createNote],
  );

  const handleNewFolder = useCallback(
    async (parentFolderId?: Id<"folders">) => {
    const folderId = await createFolder(parentFolderId);
    if (folderId) {
      setRenamingId(folderId);
    }
  }, [createFolder]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;

      if (!sidebarData) return;

      // Try to find the dragged item
      const draggedNote = findNoteRecursively(active.id as Id<"notes">);
      if (draggedNote) {
        setActiveDragItem(draggedNote);
        return;
      }

      const draggedFolder = findFolderRecursively(active.id as Id<"folders">);
      if (draggedFolder) {
        setActiveDragItem(draggedFolder);
      }
    },
    [sidebarData, findNoteRecursively, findFolderRecursively],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragItem(null);

      if (!active.data.current || !over) return;

      const draggedItem = active.data.current as DraggableItem;

      // Note dragging
      if (draggedItem.type === "note") {
        const note = findNoteRecursively(draggedItem.id);

        if (note) {
          let parentFolderId: Id<"folders"> | undefined = undefined;

          if (over && over.id !== "root") {
            parentFolderId = over.id as Id<"folders">;
            openFolder(parentFolderId);
          }

          await moveNote(note._id, parentFolderId);
        }
      }

      // Folder dragging
      if (draggedItem.type === "folder") {
        // Prevent dragging a folder onto itself
        if (over.id === draggedItem.id) {
          return;
        }

        // Prevent dragging a folder onto its descendants
        if (over.id !== "root") {
          const targetFolderId = over.id as Id<"folders">;
          if (isFolderDescendant(draggedItem.id, targetFolderId)) {
            // Prevent dragging a folder into its own descendants
            return;
          }
        }

        let parentId: Id<"folders"> | undefined = undefined;
        if (over.id !== "root") {
          parentId = over.id as Id<"folders">;
        }

        await moveFolder(draggedItem.id, parentId);
      }
    },
    [
      findNoteRecursively,
      findFolderRecursively,
      isFolderDescendant,
      moveNote,
      moveFolder,
      openFolder,
    ],
  );

  if (!sidebarData) {
    return <SidebarLoading />;
  }

  return (
    //TODO: add hotkeys
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full bg-background flex flex-1 flex-col min-h-0 min-w-0">
        <DroppableRoot
          className="flex-1 p-1 transition-colors overflow-y-auto"
          onNewPage={handleNewPage}
          onNewFolder={handleNewFolder}
        >
            <SystemFolders
              renamingId={renamingId}
              setRenamingId={setRenamingId}
            />

            <div className="my-2 border-t border-muted-foreground/20" />

            {sidebarData?.map((item) => (
              <SidebarItem
                key={item._id}
                item={item}
                renamingId={renamingId}
                setRenamingId={setRenamingId}
              />
            ))}
          </DroppableRoot>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDragItem && (
          <SidebarItem
            item={activeDragItem}
            renamingId={null}
            setRenamingId={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
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
