import { FileText, FileEdit } from "~/lib/icons";
import { Button } from "~/components/shadcn/ui/button";
import type { Note } from "convex/notes/types";
import { NoteName } from "./note-name";
import { cn } from "~/lib/utils";

interface NoteButtonProps {
  note: Note;
  isRenaming: boolean;
  isSelected: boolean;
  onNoteSelected: () => void;
  onFinishRename: (name: string) => void;
}

export function NoteButton({
  note,
  isRenaming,
  isSelected,
  onNoteSelected,
  onFinishRename,
}: NoteButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0",
        isSelected && "bg-muted",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onNoteSelected();
      }}
    >
      <div className="flex items-center gap-1 min-w-0 w-full pl-2">
        {isRenaming ? (
          <FileEdit className="h-4 w-4 shrink-0" />
        ) : (
          <FileText className="h-4 w-4 shrink-0" />
        )}
        <NoteName
          note={note}
          isRenaming={isRenaming}
          onFinishRename={onFinishRename}
        />
      </div>
    </Button>
  );
}
