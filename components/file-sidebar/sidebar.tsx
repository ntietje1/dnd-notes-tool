"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { OptimisticLocalStore } from "convex/browser";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

type DraggableItem =
  | {
      id: Id<"notes">;
      type: "note";
    }
  | {
      id: Id<"folders">;
      type: "folder";
    };

interface FileSidebarProps {
  onNoteSelected: (note: Note) => void;
}

export function FileSidebar({ onNoteSelected }: FileSidebarProps) {
  const sidebarData = useQuery(api.notes.getSidebarData);
  const moveNote = useMutation(api.notes.moveNote).withOptimisticUpdate(
    (
      store: OptimisticLocalStore,
      args: { noteId: Id<"notes">; folderId?: Id<"folders"> },
    ) => {
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (!sidebarData) return;

      const updatedNotes = sidebarData.notes.map((note: Note) =>
        note._id === args.noteId ? { ...note, folderId: args.folderId } : note,
      );

      store.setQuery(
        api.notes.getSidebarData,
        {},
        {
          ...sidebarData,
          notes: updatedNotes,
        },
      );
    },
  );
  const updateFolder = useMutation(api.notes.updateFolder).withOptimisticUpdate(
    (
      store: OptimisticLocalStore,
      args: { folderId: Id<"folders">; name?: string },
    ) => {
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (!sidebarData) return;

      const updatedFolders = sidebarData.folders.map((folder) =>
        folder._id === args.folderId
          ? { ...folder, name: args.name || "" }
          : folder,
      );

      store.setQuery(
        api.notes.getSidebarData,
        {},
        {
          ...sidebarData,
          folders: updatedFolders,
        },
      );
    },
  );
  const createFolder = useMutation(api.notes.createFolder);
  const createNote = useMutation(api.notes.createNote);
  const deleteFolder = useMutation(api.notes.deleteFolder);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [editingFolderId, setEditingFolderId] = useState<Id<"folders"> | null>(
    null,
  );
  const [activeNote, setActiveNote] = useState<any | null>(null);

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

  const handleCreateFolder = useCallback(async () => {
    await createFolder({});
  }, [createFolder]);

  const handleCreateNote = useCallback(async () => {
    await createNote({});
  }, [createNote]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const openFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  };

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
          await moveNote({
            noteId: note._id,
            folderId: newFolderId,
          });
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
      <div className="h-full border-r bg-background flex flex-col">
        <div className="pl-4 p-2 h-12 flex justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold justify-start pr-4">Files</h2>
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateFolder}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Folder</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleCreateNote}>
                  <FilePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Page</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Separator className="flex-shrink-0" />
        <div className="flex-1 overflow-hidden min-w-0">
          <ScrollArea className="h-screen min-w-0">
            <div className="min-w-0">
              <DroppableRoot>
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
                          isEditing={editingFolderId === folder._id}
                          onToggle={() => toggleFolder(folder._id)}
                          onEdit={() => setEditingFolderId(folder._id)}
                          onSave={(name) => {
                            updateFolder({ folderId: folder._id, name });
                            setEditingFolderId(null);
                          }}
                          onDelete={() =>
                            deleteFolder({ folderId: folder._id })
                          }
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-10 space-y-1 min-w-0">
                        {sidebarData.notes
                          .filter((note) => note.folderId === folder._id)
                          .map((note) => (
                            <DraggableNote
                              key={note._id}
                              note={note}
                              onNoteSelected={onNoteSelected}
                            />
                          ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </DroppableFolder>
                ))}

                {/* Root level notes */}
                {sidebarData.notes
                  .filter((note) => !note.folderId)
                  .map((note) => (
                    <DraggableNote
                      key={note._id}
                      note={note}
                      onNoteSelected={onNoteSelected}
                    />
                  ))}
              </DroppableRoot>
            </div>
          </ScrollArea>
        </div>
      </div>
      <DragOverlay>
        {activeNote ? <NoteButton note={activeNote} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
