"use client";

import { useCallback, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Note } from "@/convex/types";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DroppableRoot } from "./droppable-root";
import { DroppableFolder } from "./sidebar-folder/droppable-folder";
import { DraggableNote } from "./sidebar-note/draggable-note";
import { NoteButton } from "./sidebar-note/note-button";
import { FolderButton } from "./sidebar-folder/folder-button";
import { useNotes } from "@/contexts/NotesContext";

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
    sidebarData,
    expandedFolders,
    selectNote,
    createNote,
    createFolder,
    deleteNote,
    deleteFolder,
    moveNote,
    updateFolderName,
    updateNoteTitle,
    toggleFolder,
    openFolder,
  } = useNotes();

  const [renamingId, setRenamingId] = useState<
    Id<"folders"> | Id<"notes"> | null
  >(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

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
      const draggedNote = sidebarData?.notes.find((n) => n._id === active.id);
      if (draggedNote) {
        setActiveNote(draggedNote);
      }
    },
    [sidebarData?.notes],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveNote(null);

      if (!active.data.current) return;

      const draggedItem = active.data.current as DraggableItem;

      // Only handle note dragging
      if (draggedItem.type === "note") {
        const note = sidebarData?.notes.find((n) => n._id === draggedItem.id);
        if (note) {
          let newFolderId: Id<"folders"> | undefined = undefined;

          // If dropped on a folder, use that folder's ID
          if (over && over.id !== "root") {
            const targetFolder = sidebarData?.folders.find(
              (f) => f._id === over.id,
            );
            if (targetFolder) {
              newFolderId = targetFolder._id;
              openFolder(targetFolder._id);
            }
          }

          // Move the note to the new folder (or root if no folder)
          await moveNote(note._id, newFolderId);
        }
      }
    },
    [sidebarData, moveNote, openFolder],
  );

  if (!sidebarData) {
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
                <Button variant="ghost" size="icon" onClick={createNote}>
                  <FilePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Page</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex-1 min-h-0 relative">
          <DroppableRoot className="absolute inset-0 p-1 transition-colors overflow-y-auto">
            {/* Folders */}
            {sidebarData.folders.map((folder) => (
              <DroppableFolder key={folder._id} folder={folder}>
                <Collapsible
                  open={expandedFolders.has(folder._id)}
                  onOpenChange={() => toggleFolder(folder._id)}
                  className="min-w-0"
                >
                  <CollapsibleTrigger asChild>
                    <FolderButton
                      folder={folder}
                      isExpanded={expandedFolders.has(folder._id)}
                      isRenaming={renamingId === folder._id}
                      hasItems={sidebarData.notes.some(
                        (note) => note.folderId === folder._id,
                      )}
                      onToggle={() => toggleFolder(folder._id)}
                      onStartRename={() => setRenamingId(folder._id)}
                      onFinishRename={(name) => {
                        updateFolderName(folder._id, name);
                        setRenamingId(null);
                      }}
                      onDelete={() => deleteFolder(folder._id)}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 min-w-0">
                    {sidebarData.notes
                      .filter((note) => note.folderId === folder._id)
                      .map((note) => (
                        <DraggableNote key={note._id} note={note}>
                          <NoteButton
                            note={note}
                            isRenaming={renamingId === note._id}
                            isSelected={currentNoteId === note._id}
                            onNoteSelected={selectNote}
                            onStartRename={() => setRenamingId(note._id)}
                            onFinishRename={(name) => {
                              updateNoteTitle(name);
                              setRenamingId(null);
                            }}
                            onDelete={() => deleteNote(note._id)}
                          />
                        </DraggableNote>
                      ))}
                  </CollapsibleContent>
                </Collapsible>
              </DroppableFolder>
            ))}

            {/* Root level notes */}
            {sidebarData.notes
              .filter((note) => !note.folderId)
              .map((note) => (
                <DraggableNote key={note._id} note={note}>
                  <NoteButton
                    note={note}
                    isRenaming={renamingId === note._id}
                    isSelected={currentNoteId === note._id}
                    onNoteSelected={selectNote}
                    onStartRename={() => setRenamingId(note._id)}
                    onFinishRename={(name) => {
                      updateNoteTitle(name);
                      setRenamingId(null);
                    }}
                    onDelete={() => deleteNote(note._id)}
                  />
                </DraggableNote>
              ))}
          </DroppableRoot>
        </div>
      </div>
      <DragOverlay>
        {activeNote ? (
          <NoteButton
            note={activeNote}
            isRenaming={false}
            isSelected={false}
            onNoteSelected={() => {}}
            onStartRename={() => {}}
            onFinishRename={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
