import { DraggableNote } from "../sidebar-note/draggable-note";
import { FolderNode, Note, AnySidebarItem } from "@/convex/notes/types";
import { NoteButton } from "../sidebar-note/note-button";
import { Id } from "@/convex/_generated/dataModel";
import { RecursiveFolder } from "../sidebar-folder/recursive-folder";
import { useNotes } from "@/contexts/NotesContext";

function isFolderNode(item: AnySidebarItem): item is FolderNode {
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
    currentNote,
    expandedFolders,
    toggleFolder,
    updateFolderName,
    deleteFolder,
    createNote,
  } = useNotes();

  if (isFolderNode(item)) {
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
      />
    );
  }

  if (isNote(item)) {
    return (
      <DraggableNote key={item._id} note={item}>
        <NoteButton
          note={item}
          isRenaming={renamingId === item._id}
          onStartRename={() => setRenamingId(item._id)}
          onFinishRename={(name) => {
            updateNoteName(item._id, name);
            setRenamingId(null);
          }}
          isSelected={currentNote?._id === item._id}
          onNoteSelected={() => selectNote(item._id)}
          onDelete={() => deleteNote(item._id)}
        />
      </DraggableNote>
    );
  }

  throw new Error("Invalid item type or missing required properties");
};

// const renderSidebarItem = (item: AnySidebarItem) => {
//   switch (item.type) {
//     case "folders":
//       return <RecursiveFolder folder={item} />;
//     case "notes":
//       return <DraggableNote note={item} />;
//   }
// };
