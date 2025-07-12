import { DraggableNote } from "./sidebar-note/draggable-note";
import { FolderNode, Note } from "@/convex/types";
import { NoteButton } from "./sidebar-note/note-button";
import { Id } from "@/convex/_generated/dataModel";
import { SortOptions } from "./sidebar-sort";
import { RecursiveFolder } from "./sidebar-folder/recursive-folder";

// Type guard functions
function isFolderNode(item: FolderNode | Note): item is FolderNode {
  return (item as FolderNode).childFolders !== undefined;
}

function isNote(item: FolderNode | Note): item is Note {
  return (item as Note).content !== undefined;
}

interface SidebarItemProps {
  item: FolderNode | Note;
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

export const SidebarItem = ({
  item,
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
}: SidebarItemProps) => {
  if (isFolderNode(item)) {
    return (
      <RecursiveFolder
        folder={item}
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
  }

  if (isNote(item)) {
    return (
      <DraggableNote key={item._id} note={item}>
        <NoteButton
          note={item}
          isRenaming={renamingId === item._id}
          isSelected={selectedNoteId === item._id}
          onNoteSelected={selectNote}
          onStartRename={() => setRenamingId(item._id)}
          onFinishRename={(name) => {
            handleFinishNoteRename(item._id, name);
            setRenamingId(null);
          }}
          onDelete={() => deleteNote(item._id)}
        />
      </DraggableNote>
    );
  }

  throw new Error("Invalid item type");
};
