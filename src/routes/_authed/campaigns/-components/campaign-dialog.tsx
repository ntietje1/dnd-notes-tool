import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import type { CampaignWithMembership } from "convex/campaigns/types";
import { api } from "convex/_generated/api";
import { FormActions } from "~/components/forms/form-actions";
import { UrlPreview } from "~/routes/_authed/campaigns/-components/url-preview";
import { Input } from "~/components/shadcn/ui/input";
import { Label } from "~/components/shadcn/ui/label";
import { Plus, Sword, Link } from "~/lib/icons";
import { toast } from "sonner";
import { convexQuery, useConvex, useConvexMutation } from "@convex-dev/react-query";
import { FormDialog } from "~/components/forms/form-dialog";
import {
  removeInvalidCharacters,
  validateCampaignName,
  validateCampaignSlugSync,
  validateCampaignSlugAsync,
} from "./campaign-form-validators";

interface CampaignDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaignWithMembership?: CampaignWithMembership; // Required for edit mode
}

// Using inferred form data shape from defaultValues

export function CampaignDialog({
  mode,
  isOpen,
  onClose,
  campaignWithMembership,
}: CampaignDialogProps) {
  const convex = useConvex();
  const userProfile = useQuery(convexQuery(api.users.queries.getUserProfile, {}));
  const createCampaign = useMutation({mutationFn: useConvexMutation(api.campaigns.mutations.createCampaign)});
  const updateCampaign = useMutation({mutationFn: useConvexMutation(api.campaigns.mutations.updateCampaign)});

  const campaign = campaignWithMembership?.campaign;

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    },
    onSubmit: async ({ value }) => {
      // Prevent submission if validation failed
      try {
        if (mode === "create") {
          await createCampaign.mutateAsync({
            name: value.name.trim(),
            description: value.description.trim(),
            slug: value.slug.trim(),
          });

          toast.success("Campaign created successfully");
          onClose();
        } else if (mode === "edit" && campaign) {
          await updateCampaign.mutateAsync({
            campaignId: campaign._id,
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            slug: value.slug.trim(),
          });

          toast.success("Campaign updated successfully");
          onClose();
        }
      } catch (error) {
        console.error("Failed to save campaign:", error);
        toast.error(`Failed to ${mode} campaign`);
      }
    },
  });

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      const randomSlug = Math.random().toString(36).substring(2, 15);
      form.reset({
        name: "",
        description: "",
        slug: randomSlug,
      });
    } else if (mode === "edit" && campaign) {
      form.reset({
        name: campaign.name,
        description: campaign.description || "",
        slug: campaign.slug,
      });
    }
  }, [mode, campaign, isOpen, form]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen && form.state.isDirty) {
      form.reset({
        name: "",
        description: "",
        slug: "",
      });
    }
  }, [isOpen, form.state.isDirty, form]);

  const handleClose = () => {
    if (!form.state.isSubmitting) {
      if (form.state.isDirty) {
        form.reset({
          name: "",
          description: "",
          slug: "",
        });
      }
      onClose();
    }
  };


  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "create" ? "Create New Campaign" : "Edit Campaign"}
      description={
        mode === "create"
          ? "Start a new TTRPG adventure and invite your party to join."
          : "Update campaign details"
      }
      icon={Sword}
      maxWidth="max-w-lg"
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
              onBlur: ({ value }) => validateCampaignName(value),
            }}
          >
            {(field) => (
              <div className="space-y-2 px-px">
                <Label>Campaign Name</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter campaign name"
                  disabled={form.state.isSubmitting}
                  required
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
                <Label>Description</Label>
                <textarea
                  rows={3}
                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="A thrilling adventure in the Sword Coast..."
                  disabled={form.state.isSubmitting}
                />
              </div>
            )}
          </form.Field>

          <form.Field
            name="slug"
            validators={{
              onChange: () => undefined,
              onBlur: ({ value }) => validateCampaignSlugSync(value),
              onBlurAsync: async ({ value }) => {
                const trimmed = value.trim();
                const normalized = removeInvalidCharacters(trimmed);
                if (validateCampaignSlugSync(normalized)) return undefined;
                return validateCampaignSlugAsync(
                  convex,
                  normalized,
                  mode === "edit" && campaign ? campaign._id : undefined,
                );
              },
              onBlurAsyncDebounceMs: 300,
            }}
          >
            {(field) => (
              <div className="space-y-2 px-px">
                <Label className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Custom Link
                </Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="campaign-link"
                  minLength={3}
                  maxLength={30}
                  disabled={form.state.isSubmitting}
                  required
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                ) : null}

                <UrlPreview
                  url={`${window.location.origin}/join/${userProfile.data?.username}/${field.state.value}`}
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
                label: mode === "create" ? "Create Campaign" : "Update Campaign",
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
