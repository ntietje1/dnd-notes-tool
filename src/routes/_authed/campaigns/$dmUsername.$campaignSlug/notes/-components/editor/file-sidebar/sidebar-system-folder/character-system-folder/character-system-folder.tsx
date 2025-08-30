import { useState } from "react";
import { type TagNote } from "convex/tags/types";
import { CharacterSystemFolderContextMenu } from "./character-system-folder-context-menu";
import { Button } from "~/components/shadcn/ui/button";
import {
  ChevronDown,
  ChevronRight,
  User,
  Users,
} from "~/lib/icons";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "~/components/shadcn/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { NoteButton } from "../../sidebar-note/note-button";
import type { Id } from "convex/_generated/dataModel";
import { useNotes } from "~/contexts/NotesContext";
import { ConfirmationDialog } from "~/components/dialogs/confirmation-dialog";
import type { CharacterWithTag } from "convex/characters/types";
import { toast } from "sonner";
import { CharacterNoteContextMenu } from "./character-note-context-menu";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import type { Note } from "convex/notes/types";
import { useCampaign } from "~/contexts/CampaignContext";

interface CharacterSystemFolderProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const CharacterSystemFolder = ({
  isExpanded,
  onToggleExpanded,
  renamingId,
  setRenamingId,
}: CharacterSystemFolderProps) => {
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const { updateNoteName, selectNote, note } = useNotes();
  const [deletingCharacter, setDeletingCharacter] = useState<CharacterWithTag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const updateCharacter = useMutation({mutationFn: useConvexMutation(api.characters.mutations.updateCharacter)});
  const deleteCharacter = useMutation({mutationFn: useConvexMutation(api.characters.mutations.deleteCharacter)});

  const queryResult = useQuery(convexQuery(api.notes.queries.getTagNotePages, campaign ? {
    tagType: "Character",
    campaignId: campaign._id,
  } : "skip"));
  
  const tagNotePages = queryResult.data ?? [];
  const hasItems = tagNotePages.length > 0;

  const allCharacters = useQuery(convexQuery(api.characters.queries.getCharactersByCampaign, campaign ? {
    campaignId: campaign._id,
  } : "skip"));

  const findCharacterByTagId = (tagId: Id<"tags">) => {
    return allCharacters.data?.find(char => char.tagId === tagId);
  };

  const handleCharacterNoteRename = async (note: TagNote, newName: string) => {
    if (!campaign) return;
    
    try {
      const character = findCharacterByTagId(note.tagId);
      if (!character) {
        toast.error("Character not found");
        return;
      }
      
      await updateCharacter.mutateAsync({
        characterId: character._id,
        name: newName,
      });

      updateNoteName(note._id, newName);
      
      toast.success("Character renamed successfully");
    } catch (_) {
      toast.error("Failed to rename character");
    } finally {
      setRenamingId(null);
    }
  };

  const handleCharacterNoteDelete = (note: TagNote) => {
    if (!campaign) return;
    
    const character = findCharacterByTagId(note.tagId);
    if (character) {
      setDeletingCharacter(character);
    } else {
      toast.error("Character not found");
    }
  };

  const confirmDeleteCharacter = async () => {
    if (!deletingCharacter) return;

    setIsDeleting(true);
    try {
      await deleteCharacter.mutateAsync({
        characterId: deletingCharacter._id,
      });

      toast.success("Character deleted successfully");
      setDeletingCharacter(null);
    } catch (_) {
      toast.error("Failed to delete character");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      {/* Non-draggable system folder */}
      <CharacterSystemFolderContextMenu>
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
            <User className="h-4 w-4 shrink-0" />
            <EditableName
              initialName="Characters"
              defaultName="Characters"
              isRenaming={false}
              onFinishRename={() => {}}
            />
          </div>
        </Button>
      </CharacterSystemFolderContextMenu>
      <CollapsibleContent>
        <div className="relative pl-4">
          {/* Vertical line */}
          {hasItems && (
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/10" />
          )}
          {/* Render non-draggable notes */}
          {tagNotePages.map((tagNote) => (
            <div key={tagNote._id} className="flex w-full min-w-0">
                <CharacterNoteContextMenu onEdit={() => setRenamingId(tagNote._id)} onDelete={() => handleCharacterNoteDelete(tagNote as TagNote)}>
                    <NoteButton
                        note={tagNote as Note}
                        isRenaming={renamingId === tagNote._id}
                        onFinishRename={(name) => handleCharacterNoteRename(tagNote as TagNote, name)}
                        isSelected={note?._id === tagNote._id}
                        onNoteSelected={() => selectNote(tagNote._id)}
                    />
              </CharacterNoteContextMenu>
            </div>
          ))}
        </div>
      </CollapsibleContent>
      
      {/* Confirmation dialog for character deletion */}
      <ConfirmationDialog
        isOpen={!!deletingCharacter}
        onClose={() => setDeletingCharacter(null)}
        onConfirm={confirmDeleteCharacter}
        title="Delete Character"
        description={`Are you sure you want to delete "${deletingCharacter?.name}"? This will also remove all references to this character in your notes. This action cannot be undone.`}
        confirmLabel="Delete Character"
        isLoading={isDeleting}
        icon={Users}
      />
    </Collapsible>
  );
};