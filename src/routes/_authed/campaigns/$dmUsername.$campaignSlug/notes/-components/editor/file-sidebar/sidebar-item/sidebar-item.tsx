import { DraggableNote } from "../sidebar-note/draggable-note";
import type { Note, AnySidebarItem, Folder } from "convex/notes/types";
import { NoteButton } from "../sidebar-note/note-button";
import type { Id } from "convex/_generated/dataModel";
import { RecursiveFolder } from "../sidebar-folder/recursive-folder";
import { NoteContextMenu } from "../sidebar-note/note-context-menu";

//TODO: use switch statement instead
//TODO: move all actions down so that this level doesnt need to know about them
function isFolder(item: AnySidebarItem): item is Folder {
  return item.type === "folders" && "children" in item;
}

function isNote(item: AnySidebarItem): item is Note {
  return item.type === "notes";
}

interface SidebarItemProps {
  item: AnySidebarItem;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const SidebarItem = ({
  item,
  renamingId,
  setRenamingId,
}: SidebarItemProps) => {
  const {
    updateNoteName,
    selectNote,
    deleteNote,
    note,
    expandedFolders,
    toggleFolder,
    updateFolderName,
    deleteFolder,
    createNote,
    createFolder,
  } = useNotes();

  if (isFolder(item)) {
    return (
      <RecursiveFolder
        folder={item}
        renamingId={renamingId}
        setRenamingId={setRenamingId}
        expandedFolders={expandedFolders}
        toggleFolder={toggleFolder}
        updateFolderName={updateFolderName}
        deleteFolder={deleteFolder}
        createNote={createNote}
        createFolder={createFolder}
      />
    );
  }

  if (isNote(item)) {
    return (
      <DraggableNote key={item._id} note={item}>
        <NoteContextMenu onEdit={() => setRenamingId(item._id)} onDelete={() => deleteNote(item._id)}>
          <NoteButton
            note={item}
            isRenaming={renamingId === item._id}
            onFinishRename={(name) => {
              updateNoteName(item._id, name);
              setRenamingId(null);
            }}
            isSelected={note?._id === item._id}
            onNoteSelected={() => selectNote(item._id)}
          />
        </NoteContextMenu>
      </DraggableNote>
    );
  }

  throw new Error("Invalid item type or missing required properties");
};