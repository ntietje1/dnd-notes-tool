import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { api } from "convex/_generated/api";
import type { Character } from "convex/characters/types";
import { FormDialog } from "~/components/forms/form-dialog";
import { FormActions } from "~/components/forms/form-actions";
import {
  ColorPicker,
  DEFAULT_COLORS,
} from "~/components/forms/color-picker";
import { Plus, Users } from "~/lib/icons";
import { toast } from "sonner";
import { useCampaign } from "~/contexts/CampaignContext";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { Input } from "~/components/shadcn/ui/input";
import { Label } from "~/components/shadcn/ui/label";
import { validateCharacterName } from "./character-form-validators";

const DEFAULT_CHARACTER_FORM_VALUES: { name: string; description: string; color: string } = {
  name: "",
  description: "",
  color: DEFAULT_COLORS[0],
};

interface CharacterDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  dmUsername: string;
  campaignSlug: string;
  character?: Character; // Required for edit mode
  navigateToNote?: boolean;
}

export default function CharacterDialog({
  mode,
  isOpen,
  onClose,
  dmUsername,
  campaignSlug,
  character,
  navigateToNote = false,
}: CharacterDialogProps) {
  const router = useRouter();
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const createCharacter = useMutation({ mutationFn: useConvexMutation(api.characters.mutations.createCharacter) });
  const updateCharacter = useMutation({ mutationFn: useConvexMutation(api.characters.mutations.updateCharacter) });

  const form = useForm({
    defaultValues: { ...DEFAULT_CHARACTER_FORM_VALUES },
    onSubmit: async ({ value }) => {
      if (!campaign) {
        toast.error("Campaign not found");
        return;
      }

      try {
        if (mode === "create") {
          const result = await createCharacter.mutateAsync({
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            color: value.color,
            campaignId: campaign._id,
          });

          toast.success("Character created successfully");
          onClose();

          if (navigateToNote && result.noteId) {
            router.navigate({
              to: "/campaigns/$dmUsername/$campaignSlug/notes/$noteId",
              params: {
                dmUsername,
                campaignSlug,
                noteId: result.noteId,
              },
            });
          }
        } else if (mode === "edit" && character) {
          await updateCharacter.mutateAsync({
            characterId: character._id,
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            color: value.color,
          });

          toast.success("Character updated successfully");
          onClose();
        }
      } catch (error) {
        console.error(`Failed to ${mode} character:`, error);
        toast.error(`Failed to ${mode} character`);
      }
    },
  });

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      form.reset({ ...DEFAULT_CHARACTER_FORM_VALUES });
    } else if (mode === "edit" && character) {
      form.reset({
        name: character.name,
        description: character.description || "",
        color: character.color,
      });
    }
  }, [mode, character, isOpen]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen && form.state.isDirty) {
      form.reset({ ...DEFAULT_CHARACTER_FORM_VALUES });
    }
  }, [isOpen]);

  const handleClose = () => {
      if (form.state.isSubmitting) return;
      onClose();
  };

  if (!isOpen) return null;

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "create" ? "Create New Character" : "Edit Character"}
      description={
        mode === "create"
          ? "Add a new character to your campaign"
          : "Update character details"
      }
      icon={Users}
    >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            validators={{
              onChange: () => undefined,
              onBlur: ({ value }) => validateCharacterName(value),
            }}
          >
            {(field) => (
              <div className="space-y-2 px-px">
                <Label htmlFor="character-name">Character Name</Label>
                <Input
                  id="character-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter character name..."
                  maxLength={100}
                  disabled={form.state.isSubmitting}
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-2 px-px">
                <Label htmlFor="character-description">Description</Label>
                <textarea
                  id="character-description"
                  rows={3}
                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Describe this character..."
                  disabled={form.state.isSubmitting}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="color">
            {(field) => (
              <div className="space-y-2 px-px">
                <ColorPicker
                  selectedColor={field.state.value}
                  onColorChange={(color) => field.handleChange(color)}
                  disabled={form.state.isSubmitting}
                  label="Character Color"
                />
              </div>
            )}
          </form.Field>

          <FormActions
            actions={[
              {
                label: "Cancel",
                onClick: handleClose,
                variant: "outline",
                disabled: form.state.isSubmitting,
              },
              {
                label:
                  mode === "create" ? "Create Character" : "Update Character",
                onClick: () => {},
                type: "submit",
                disabled: form.state.isSubmitting,
                loading: form.state.isSubmitting,
                loadingText: mode === "create" ? "Creating..." : "Updating...",
                icon: mode === "create" ? Plus : undefined,
              },
            ]}
          />
        </form>
    </FormDialog>
  );
}
