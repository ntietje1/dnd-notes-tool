"use client";

import { useCallback, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Folder, Note, FolderNode } from "@/convex/types";
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
import { FolderPlus, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sortFoldersAndNotes, SortOptions } from "./sidebar-sort";

import { DroppableRoot } from "./sidebar-root/droppable-root";
import { RecursiveFolder } from "./sidebar-folder/recursive-folder";
import { DraggableNote } from "./sidebar-note/draggable-note";
import { NoteButton } from "./sidebar-note/note-button";
import { useNotes } from "@/contexts/NotesContext";
import { FolderButton } from "./sidebar-folder/folder-button";
import { SidebarItem } from "./sidebar-item";

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
    currentNoteId,
    expandedFolders,
    selectNote,
    createNote,
    createFolder,
    deleteNote,
    deleteFolder,
    moveNote,
    moveFolder,
    updateFolderName,
    updateNoteTitle,
    toggleFolder,
    openFolder,
  } = useNotes();

  const folderTree = useQuery(api.notes.getFolderTree);
  const rootNotes = useQuery(api.notes.getUserNotes, {});

  // Add sorting options state
  const [sortOptions] = useState<SortOptions>({
    order: "alphabetical",
    direction: "asc",
  });

  const [renamingId, setRenamingId] = useState<
    Id<"folders"> | Id<"notes"> | null
  >(null);
  const [activeDragNote, setActiveDragNote] = useState<Note | null>(null);
  const [activeDragFolder, setActiveDragFolder] = useState<FolderNode | null>(
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
      updateNoteTitle(id, name);
      setRenamingId(null);
    },
    [updateNoteTitle],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const draggedNote = rootNotes?.find((n) => n._id === active.id);
      if (draggedNote) {
        setActiveDragNote(draggedNote);
      }
      const findFolder = (folders: FolderNode[]): FolderNode | undefined => {
        for (const folder of folders) {
          if (folder._id === active.id) return folder;
          const found = findFolder(folder.childFolders);
          if (found) return found;
        }
        return undefined;
      };
      const draggedFolder = folderTree && findFolder(folderTree);
      if (draggedFolder) {
        setActiveDragFolder(draggedFolder);
      }
    },
    [rootNotes, folderTree],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragNote(null);
      setActiveDragFolder(null);

      if (!active.data.current || !over) return;

      const draggedItem = active.data.current as DraggableItem;

      // Note dragging
      if (draggedItem.type === "note") {
        const note = rootNotes?.find((n) => n._id === draggedItem.id);
        if (note) {
          let newFolderId: Id<"folders"> | undefined = undefined;

          if (over && over.id !== "root") {
            newFolderId = over.id as Id<"folders">;
            openFolder(newFolderId);
          }

          await moveNote(note._id, newFolderId);
        }
      }

      // Folder dragging
      if (draggedItem.type === "folder") {
        // Prevent dragging a folder onto itself
        if (over.id === draggedItem.id) {
          return;
        }

        let newParentId: Id<"folders"> | undefined = undefined;
        if (over.id !== "root") {
          newParentId = over.id as Id<"folders">;
        }

        await moveFolder(draggedItem.id, newParentId);
      }
    },
    [rootNotes, moveNote, moveFolder, openFolder],
  );

  if (!folderTree || !rootNotes) {
    return (
      <div className="h-full border-r p-4">
        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-6 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const selectedNoteId: Id<"notes"> | null = currentNoteId ?? null;

  // Sort folders and notes together
  const { sortedItems } = sortFoldersAndNotes(
    folderTree,
    rootNotes.filter((note) => !note.folderId),
    sortOptions,
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full border-r bg-background flex flex-col min-h-0">
        <div className="pl-4 p-2 h-12 flex justify-between flex-shrink-0 bg-background z-10 border-b">
          <h2 className="text-lg font-semibold justify-start pr-4">Files</h2>
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={createFolder}>
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Folder</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => createNote()}
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Page</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex-1 min-h-0 relative">
          <DroppableRoot
            className="absolute inset-0 p-1 transition-colors overflow-y-auto"
            onNewPage={createNote}
          >
            {sortedItems.map((item) => {
              return (
                <SidebarItem
                  key={item._id}
                  item={item as FolderNode | Note}
                  sortOptions={sortOptions}
                  expandedFolders={expandedFolders}
                  renamingId={renamingId}
                  selectedNoteId={selectedNoteId}
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
        {activeDragNote && (
          <NoteButton
            note={activeDragNote}
            isRenaming={false}
            isSelected={false}
            onNoteSelected={() => {}}
            onStartRename={() => {}}
            onFinishRename={() => {}}
            onDelete={() => {}}
          />
        )}
        {activeDragFolder && (
          <FolderButton
            folder={activeDragFolder}
            isExpanded={false}
            isRenaming={false}
            hasItems={false}
            onToggle={() => {}}
            onStartRename={() => {}}
            onFinishRename={() => {}}
            onDelete={() => {}}
            onNewPage={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
