import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { api } from "convex/_generated/api";
import type { Character } from "convex/characters/types";
import { FormDialog } from "~/components/forms/form-dialog";
import { FormActions } from "~/components/forms/form-actions";
import { ValidatedInput } from "~/components/forms/validated-input";
import {
  ColorPicker,
  DEFAULT_COLORS,
} from "~/components/forms/color-picker";
import { Plus, Users } from "~/lib/icons";
import { toast } from "sonner";
import { useNotes } from "~/contexts/NotesContext";
import { useCampaign } from "~/contexts/CampaignContext";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { Skeleton } from "~/components/shadcn/ui/skeleton";

interface CharacterDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  dmUsername: string;
  campaignSlug: string;
  character?: Character; // Required for edit mode
  navigateToNote?: boolean;
}

interface CharacterFormData {
  name: string;
  description: string;
  color: string;
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

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<CharacterFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      color: DEFAULT_COLORS[0],
    },
  });

  const colorValue = watch("color");

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      reset({
        name: "",
        description: "",
        color: DEFAULT_COLORS[0],
      });
    } else if (mode === "edit" && character) {
      reset({
        name: character.name,
        description: character.description || "",
        color: character.color,
      });
    }
  }, [mode, character, isOpen, reset]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen && isDirty) {
      reset(
        {
          name: "",
          description: "",
          color: DEFAULT_COLORS[0],
        },
        {
          keepErrors: false,
          keepDirty: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false,
        },
      );
    }
  }, [isOpen, isDirty, reset]);

  const onSubmit = async (data: CharacterFormData) => {
    if (!campaign) {
      toast.error("Campaign not found");
      return;
    }

    try {
      if (mode === "create") {
        const result = await createCharacter.mutateAsync({
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
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
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
        });

        toast.success("Character updated successfully");
        onClose();
      }
    } catch (error) {
      console.error(`Failed to ${mode} character:`, error);
      toast.error(`Failed to ${mode} character`);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Ensure form is completely reset before closing
      if (isDirty) {
        reset(
          {
            name: "",
            description: "",
            color: DEFAULT_COLORS[0],
          },
          {
            keepErrors: false,
            keepDirty: false,
            keepIsSubmitted: false,
            keepTouched: false,
            keepIsValid: false,
            keepSubmitCount: false,
          },
        );
      }
      onClose();
    }
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ValidatedInput
          label="Character Name"
          required
          value={watch("name") || ""}
          inputProps={{
            placeholder: "Enter character name...",
            disabled: isSubmitting,
            maxLength: 100,
            onChange: (e) => {
              setValue("name", e.target.value, { shouldValidate: true });
            },
          }}
          validationConfig={{
            validators: [
              {
                validate: (value: string) => ({
                  state: value.trim() !== "" ? "success" : "error",
                  message:
                    value.trim() !== "" ? "" : "Character name is required",
                }),
              },
            ],
          }}
        />
        {errors.name && (
          <p className="text-sm text-red-500 px-px">{errors.name.message}</p>
        )}

        <ValidatedInput
          label="Description"
          value={watch("description") || ""}
          isTextarea
          textareaProps={{
            rows: 3,
            placeholder: "Describe this character...",
            disabled: isSubmitting,
            onChange: (e) => {
              setValue("description", e.target.value, { shouldValidate: true });
            },
          }}
        />

        <div className="space-y-2 px-px">
          <ColorPicker
            selectedColor={colorValue}
            onColorChange={(color) => setValue("color", color)}
            disabled={isSubmitting}
            label="Character Color"
          />
        </div>

        <FormActions
          actions={[
            {
              label: "Cancel",
              onClick: handleClose,
              variant: "outline",
              disabled: isSubmitting,
            },
            {
              label:
                mode === "create" ? "Create Character" : "Update Character",
              onClick: () => {}, // Form submission handled by onSubmit
              type: "submit",
              disabled: !isValid || isSubmitting,
              loading: isSubmitting,
              loadingText: mode === "create" ? "Creating..." : "Updating...",
              icon: mode === "create" ? Plus : undefined,
            },
          ]}
        />
      </form>
    </FormDialog>
  );
}

const CharacterDialogLoading = ({
  isOpen,
  onClose,
  mode,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
}) => {
  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Character" : "Edit Character"}
      description={
        mode === "create"
          ? "Add a new character to your campaign"
          : "Update character details"
      }
      icon={Users}
    >
      <div className="space-y-4">
        <div className="space-y-2 px-px">
          <Skeleton className="h-4 bg-muted rounded"/>
          <Skeleton className="h-9 bg-muted rounded"/>
        </div>
        <div className="space-y-2 px-px">
          <Skeleton className="h-4 bg-muted rounded"/>
          <Skeleton className="h-16 bg-muted rounded"/>
        </div>
        <div className="space-y-2 px-px">
          <Skeleton className="h-4 bg-muted rounded"/>
          <Skeleton className="h-10 bg-muted rounded"/>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Skeleton className="h-10 w-20 bg-muted rounded"/>
          <Skeleton className="h-10 w-32 bg-muted rounded"/>
        </div>
      </div>
    </FormDialog>
  );
};
