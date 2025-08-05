"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LocationWithTag } from "@/convex/locations/types";
import { FormDialog } from "@/components/ui/forms/form-dialog";
import { FormActions } from "@/components/ui/forms/form-actions";
import { ColorPicker, DEFAULT_COLORS } from "@/components/ui/forms/color-picker";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNotes } from "@/contexts/NotesContext";

interface LocationDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaignId?: Id<"campaigns">; // Required for create mode
  location?: LocationWithTag; // Required for edit mode
  navigateToNote?: boolean; // Whether to navigate to the location's note page after creation
}

interface LocationFormData {
  name: string;
  description: string;
  color: string;
}

export function LocationDialog({ mode, isOpen, onClose, campaignId, location, navigateToNote = false }: LocationDialogProps) {
  const createLocation = useMutation(api.locations.mutations.createLocation);
  const updateLocation = useMutation(api.locations.mutations.updateLocation);
  const { selectNote } = useNotes();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty }
  } = useForm<LocationFormData>({
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
    } else if (mode === "edit" && location) {
      reset({
        name: location.name,
        description: location.description || "",
        color: location.color
      });
    }
  }, [mode, location, isOpen, reset]);

  const onSubmit = async (data: LocationFormData) => {
    try {
      if (mode === "create" && campaignId) {
        const result = await createLocation({
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
          campaignId,
        });

        toast.success("Location created successfully");
        
        // Navigate to the location's note page if requested
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
      } else if (mode === "edit" && location) {
        await updateLocation({
          locationId: location._id,
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
        });

        toast.success("Location updated successfully");
      }

      onClose();
    } catch (error) {
      console.error(`Failed to ${mode} location:`, error);
      toast.error(`Failed to ${mode} location`);
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
      title={mode === "create" ? "Create New Location" : "Edit Location"}
      description={
        mode === "create"
          ? "Add a new location to your campaign. A tag will be automatically created for use in your notes."
          : "Update location details"
      }
      icon={MapPin}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 px-px">
          <label htmlFor="name" className="text-sm font-medium">
            Name <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="name"
            {...register("name", {
              required: "Location name is required",
              validate: (value) => value.trim() !== "" || "Location name is required"
            })}
            placeholder="Enter location name..."
            disabled={isSubmitting}
            maxLength={100}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 break-all min-w-0 focus:ring-offset-0"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2 px-px">
          <label htmlFor="description" className="text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="Optional description..."
            disabled={isSubmitting}
            maxLength={500}
            rows={3}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none min-w-0 focus:ring-offset-0"
          />
        </div>

        <div className="space-y-2 px-px">
          <label className="text-sm font-medium">
            Color
          </label>
          <ColorPicker
            selectedColor={colorValue}
            onColorChange={(color) => setValue("color", color)}
            disabled={isSubmitting}
            label=""
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
              label: mode === "create" ? "Create Location" : "Update Location",
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