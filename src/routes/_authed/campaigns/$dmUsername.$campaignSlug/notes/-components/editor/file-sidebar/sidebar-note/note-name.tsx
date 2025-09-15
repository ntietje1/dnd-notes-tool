import { EditableName } from "../sidebar-item/editable-name";
import { UNTITLED_NOTE_TITLE } from "convex/notes/types";
import type { Note } from "convex/notes/types";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { useNoteActions } from "~/hooks/useNoteActions";

interface NoteNameProps {
  note: Note;
}

export function NoteName({ note }: NoteNameProps) {
  const { renamingId, setRenamingId } = useFileSidebar();
  const { updateNote } = useNoteActions();
  
  return (
    <EditableName
      initialName={note.name || ""}
      defaultName={UNTITLED_NOTE_TITLE}
      isRenaming={renamingId === note._id}
      onFinishRename={(name) => {
        updateNote.mutate({ noteId: note._id, name: name });
        setRenamingId(null);
      }}
    />
  );
}
