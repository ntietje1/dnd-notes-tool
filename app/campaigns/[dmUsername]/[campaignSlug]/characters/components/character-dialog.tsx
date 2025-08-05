"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CharacterWithTag } from "@/convex/characters/types";
import { FormDialog } from "@/components/ui/forms/form-dialog";
import { FormActions } from "@/components/ui/forms/form-actions";
import { ColorPicker, DEFAULT_COLORS } from "@/components/ui/forms/color-picker";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNotes } from "@/contexts/NotesContext";

interface CharacterDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaignId?: Id<"campaigns">; // Required for create mode
  character?: CharacterWithTag; // Required for edit mode
  navigateToNote?: boolean; // Whether to navigate to the character's note page after creation
}

interface CharacterFormData {
  name: string;
  description: string;
  color: string;
}

export function CharacterDialog({ mode, isOpen, onClose, campaignId, character, navigateToNote = false }: CharacterDialogProps) {
  const createCharacter = useMutation(api.characters.mutations.createCharacter);
  const updateCharacter = useMutation(api.characters.mutations.updateCharacter);
  const { selectNote } = useNotes();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty }
  } = useForm<CharacterFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      color: DEFAULT_COLORS[0]
    }
  });

  const colorValue = watch("color");

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      reset({
        name: "",
        description: "",
        color: DEFAULT_COLORS[0]
      });
    } else if (mode === "edit" && character) {
      reset({
        name: character.name,
        description: character.description || "",
        color: character.color
      });
    }
  }, [mode, character, isOpen, reset]);

  const onSubmit = async (data: CharacterFormData) => {
    try {
      if (mode === "create" && campaignId) {
        const result = await createCharacter({
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
          campaignId,
        });

        toast.success("Character created successfully");
        
        // Navigate to the character's note page if requested
        if (navigateToNote && result.noteId) {
          selectNote(result.noteId);
        }
        
        // Clear form for next creation
        reset({
          name: "",
          description: "",
          color: DEFAULT_COLORS[0]
        }, {
          keepErrors: false,
          keepDirty: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false
        });
      } else if (mode === "edit" && character) {
        await updateCharacter({
          characterId: character._id,
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
        });

        toast.success("Character updated successfully");
      }

      onClose();
    } catch (error) {
      console.error(`Failed to ${mode} character:`, error);
      toast.error(`Failed to ${mode} character`);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Ensure form is completely reset before closing
      if (isDirty) {
        reset({
          name: "",
          description: "",
          color: DEFAULT_COLORS[0]
        }, {
          keepErrors: false,
          keepDirty: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false
        });
      }
      onClose();
    }
  };

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
        <div className="space-y-2 px-px">
          <label htmlFor="name" className="text-sm font-medium">
            Character Name <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="name"
            {...register("name", {
              required: "Character name is required",
              validate: (value) => value.trim() !== "" || "Character name is required"
            })}
            placeholder="Enter character name..."
            disabled={isSubmitting}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 break-all min-w-0 focus:ring-offset-0"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2 px-px">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="Describe this character..."
            disabled={isSubmitting}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none min-w-0 focus:ring-offset-0"
          />
        </div>

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
              label: mode === "create" ? "Create Character" : "Update Character",
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