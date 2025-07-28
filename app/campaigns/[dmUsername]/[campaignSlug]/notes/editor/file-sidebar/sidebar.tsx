"use client";

import { useCallback, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Note, FolderNode, AnySidebarItem } from "@/convex/notes/types";
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
    currentNote,
    expandedFolders,
    selectNote,
    createNote,
    deleteNote,
    deleteFolder,
    moveNote,
    moveFolder,
    updateFolderName,
    updateNoteName,
    toggleFolder,
    openFolder,
    sidebarData,
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

  const handleFinishFolderRename = useCallback(
    (id: Id<"folders">, name: string) => {
      updateFolderName(id, name);
      setRenamingId(null);
    },
    [updateFolderName],
  );

  const handleFinishNoteRename = useCallback(
    (id: Id<"notes">, name: string) => {
      updateNoteName(id, name);
      setRenamingId(null);
    },
    [updateNoteName],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;

      const findNote = (items: AnySidebarItem[]): Note | undefined => {
        for (const item of items) {
          if (item.type === "notes" && item._id === active.id) {
            return item;
          }
          if (item.type === "folders") {
            const found = findNote(item.children);
            if (found) return found;
          }
        }
        return undefined;
      };

      const findFolder = (items: AnySidebarItem[]): FolderNode | undefined => {
        for (const item of items) {
          if (item.type === "folders") {
            if (item._id === active.id) return item;
            const found = findFolder(item.children);
            if (found) return found;
          }
        }
        return undefined;
      };

      if (!sidebarData) return;

      const draggedNote = findNote(sidebarData);
      if (draggedNote) {
        setActiveDragItem(draggedNote);
      }

      const draggedFolder = findFolder(sidebarData);
      if (draggedFolder) {
        setActiveDragItem(draggedFolder);
      }
    },
    [sidebarData],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragItem(null);

      if (!active.data.current || !over) return;

      const draggedItem = active.data.current as DraggableItem;

      // Note dragging
      if (draggedItem.type === "note") {
        const note = sidebarData?.find(
          (item): item is Note =>
            item.type === "notes" && item._id === draggedItem.id,
        );
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

        let parentId: Id<"folders"> | undefined = undefined;
        if (over.id !== "root") {
          parentId = over.id as Id<"folders">;
        }

        await moveFolder(draggedItem.id, parentId);
      }
    },
    [sidebarData, moveNote, moveFolder, openFolder],
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
                  expandedFolders={expandedFolders}
                  renamingId={renamingId}
                  selectedNoteId={currentNote?._id ?? null}
                  toggleFolder={toggleFolder}
                  setRenamingId={setRenamingId}
                  handleFinishFolderRename={handleFinishFolderRename}
                  handleFinishNoteRename={handleFinishNoteRename}
                  deleteFolder={deleteFolder}
                  deleteNote={deleteNote}
                  selectNote={selectNote}
                  createNote={createNote}
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
            expandedFolders={new Set()}
            renamingId={null}
            selectedNoteId={null}
            toggleFolder={() => {}}
            setRenamingId={() => {}}
            handleFinishFolderRename={() => {}}
            handleFinishNoteRename={() => {}}
            deleteFolder={() => {}}
            deleteNote={() => {}}
            selectNote={() => {}}
            createNote={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
