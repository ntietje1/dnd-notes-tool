import type { Note } from "convex/notes/types";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { useCurrentNote } from "~/hooks/useCurrentNote";
import { NoteContextMenu } from "./note-context-menu";
import { useRef } from "react";
import type { ContextMenuRef } from "~/components/context-menu/context-menu";
import { NoteButtonBase } from "./note-button-base";
import { DraggableNote } from "./draggable-note";

interface NoteButtonProps {
  note: Note;
}

export function NoteButton({
  note
}: NoteButtonProps) {
  const { renamingId } = useFileSidebar();
  const { note: currentNote, selectNote } = useCurrentNote();
  const isSelected = currentNote?.data?._id === note._id;
  const contextMenuRef = useRef<ContextMenuRef>(null);

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    contextMenuRef.current?.open({ x: e.clientX + 4, y: e.clientY + 4 });
  };

  return (
    <DraggableNote note={note}>
      <NoteContextMenu ref={contextMenuRef} note={note}>
        <NoteButtonBase
          note={note}
          handleSelect={() => selectNote(note._id)}
          handleMoreOptions={handleMoreOptions}
          isSelected={isSelected}
          isRenaming={renamingId === note._id}
        />
      </NoteContextMenu>
    </DraggableNote>
  );
}
