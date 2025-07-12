"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DroppableFolder } from "./droppable-folder";
import { FolderButton } from "./folder-button";
import { Note, FolderNode } from "@/convex/types";
import { Id } from "@/convex/_generated/dataModel";
import { sortFoldersAndNotes, SortOptions } from "../sidebar-sort";
import { SidebarItem } from "../sidebar-item";

interface RecursiveFolderProps {
  folder: FolderNode;
  sortOptions: SortOptions;
  expandedFolders: Set<Id<"folders">>;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  selectedNoteId: Id<"notes"> | null;
  toggleFolder: (folderId: Id<"folders">) => void;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
  handleFinishFolderRename: (id: Id<"folders">, name: string) => void;
  handleFinishNoteRename: (id: Id<"notes">, name: string) => void;
  deleteFolder: (id: Id<"folders">) => void;
  deleteNote: (id: Id<"notes">) => void;
  selectNote: (id: Id<"notes">) => void;
  createNote: (id: Id<"folders">) => void;
}

export function RecursiveFolder({
  folder,
  sortOptions,
  expandedFolders,
  renamingId,
  selectedNoteId,
  toggleFolder,
  setRenamingId,
  handleFinishFolderRename,
  handleFinishNoteRename,
  deleteFolder,
  deleteNote,
  selectNote,
  createNote,
}: RecursiveFolderProps) {
  const isExpanded = expandedFolders.has(folder._id);
  const isRenaming = renamingId === folder._id;
  const hasItems =
    folder.childFolders.length > 0 || folder.childNotes.length > 0;

  // Sort folders and notes together
  const { sortedItems } = sortFoldersAndNotes(
    folder.childFolders,
    folder.childNotes,
    sortOptions,
  );

  return (
    <DroppableFolder folder={folder}>
      <Collapsible
        open={isExpanded}
        onOpenChange={() => toggleFolder(folder._id)}
      >
        <FolderButton
          folder={folder}
          isExpanded={isExpanded}
          isRenaming={isRenaming}
          hasItems={hasItems}
          onToggle={() => toggleFolder(folder._id)}
          onStartRename={() => setRenamingId(folder._id)}
          onFinishRename={(name) => handleFinishFolderRename(folder._id, name)}
          onDelete={() => deleteFolder(folder._id)}
          onNewPage={() => {
            if (!isExpanded) {
              toggleFolder(folder._id);
            }
            createNote(folder._id);
          }}
        />
        <CollapsibleContent>
          <div className="relative pl-3">
            {/* Vertical line */}
            {sortedItems.length > 0 && (
              <div className="absolute left-[8px] top-[-4px] bottom-0 w-0.5 bg-muted-foreground/10" />
            )}
            {sortedItems.map((item) => (
              <SidebarItem
                key={item._id}
                item={item}
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

              //   <RecursiveFolder
              //     key={childFolder._id}
              //     folder={childFolder}
              //     sortOptions={sortOptions}
              //     expandedFolders={expandedFolders}
              //     renamingId={renamingId}
              //     selectedNoteId={selectedNoteId}
              //     childFolders={childFolder.childFolders}
              //     childNotes={childFolder.childNotes}
              //     onToggleExpand={onToggleExpand}
              //     onStartRename={onStartRename}
              //     onFinishFolderRename={onFinishFolderRename}
              //     onFinishNoteRename={onFinishNoteRename}
              //     onDeleteFolder={onDeleteFolder}
              //     onDeleteNote={onDeleteNote}
              //     onNoteSelected={onNoteSelected}
              //     onNewPage={onNewPage}
              //   />
              // ))}
              // {childNotes.map((note) => (
              //   <DraggableNote key={note._id} note={note}>
              //     <NoteButton
              //       note={note}
              //       isRenaming={renamingId === note._id}
              //       isSelected={selectedNoteId === note._id}
              //       onNoteSelected={onNoteSelected}
              //       onStartRename={() => onStartRename(note._id)}
              //       onFinishRename={(name) => onFinishNoteRename(note._id, name)}
              //       onDelete={() => onDeleteNote(note._id)}
              //     />
              //   </DraggableNote>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </DroppableFolder>
  );
}
