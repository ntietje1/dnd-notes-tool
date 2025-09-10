import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { api } from "convex/_generated/api";
import type { Location } from "convex/locations/types";
import { FormDialog } from "~/components/forms/form-dialog";
import { FormActions } from "~/components/forms/form-actions";
import {
  ColorPicker,
  DEFAULT_COLORS,
} from "~/components/forms/color-picker";
import { Plus, MapPin } from "~/lib/icons";
import { toast } from "sonner";
import { useCampaign } from "~/contexts/CampaignContext";
import { useMutation } from "@tanstack/react-query";
import { useConvex, useConvexMutation } from "@convex-dev/react-query";
import { Input } from "~/components/shadcn/ui/input";
import { Label } from "~/components/shadcn/ui/label";
import { validateLocationName, validateLocationNameAsync } from "./location-form-validators";

const DEFAULT_LOCATION_FORM_VALUES: { name: string; description: string; color: string } = {
  name: "",
  description: "",
  color: DEFAULT_COLORS[0]
}

interface LocationDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  dmUsername: string;
  campaignSlug: string;
  location?: Location; // Required for edit mode
  navigateToNote?: boolean;
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
  const convex = useConvex();
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign
  const createLocation = useMutation({ mutationFn: useConvexMutation(api.locations.mutations.createLocation) });
  const updateLocation = useMutation({ mutationFn: useConvexMutation(api.locations.mutations.updateLocation) });

  const form = useForm({
    defaultValues: { ...DEFAULT_LOCATION_FORM_VALUES },
    onSubmit: async ({ value }) => {
      if (!campaign) {
        toast.error("Campaign not found");
        return;
      }

      try {
        if (mode === "create") {
          const result = await createLocation.mutateAsync({
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            color: value.color,
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
            locationId: location.locationId,
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            color: value.color,
          });

          toast.success("Location updated successfully");
          onClose();
        }
      } catch (_) {
        toast.error(`Failed to ${mode} location`);
      }
    },
  });

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      form.reset({
        ...DEFAULT_LOCATION_FORM_VALUES,
      });
    } else if (mode === "edit" && location) {
      form.reset({
        name: location.name,
        description: location.description || "",
        color: location.color,
      });
    }
  }, [mode, location, isOpen]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen && form.state.isDirty) {
      form.reset({
        ...DEFAULT_LOCATION_FORM_VALUES,
      });
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
      title={mode === "create" ? "Create New Location" : "Edit Location"}
      description={
        mode === "create"
          ? "Add a new location to your campaign. A tag will be automatically created for use in your notes."
          : "Update location details"
      }
      icon={MapPin}
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
              onBlur: ({ value }) => validateLocationName(value),
              onChangeAsync: async ({ value }) => {
                if (!campaign) return undefined;
                return validateLocationNameAsync(
                  convex,
                  campaign._id,
                  value,
                  mode === "edit" && location ? location._id : undefined,
                );
              },
              onChangeAsyncDebounceMs: 300,
            }}
          >
            {(field) => (
              <div className="space-y-2 px-px">
                <Label htmlFor="location-name">Name</Label>
                <Input
                  id="location-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter location name..."
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
                <Label htmlFor="location-description">Description</Label>
                <textarea
                  id="location-description"
                  rows={3}
                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Describe this location..."
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
                  label="Location Color"
                  aria-labelledby="color-picker-label"
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
                label: mode === "create" ? "Create Location" : "Update Location",
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
