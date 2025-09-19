import { FileText, FileEdit, MoreHorizontal } from "~/lib/icons";
import { Button } from "~/components/shadcn/ui/button";
import type { Note } from "convex/notes/types";
import { NoteName } from "./note-name";
import { cn } from "~/lib/utils";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { useCurrentNote } from "~/hooks/useCurrentNote";
import { HoverToggleButton } from "~/components/hover-toggle-button";

interface NoteButtonProps {
  note: Note;
}

export function NoteButton({
  note
}: NoteButtonProps) {
  const { renamingId } = useFileSidebar();
  const { note: currentNote, selectNote } = useCurrentNote();
  const isSelected = currentNote?.data?._id === note._id;

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Note context menu will handle this
  };

  return (
    <div 
      className={cn(
        "group relative flex items-center w-full h-8 px-1 rounded-sm hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted"
      )}
    >
      {/* Note Icon and Name */}
      <div 
        className="flex items-center gap-2 min-w-0 flex-1 px-1 py-1"
        onClick={(e) => {
          e.stopPropagation();
          selectNote(note._id);
        }}
      >
        {renamingId === note._id ? (
          <FileEdit className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <NoteName note={note} />
      </div>

      {/* More Options Button */}
      <HoverToggleButton
        className="relative h-6 w-6 shrink-0 flex items-center justify-center"
        nonHoverComponent={null}
        hoverComponent={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-sm"
            onClick={handleMoreOptions}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
}
