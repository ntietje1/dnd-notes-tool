import { FileText, FileEdit } from "~/lib/icons";
import { Button } from "~/components/shadcn/ui/button";
import type { Note } from "convex/notes/types";
import { NoteName } from "./note-name";
import { cn } from "~/lib/utils";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { useCurrentNote } from "~/hooks/useCurrentNote";

interface NoteButtonProps {
  note: Note;
}

export function NoteButton({
  note
}: NoteButtonProps) {
  const { renamingId } = useFileSidebar();
  const { note: currentNote, selectNote } = useCurrentNote();
  const isSelected = currentNote?.data?._id === note._id;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0",
        isSelected && "bg-muted",
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectNote(note._id);
      }}
    >
      <div className="flex items-center gap-1 min-w-0 w-full pl-2">
        {renamingId === note._id ? (
          <FileEdit className="h-4 w-4 shrink-0" />
        ) : (
          <FileText className="h-4 w-4 shrink-0" />
        )}
        <NoteName note={note} />
      </div>
    </Button>
  );
}
