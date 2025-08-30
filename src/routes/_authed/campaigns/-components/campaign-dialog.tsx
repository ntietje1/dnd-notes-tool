import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { CampaignWithMembership } from "convex/campaigns/types";
import { api } from "convex/_generated/api";
import { FormActions } from "~/components/forms/form-actions";
import { UrlPreview } from "~/components/forms/url-preview";
import { AsyncValidatedInput } from "~/components/forms/async-validated-input";
import { ValidatedInput } from "~/components/forms/validated-input";
import { Plus, Sword, Link } from "~/lib/icons";
import { toast } from "sonner";
import { convexQuery, useConvex, useConvexMutation } from "@convex-dev/react-query";
import { FormDialog } from "~/components/forms/form-dialog";
import { createCampaignSlugValidator } from "./campaign-slug-validator";
import { createCampaignNameValidators } from "./campaign-name-validator";

interface CampaignDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaignWithMembership?: CampaignWithMembership; // Required for edit mode
}

interface CampaignFormData {
  name: string;
  description: string;
  slug: string;
}

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

  const [isSlugValid, setIsSlugValid] = useState(false);
  const [isNameValid, setIsNameValid] = useState(false);

  const campaign = campaignWithMembership?.campaign;

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting, isValid, isDirty },
  } = useForm<CampaignFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    },
  });

  const slugValue = watch("slug");

  // Create async validator for slug
  const slugValidator = createCampaignSlugValidator(
    convex,
    mode === "edit" && campaign ? campaign._id : undefined,
  );

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      const randomSlug = Math.random().toString(36).substring(2, 15);
      reset({
        name: "",
        description: "",
        slug: randomSlug,
      });
    } else if (mode === "edit" && campaign) {
      reset({
        name: campaign.name,
        description: campaign.description || "",
        slug: campaign.slug,
      });
    }
  }, [mode, campaign, isOpen, reset]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen && isDirty) {
      reset(
        {
          name: "",
          description: "",
          slug: "",
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

  const onSubmit = async (data: CampaignFormData) => {
    // Prevent submission if validation failed
    if (!isSlugValid || !isNameValid) {
      return;
    }

    try {
      if (mode === "create") {
        await createCampaign.mutateAsync({
          name: data.name.trim(),
          description: data.description.trim(),
          slug: data.slug.trim(),
        });

        toast.success("Campaign created successfully");
        onClose();
      } else if (mode === "edit" && campaign) {
        await updateCampaign.mutateAsync({
          campaignId: campaign._id,
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          slug: data.slug.trim(),
        });

        toast.success("Campaign updated successfully");
        onClose();
      }
    } catch (error) {
      console.error("Failed to save campaign:", error);
      toast.error(`Failed to ${mode} campaign`);
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
            slug: "",
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ValidatedInput
          label="Campaign Name"
          required
          value={watch("name") || ""}
          inputProps={{
            placeholder: "Enter campaign name",
            disabled: isSubmitting,
            onChange: (e) => {
              setValue("name", e.target.value, { shouldValidate: true });
            },
          }}
          validationConfig={{
            validators: createCampaignNameValidators(),
            validateOnChange: true,
            errorDisplayDelay: 600,
            onStatusChange: ({ state }) => setIsNameValid(state === "success"),
          }}
        />

        <ValidatedInput
          label="Description"
          value={watch("description") || ""}
          isTextarea
          textareaProps={{
            rows: 3,
            placeholder: "A thrilling adventure in the Sword Coast...",
            disabled: isSubmitting,
            onChange: (e) => {
              setValue("description", e.target.value, { shouldValidate: true });
            },
          }}
        />

        <AsyncValidatedInput
          label="Custom Link"
          leftIcon={<Link className="h-4 w-4" />}
          required
          value={slugValue}
          inputProps={{
            placeholder: "campaign-link",
            minLength: 3,
            maxLength: 30,
            disabled: isSubmitting,
            onChange: (e) => {
              setValue("slug", e.target.value, { shouldValidate: true });
            },
          }}
          validationConfig={{
            asyncValidators: [slugValidator],
            asyncValidationOptions: {
              minLength: 3,
              debounceMs: 300,
              validateOnChange: false,
              initialValue: mode === "edit" ? campaign?.slug : undefined,
              skipWhenEqualToInitial: true,
            },
            errorDisplayDelay: 0,
            showCheckingMessage: false,
            onStatusChange: ({ state }) => setIsSlugValid(state === "success"),
          }}
        />

        
        <UrlPreview
          baseUrl={window.location.origin}
          path={`/campaigns/${userProfile.data?.username}/${slugValue}`}
        />
        

        <FormActions
          actions={[
            {
              label: "Cancel",
              onClick: handleClose,
              variant: "outline",
              disabled: isSubmitting,
            },
            {
              label: mode === "create" ? "Create Campaign" : "Update Campaign",
              onClick: () => {}, // Form submission handled by onSubmit
              type: "submit",
              disabled:
                !isValid || isSubmitting || !isSlugValid || !isNameValid,
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
