"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCharacters } from "../layout";
import { ContentGrid } from "@/components/ui/content-grid-page/content-grid";
import { ContentCard } from "@/components/ui/content-grid-page/content-card";
import { CreateActionCard } from "@/components/ui/content-grid-page/create-action-card";
import { EmptyState } from "@/components/ui/content-grid-page/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Users, Edit, Plus, Trash2 } from "lucide-react";
import { CharacterWithTag } from "@/convex/characters/types";
import { CharacterDialog } from "./character-dialog";
import { toast } from "sonner";

export default function CharactersContent() {
  const { currentCampaign } = useCharacters();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterWithTag | null>(null);
  const [deletingCharacter, setDeletingCharacter] = useState<CharacterWithTag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const characters = useQuery(
    api.characters.queries.getCharactersByCampaign,
    currentCampaign?._id ? { campaignId: currentCampaign._id } : "skip"
  );

  const deleteCharacter = useMutation(api.characters.mutations.deleteCharacter);

  const handleDeleteCharacter = async () => {
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

  if (!currentCampaign) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No campaign selected</p>
      </div>
    );
  }

  if (!characters) {
    return null; // Loading is handled by wrapper
  }

  return (
    <>
      <ContentGrid>
        {(characters.length > 0) && (
            <CreateActionCard
            onClick={() => setIsCreateDialogOpen(true)}
            title="Create New Character"
            description="Add a new character to your campaign"
            icon={Users}
            />
        )}

        {characters.map((character) => (
          <ContentCard
            key={character._id}
            title={character.name}
            description={character.description}
            color={character.color}
            badge={{
              text: "Character",
              icon: <Users className="w-3 h-3" />,
              variant: "secondary"
            }}
            actionButtons={[
              {
                icon: <Edit className="w-4 h-4" />,
                onClick: (e) => {
                  e.stopPropagation();
                  setEditingCharacter(character);
                },
                "aria-label": "Edit character"
              },
              {
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (e) => {
                  e.stopPropagation();
                  setDeletingCharacter(character);
                },
                "aria-label": "Delete character",
                variant: "destructive-subtle"
              }
            ]}
          />
        ))}

        {characters.length === 0 && (
          <EmptyState
            icon={Users}
            title="No characters yet"
            description="Create your first character to start building your campaign's cast. Each character will automatically get a tag for use in your notes."
            action={{
              label: "Create First Character",
              onClick: () => setIsCreateDialogOpen(true),
              icon: Plus
            }}
          />
        )}
      </ContentGrid>

      <CharacterDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        campaignId={currentCampaign._id}
      />

      {editingCharacter && (
        <CharacterDialog
          mode="edit"
          isOpen={true}
          onClose={() => setEditingCharacter(null)}
          character={editingCharacter}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingCharacter}
        onClose={() => setDeletingCharacter(null)}
        onConfirm={handleDeleteCharacter}
        title="Delete Character"
        description={`Are you sure you want to delete "${deletingCharacter?.name}"? This will also remove all references to this character in your notes. This action cannot be undone.`}
        confirmLabel="Delete Character"
        isLoading={isDeleting}
        icon={Users}
      />
    </>
  );
} 