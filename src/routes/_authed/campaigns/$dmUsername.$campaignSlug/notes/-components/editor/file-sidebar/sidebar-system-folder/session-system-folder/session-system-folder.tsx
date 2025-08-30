import { Button } from "~/components/shadcn/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
} from "~/lib/icons";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "~/components/shadcn/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { NoteButton } from "../../sidebar-note/note-button";
import type { Id } from "convex/_generated/dataModel";
import type { Note } from "convex/notes/types";
import { useNotes } from "~/contexts/NotesContext";
import { convexQuery } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";

interface SessionSystemFolderProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const SessionSystemFolder = ({
  isExpanded,
  onToggleExpanded,
  renamingId,
  setRenamingId,
}: SessionSystemFolderProps) => {
  const { updateNoteName, selectNote, note } = useNotes();
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  
  const queryResult = useQuery(convexQuery(api.notes.queries.getTagNotePages, campaign ? {
    tagType: "Session",
    campaignId: campaign._id,
  } : "skip"));
  
  const tagNotePages = queryResult.data ?? [];
  const hasItems = tagNotePages.length > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      {/* Non-draggable system folder - no context menu for sessions */}
      <Button
        variant="ghost"
        className="w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-1 min-w-0 w-full">
          <div className="flex items-center h-4 w-3 shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-2 w-2 pl-1 pr-0.5" />
            ) : (
              <ChevronRight className="h-2 w-2 pl-1 pr-0.5" />
            )}
          </div>
          <Calendar className="h-4 w-4 shrink-0" />
          <EditableName
            initialName="Sessions"
            defaultName="Sessions"
            isRenaming={false}
            onFinishRename={() => {}}
          />
        </div>
      </Button>
      <CollapsibleContent>
        <div className="relative pl-4">
          {/* Vertical line */}
          {hasItems && (
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/10" />
          )}
          {/* Render non-draggable notes */}
          {tagNotePages.map((tagNote) => (
            <div key={tagNote._id} className="flex w-full min-w-0">
              <NoteButton
                note={tagNote as Note}
                isRenaming={renamingId === tagNote._id}
                // onStartRename={() => setRenamingId(note._id)}
                onFinishRename={(name) => {
                  updateNoteName(tagNote._id, name);
                  setRenamingId(null);
                }}
                isSelected={note?._id === tagNote._id}
                onNoteSelected={() => selectNote(tagNote._id)}
                // onDelete={() => deleteNote(note._id)}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};