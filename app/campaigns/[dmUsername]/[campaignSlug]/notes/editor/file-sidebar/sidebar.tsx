"use client";

import { useCallback, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { AnySidebarItem } from "@/convex/notes/types";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { DroppableRoot } from "./sidebar-root/droppable-root";
import { useNotes } from "@/contexts/NotesContext";
import { SidebarItem } from "./sidebar-item/sidebar-item";

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

      console.log("draggedItem", draggedItem);

      // Note dragging
      if (draggedItem.type === "note") {
        console.log("dragging note");
        const note = findNoteRecursively(draggedItem.id);
        console.log("note", note);

        if (note) {
          let parentFolderId: Id<"folders"> | undefined = undefined;

          if (over && over.id !== "root") {
            parentFolderId = over.id as Id<"folders">;
            openFolder(parentFolderId);
          }

          console.log("parentFolderId", parentFolderId);
          await moveNote(note._id, parentFolderId);
        }
      }

      // Folder dragging
      if (draggedItem.type === "folder") {
        console.log("dragging folder");

        // Prevent dragging a folder onto itself
        if (over.id === draggedItem.id) {
          console.log("Cannot drag folder onto itself");
          return;
        }

        // Prevent dragging a folder onto its descendants
        if (over.id !== "root") {
          const targetFolderId = over.id as Id<"folders">;
          if (isFolderDescendant(draggedItem.id, targetFolderId)) {
            console.log("Cannot drag folder onto its descendant");
            return;
          }
        }

        let parentId: Id<"folders"> | undefined = undefined;
        if (over.id !== "root") {
          parentId = over.id as Id<"folders">;
        }

        console.log("Moving folder", draggedItem.id, "to parent", parentId);
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

  return (
    //TODO: add hotkeys
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full bg-background flex flex-col min-h-0">
        <div className="flex-1 min-h-0 relative">
          <DroppableRoot
            className="absolute inset-0 p-1 transition-colors overflow-y-auto"
            onNewPage={createNote}
          >
            {sidebarData?.map((item) => {
              return (
                <SidebarItem
                  key={item._id}
                  item={item}
                  renamingId={renamingId}
                  setRenamingId={setRenamingId}
                />
              );
            })}
          </DroppableRoot>
        </div>
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
