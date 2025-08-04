"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LocationWithTag } from "@/convex/locations/types";
import { FormDialog } from "@/components/ui/forms/form-dialog";
import { FormField } from "@/components/ui/forms/form-field";
import { FormActions } from "@/components/ui/forms/form-actions";
import { ColorPicker, DEFAULT_COLORS } from "@/components/ui/forms/color-picker";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

interface LocationDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaignId?: Id<"campaigns">; // Required for create mode
  location?: LocationWithTag; // Required for edit mode
}

export function LocationDialog({ mode, isOpen, onClose, campaignId, location }: LocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  const createLocation = useMutation(api.locations.mutations.createLocation);
  const updateLocation = useMutation(api.locations.mutations.updateLocation);

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      setName("");
      setDescription("");
      setColor(DEFAULT_COLORS[0]);
    } else if (mode === "edit" && location) {
      setName(location.name);
      setDescription(location.description || "");
      setColor(location.color);
    }
  }, [mode, location, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Location name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create" && campaignId) {
        await createLocation({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          campaignId,
        });

        toast.success("Location created successfully");
        setName("");
        setDescription("");
        setColor(DEFAULT_COLORS[0]);
      } else if (mode === "edit" && location) {
        await updateLocation({
          locationId: location._id,
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        });

        toast.success("Location updated successfully");
      }

      onClose();
    } catch (error) {
      console.error(`Failed to ${mode} location:`, error);
      toast.error(`Failed to ${mode} location`);
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

  const content = mode === "create" ? (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        type="text"
        label="Name"
        value={name}
        onChange={setName}
        placeholder="Enter location name..."
        disabled={isSubmitting}
        maxLength={100}
        required
      />

      <FormField
        type="textarea"
        label="Description (Optional)"
        value={description}
        onChange={setDescription}
        placeholder="Optional description..."
        disabled={isSubmitting}
        maxLength={500}
        rows={3}
      />

      <FormField
        type="custom"
        label="Color"
      >
        <ColorPicker
          selectedColor={color}
          onColorChange={setColor}
          disabled={isSubmitting}
          label=""
        />
      </FormField>

      <FormActions
        actions={[
          {
            label: "Cancel",
            onClick: handleClose,
            variant: "outline",
            disabled: isSubmitting,
          },
          {
            label: "Create Location",
            onClick: () => {}, // Form submission handled by onSubmit
            type: "submit",
            disabled: isSubmitting || !name.trim(),
            loading: isSubmitting,
            loadingText: "Creating...",
            icon: Plus,
          },
        ]}
      />
    </form>
  ) : (
    <div className="space-y-4">
      <FormField
        type="text"
        label="Location Name"
        value={name}
        onChange={setName}
        placeholder="Enter location name..."
        disabled={isSubmitting}
        required
      />

      <FormField
        type="textarea"
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Describe this location..."
        disabled={isSubmitting}
      />

      <ColorPicker
        selectedColor={color}
        onColorChange={setColor}
        disabled={isSubmitting}
        label="Location Color"
      />

      <FormActions
        actions={[
          {
            type: "submit",
            label: "Update Location",
            onClick: handleSubmit,
            disabled: isSubmitting,
            loading: isSubmitting
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
  );

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "create" ? "Create New Location" : "Edit Location"}
      description={
        mode === "create"
          ? "Add a new location to your campaign. A tag will be automatically created for use in your notes."
          : "Update location details"
      }
      icon={MapPin}
    >
      {content}
    </FormDialog>
  );
} 