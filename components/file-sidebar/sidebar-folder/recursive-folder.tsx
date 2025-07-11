"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DroppableFolder } from "./droppable-folder";
import { FolderButton } from "./folder-button";
import { Folder, Note, FolderNode } from "@/convex/types";
import { Id } from "@/convex/_generated/dataModel";
import { DraggableNote } from "../sidebar-note/draggable-note";
import { NoteButton } from "../sidebar-note/note-button";

interface RecursiveFolderProps {
  folder: FolderNode;
  expandedFolders: Set<Id<"folders">>;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  selectedNoteId: Id<"notes"> | null;
  childFolders: FolderNode[];
  childNotes: Note[];
  onToggleExpand: (folderId: Id<"folders">) => void;
  onStartRename: (id: Id<"folders"> | Id<"notes">) => void;
  onFinishFolderRename: (id: Id<"folders">, name: string) => void;
  onFinishNoteRename: (id: Id<"notes">, name: string) => void;
  onDeleteFolder: (id: Id<"folders">) => void;
  onDeleteNote: (id: Id<"notes">) => void;
  onNoteSelected: (noteId: Id<"notes">) => void;
}

export function RecursiveFolder({
  folder,
  expandedFolders,
  renamingId,
  selectedNoteId,
  childFolders,
  childNotes,
  onToggleExpand,
  onStartRename,
  onFinishFolderRename,
  onFinishNoteRename,
  onDeleteFolder,
  onDeleteNote,
  onNoteSelected,
}: RecursiveFolderProps) {
  const isExpanded = expandedFolders.has(folder._id);
  const isRenaming = renamingId === folder._id;
  const hasItems = childFolders.length > 0 || childNotes.length > 0;

  return (
    <DroppableFolder folder={folder}>
      <Collapsible
        open={isExpanded}
        onOpenChange={() => onToggleExpand(folder._id)}
      >
        <FolderButton
          folder={folder}
          isExpanded={isExpanded}
          isRenaming={isRenaming}
          hasItems={hasItems}
          onToggle={() => onToggleExpand(folder._id)}
          onStartRename={() => onStartRename(folder._id)}
          onFinishRename={(name) => onFinishFolderRename(folder._id, name)}
          onDelete={() => onDeleteFolder(folder._id)}
        />
        <CollapsibleContent>
          <div className="pl-3">
            {childFolders.map((childFolder) => (
              <RecursiveFolder
                key={childFolder._id}
                folder={childFolder}
                expandedFolders={expandedFolders}
                renamingId={renamingId}
                selectedNoteId={selectedNoteId}
                childFolders={childFolder.childFolders}
                childNotes={childFolder.childNotes}
                onToggleExpand={onToggleExpand}
                onStartRename={onStartRename}
                onFinishFolderRename={onFinishFolderRename}
                onFinishNoteRename={onFinishNoteRename}
                onDeleteFolder={onDeleteFolder}
                onDeleteNote={onDeleteNote}
                onNoteSelected={onNoteSelected}
              />
            ))}
            {childNotes.map((note) => (
              <DraggableNote key={note._id} note={note}>
                <NoteButton
                  note={note}
                  isRenaming={renamingId === note._id}
                  isSelected={selectedNoteId === note._id}
                  onNoteSelected={onNoteSelected}
                  onStartRename={() => onStartRename(note._id)}
                  onFinishRename={(name) => onFinishNoteRename(note._id, name)}
                  onDelete={() => onDeleteNote(note._id)}
                />
              </DraggableNote>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </DroppableFolder>
  );
}
