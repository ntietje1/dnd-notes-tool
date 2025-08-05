"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useConvex } from "convex/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import { UserCampaign } from "@/convex/campaigns/types";
import { FormDialog } from "@/components/ui/forms/form-dialog";
import { FormField } from "@/components/ui/forms/form-field";
import { FormActions } from "@/components/ui/forms/form-actions";
import { UrlPreview } from "@/components/ui/forms/url-preview";
import { AsyncValidatedInput } from "@/components/ui/forms/async-validated-input";
import { ValidatedInput } from "@/components/ui/forms/validated-input";
import { Plus, Sword, Link } from "lucide-react";
import { toast } from "sonner";
import { createCampaignSlugValidator, formatSlug, createCampaignNameValidators } from "@/lib/validators";

interface CampaignDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaign?: UserCampaign; // Required for edit mode
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
  campaign,
}: CampaignDialogProps) {
  const router = useRouter();
  const convex = useConvex();

  const userProfile = useQuery(api.users.queries.getUserProfile);
  const createCampaign = useMutation(api.campaigns.mutations.createCampaign);
  const updateCampaign = useMutation(api.campaigns.mutations.updateCampaign);

  const [isSlugValid, setIsSlugValid] = useState(false);
  const [slugError, setSlugError] = useState<string | undefined>();
  const [isNameValid, setIsNameValid] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid, isDirty }
  } = useForm<CampaignFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      slug: ""
    }
  });

  const slugValue = watch("slug");

  // Create async validator for slug
  const slugValidator = createCampaignSlugValidator(
    convex,
    mode === "edit" && campaign ? campaign._id : undefined
  );

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      const randomSlug = Math.random().toString(36).substring(2, 15);
      reset({
        name: "",
        description: "",
        slug: randomSlug
      });
    } else if (mode === "edit" && campaign) {
      reset({
        name: campaign.name,
        description: campaign.description || "",
        slug: campaign.campaignSlug.slug
      });
    }
  }, [mode, campaign, isOpen, reset]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen && isDirty) {
      reset({
        name: "",
        description: "",
        slug: ""
      }, {
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false
      });
    }
  }, [isOpen, isDirty, reset]);

  const onSubmit = async (data: CampaignFormData) => {
    // Prevent submission if validation failed
    if (!isSlugValid || slugError || !isNameValid || nameError) {
      return;
    }
    
    try {
      if (mode === "create") {
        const campaignId = await createCampaign({
          name: data.name.trim(),
          description: data.description.trim(),
          slug: data.slug.trim(),
        });

        toast.success("Campaign created successfully");
        onClose();

        // Redirect to the new campaign
        if (userProfile?.username) {
          router.push(
            `/campaigns/${userProfile.username}/${data.slug.trim()}/notes`,
          );
        }
      } else if (mode === "edit" && campaign) {
        await updateCampaign({
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
        reset({
          name: "",
          description: "",
          slug: ""
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "create" ? "Create New Campaign" : "Edit Campaign"}
      description={
        mode === "create"
          ? "Start a new D&D adventure and invite your party to join."
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
          placeholder="Enter campaign name"
          disabled={isSubmitting}
          validators={createCampaignNameValidators()}
          validateOnChange={true}
          errorDisplayDelay={600}
          onValidationChange={(result) => {
            setIsNameValid(result.state === "success");
            setNameError(result.state === "error" ? result.message : undefined);
          }}
          onChange={(e) => {
            setValue("name", e.target.value, { shouldValidate: true });
          }}
        />

        <div className="space-y-2 px-px">
          <label htmlFor="description" className="text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="A thrilling adventure in the Sword Coast..."
            disabled={isSubmitting}
            rows={3}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none min-w-0 focus:ring-offset-0"
          />
        </div>

        <AsyncValidatedInput
          label="Custom Link"
          leftIcon={<Link className="h-4 w-4" />}
          required
          value={slugValue}
          placeholder="campaign-link"
          disabled={isSubmitting}
          asyncValidator={slugValidator}
          asyncValidationOptions={{
            minLength: 3,
            debounceMs: 500,
            validateOnChange: true,
          }}
          errorDisplayDelay={500}
          onValidationChange={(isValid, error) => {
            setIsSlugValid(isValid);
            setSlugError(error);
          }}
          onChange={(e) => {
            const formatted = formatSlug(e.target.value);
            setValue("slug", formatted, { shouldValidate: true });
          }}
        />

        {mode === "create" && (
          <UrlPreview
            baseUrl={baseUrl || ""}
            path={`/campaigns/${userProfile?.username}/${slugValue}`}
          />
        )}

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
              disabled: !isValid || isSubmitting || !isSlugValid || !!slugError || !isNameValid || !!nameError,
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
