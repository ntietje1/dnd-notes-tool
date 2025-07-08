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
  useDraggable,
  useDroppable,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  FolderPlus,
  FilePlus,
} from "lucide-react";
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
import { UNTITLED_FOLDER_NAME, UNTITLED_NOTE_TITLE } from "@/convex/types";
import { cn } from "@/lib/utils";

//TODO: prefetch the note data on hover

type DraggableItem =
  | {
      id: Id<"notes">;
      type: "note";
    }
  | {
      id: Id<"folders">;
      type: "folder";
    };

function NoteButton({
  note,
  isDragging,
  onNoteSelected,
}: {
  note: any;
  isDragging?: boolean;
  onNoteSelected?: (note: Note) => void;
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 h-9",
        isDragging && "opacity-50",
      )}
      onClick={() => onNoteSelected?.(note)}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{note.title || UNTITLED_NOTE_TITLE}</span>
    </Button>
  );
}

function DraggableNote({
  note,
  onNoteSelected,
}: {
  note: any;
  onNoteSelected: (note: Note) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note._id,
    data: {
      type: "note",
      id: note._id,
    },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <NoteButton
        note={note}
        isDragging={isDragging}
        onNoteSelected={onNoteSelected}
      />
    </div>
  );
}

function DroppableFolder({
  folder,
  children,
}: {
  folder: any;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: folder._id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("transition-colors", isOver && "bg-muted")}
    >
      {children}
    </div>
  );
}

function DroppableRoot({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[calc(100vh-6rem)] transition-colors",
        isOver && "bg-muted",
      )}
    >
      <div className="p-2 space-y-1">{children}</div>
    </div>
  );
}

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

      // Create a new notes array with the updated folder
      const updatedNotes = sidebarData.notes.map((note: Note) =>
        note._id === args.noteId ? { ...note, folderId: args.folderId } : note,
      );

      // Update the query data optimistically
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
  const createFolder = useMutation(api.notes.createFolder);
  const createNote = useMutation(api.notes.createNote);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
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
      <div className="w-64 h-full border-r p-4">
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
      <div className="w-64 h-full border-r bg-background flex flex-col">
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
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full absolute inset-0">
            <DroppableRoot>
              {/* Folders */}
              {sidebarData.folders.map((folder) => (
                <DroppableFolder key={folder._id} folder={folder}>
                  <Collapsible
                    open={expandedFolders.has(folder._id)}
                    onOpenChange={() => toggleFolder(folder._id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 h-9"
                      >
                        {expandedFolders.has(folder._id) ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                        <Folder className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {folder.name || UNTITLED_FOLDER_NAME}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-10 space-y-1">
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
          </ScrollArea>
        </div>
      </div>
      <DragOverlay>
        {activeNote ? <NoteButton note={activeNote} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
