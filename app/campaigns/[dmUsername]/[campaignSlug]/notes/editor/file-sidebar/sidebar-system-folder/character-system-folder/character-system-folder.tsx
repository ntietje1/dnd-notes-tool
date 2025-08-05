"use client";

import { useState } from "react";
import { TagNote, TagType } from "@/convex/tags/types";
import { CharacterSystemFolderContextMenu } from "./character-system-folder-context-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  User,
  Users,
} from "lucide-react";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NoteButton } from "../../sidebar-note/note-button";
import { Id } from "@/convex/_generated/dataModel";
import { Note } from "@/convex/notes/types";
import { useNotes } from "@/contexts/NotesContext";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { CharacterWithTag } from "@/convex/characters/types";
import { toast } from "sonner";
import { CharacterNoteContextMenu } from "./character-note-context-menu";

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
  const { updateNoteName, selectNote, currentNote, currentCampaign } = useNotes();
  const [deletingCharacter, setDeletingCharacter] = useState<CharacterWithTag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Mutations
  const updateCharacter = useMutation(api.characters.mutations.updateCharacter);
  const deleteCharacter = useMutation(api.characters.mutations.deleteCharacter);

  const queryResult = useQuery(api.notes.queries.getTagNotePages, currentCampaign ? {
    tagType: "Character",
    campaignId: currentCampaign._id,
  } : "skip");
  
  const tagNotePages = queryResult ?? [];
  const hasItems = tagNotePages.length > 0;

  // Get all characters for this campaign to map tag IDs to character IDs
  const allCharacters = useQuery(api.characters.queries.getCharactersByCampaign, currentCampaign ? {
    campaignId: currentCampaign._id,
  } : "skip");

  // Helper to find character by tag ID
  const findCharacterByTagId = (tagId: Id<"tags">) => {
    return allCharacters?.find(char => char.tagId === tagId);
  };

  // Custom rename handler that syncs character and note names
  const handleCharacterNoteRename = async (note: TagNote, newName: string) => {
    if (!currentCampaign) return;
    
    try {
      const character = findCharacterByTagId(note.tagId);
      
      if (character) {
        // Update the character name (this will also update the tag and note via the mutation)
        await updateCharacter({
          characterId: character._id,
          name: newName,
        });
        
        toast.success("Character renamed successfully");
      } else {
        // Fallback to just updating the note if character not found
        await updateNoteName(note._id, newName);
      }
      
      setRenamingId(null);
    } catch (error) {
      console.error("Failed to rename character:", error);
      toast.error("Failed to rename character");
    }
  };

  // Custom delete handler with confirmation
  const handleCharacterNoteDelete = (note: TagNote) => {
    if (!currentCampaign) return;
    
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
      await deleteCharacter({
        characterId: deletingCharacter._id,
      });

      toast.success("Character deleted successfully");
      setDeletingCharacter(null);
    } catch (error) {
      console.error("Failed to delete character:", error);
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
          {tagNotePages.map((note) => (
            <div key={note._id} className="flex w-full min-w-0">
                <CharacterNoteContextMenu onEdit={() => setRenamingId(note._id)} onDelete={() => handleCharacterNoteDelete(note as TagNote)}>
                    <NoteButton
                        note={note}
                        isRenaming={renamingId === note._id}
                        onFinishRename={(name) => handleCharacterNoteRename(note as TagNote, name)}
                        isSelected={currentNote?._id === note._id}
                        onNoteSelected={() => selectNote(note._id)}
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