"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CharacterWithTag } from "@/convex/characters/types";
import { FormDialog } from "@/components/ui/forms/form-dialog";
import { FormField } from "@/components/ui/forms/form-field";
import { FormActions } from "@/components/ui/forms/form-actions";
import { ColorPicker, DEFAULT_COLORS } from "@/components/ui/forms/color-picker";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";

interface CharacterDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaignId?: Id<"campaigns">; // Required for create mode
  character?: CharacterWithTag; // Required for edit mode
}

export function CharacterDialog({ mode, isOpen, onClose, campaignId, character }: CharacterDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  const createCharacter = useMutation(api.characters.mutations.createCharacter);
  const updateCharacter = useMutation(api.characters.mutations.updateCharacter);

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      setName("");
      setDescription("");
      setColor(DEFAULT_COLORS[0]);
    } else if (mode === "edit" && character) {
      setName(character.name);
      setDescription(character.description || "");
      setColor(character.color);
    }
  }, [mode, character, isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Character name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create" && campaignId) {
        await createCharacter({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          campaignId,
        });

        toast.success("Character created successfully");
        setName("");
        setDescription("");
        setColor(DEFAULT_COLORS[0]);
      } else if (mode === "edit" && character) {
        await updateCharacter({
          characterId: character._id,
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        });

        toast.success("Character updated successfully");
      }

      onClose();
    } catch (error) {
      console.error(`Failed to ${mode} character:`, error);
      toast.error(`Failed to ${mode} character`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      if (mode === "create") {
        setName("");
        setDescription("");
        setColor(DEFAULT_COLORS[0]);
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
      <div className="space-y-4">
        <FormField
          type="text"
          label="Character Name"
          value={name}
          onChange={setName}
          placeholder="Enter character name..."
          disabled={isSubmitting}
          required
        />

        <FormField
          type="textarea"
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Describe this character..."
          disabled={isSubmitting}
        />

        <ColorPicker
          selectedColor={color}
          onColorChange={setColor}
          disabled={isSubmitting}
          label="Character Color"
        />

        <FormActions
          actions={[
            {
              type: "submit",
              label: mode === "create" ? "Create Character" : "Update Character",
              onClick: handleSubmit,
              disabled: isSubmitting,
              loading: isSubmitting,
              icon: mode === "create" ? Plus : undefined,
            },
            {
              type: "button",
              variant: "outline",
              label: "Cancel",
              onClick: handleClose,
              disabled: isSubmitting
            }
          ]}
        />
      </div>
    </FormDialog>
  );
} 