import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { api } from "convex/_generated/api";
import type { Location } from "convex/locations/types";
import { FormDialog } from "~/components/forms/form-dialog";
import { FormActions } from "~/components/forms/form-actions";
import { ValidatedInput } from "~/components/forms/validated-input";
import {
  ColorPicker,
  DEFAULT_COLORS,
} from "~/components/forms/color-picker";
import { Plus, MapPin } from "~/lib/icons";
import { toast } from "sonner";
import { useNotes } from "~/contexts/NotesContext";
import { useCampaign } from "~/contexts/CampaignContext";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { Skeleton } from "~/components/shadcn/ui/skeleton";

interface LocationDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  dmUsername: string;
  campaignSlug: string;
  location?: Location; // Required for edit mode
  navigateToNote?: boolean;
}

interface LocationFormData {
  name: string;
  description: string;
  color: string;
}

export default function LocationDialog({
  mode,
  isOpen,
  onClose,
  dmUsername,
  campaignSlug,
  location,
  navigateToNote = false,
}: LocationDialogProps) {
  const router = useRouter();

  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign
  const createLocation = useMutation({ mutationFn: useConvexMutation(api.locations.mutations.createLocation) });
  const updateLocation = useMutation({ mutationFn: useConvexMutation(api.locations.mutations.updateLocation) });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<LocationFormData>({
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
    } else if (mode === "edit" && location) {
      reset({
        name: location.name,
        description: location.description || "",
        color: location.color,
      });
    }
  }, [mode, location, isOpen, reset]);

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

  const onSubmit = async (data: LocationFormData) => {
    if (!campaign) {
      toast.error("Campaign not found");
      return;
    }

    try {
      if (mode === "create") {
        const result = await createLocation.mutateAsync({
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
          campaignId: campaign._id,
        });

        toast.success("Location created successfully");
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
      } else if (mode === "edit" && location) {
        await updateLocation.mutateAsync({
          locationId: location._id,
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          color: data.color,
        });

        toast.success("Location updated successfully");
        onClose();
      }
    } catch (_) {
      toast.error(`Failed to ${mode} location`);
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
      title={mode === "create" ? "Create New Location" : "Edit Location"}
      description={
        mode === "create"
          ? "Add a new location to your campaign. A tag will be automatically created for use in your notes."
          : "Update location details"
      }
      icon={MapPin}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ValidatedInput
          label="Name"
          required
          value={watch("name") || ""}
          inputProps={{
            placeholder: "Enter location name...",
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
                    value.trim() !== "" ? "" : "Location name is required",
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
            placeholder: "Describe this location...",
            disabled: isSubmitting,
            onChange: (e) => {
              setValue("description", e.target.value, { shouldValidate: true });
            },
          }}
        />

        <div className="space-y-2 px-px">
          <label className="text-sm font-medium">Color</label>
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

const LocationDialogLoading = ({
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
      title={mode === "create" ? "Create New Location" : "Edit Location"}
      description={
        mode === "create"
          ? "Add a new location to your campaign. A tag will be automatically created for use in your notes."
          : "Update location details"
      }
      icon={MapPin}
    >
      <div className="space-y-4">
        <div className="space-y-2 px-px">
          <Skeleton className="h-4 bg-muted rounded"/>
          <Skeleton className="h-9 bg-muted rounded"/>
        </div>
        <div className="space-y-2 px-px">
          <Skeleton className="h-4 bg-muted rounded"/>
          <Skeleton className="h-20 bg-muted rounded"/>
        </div>
        <div className="space-y-2 px-px">
          <Skeleton className="h-4 bg-muted rounded"/>
          <Skeleton className="h-10 bg-muted rounded"/>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Skeleton className="h-10 w-20 bg-muted rounded"/>
          <Skeleton className="h-10 w-28 bg-muted rounded"/>
        </div>
      </div>
    </FormDialog>
  );
};
