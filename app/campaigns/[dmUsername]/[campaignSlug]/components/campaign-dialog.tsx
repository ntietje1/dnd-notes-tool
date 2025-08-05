"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { UserCampaign } from "@/convex/campaigns/types";
import { FormDialog } from "@/components/ui/forms/form-dialog";
import { FormField } from "@/components/ui/forms/form-field";
import { FormActions } from "@/components/ui/forms/form-actions";
import { UrlPreview } from "@/components/ui/forms/url-preview";
import { Plus, Sword, Link } from "lucide-react";
import { campaignNameValidators, linkValidators } from "./validators";
import type { ValidationResult } from "@/lib/validation";
import { toast } from "sonner";

interface CampaignDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  campaign?: UserCampaign; // Required for edit mode
}

export function CampaignDialog({
  mode,
  isOpen,
  onClose,
  campaign,
}: CampaignDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");

  const [validationStates, setValidationStates] = useState<
    Record<string, ValidationResult>
  >({});

  const userProfile = useQuery(api.users.queries.getUserProfile);
  const createCampaign = useMutation(api.campaigns.mutations.createCampaign);
  const updateCampaign = useMutation(api.campaigns.mutations.updateCampaign);
  const slugExists = useQuery(api.campaigns.queries.checkCampaignSlugExists, {
    slug: slug,
  });

  // Initialize form data
  useEffect(() => {
    if (mode === "create") {
      const randomSlug = Math.random().toString(36).substring(2, 15);
      setName("");
      setDescription("");
      setSlug(randomSlug);
    } else if (mode === "edit" && campaign) {
      setName(campaign.name);
      setDescription(campaign.description || "");
      setSlug(campaign.campaignSlug.slug);
    }
  }, [mode, campaign, isOpen]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setValidationStates({});
    }
  }, [isOpen]);

  const handleValidationChange =
    (field: string) => (result: ValidationResult) => {
      setValidationStates((prev) => ({ ...prev, [field]: result }));
    };

  const isFormValid = () => {
    if (!name.trim() || !slug.trim()) {
      return false;
    }

    const hasErrors = Object.values(validationStates).some(
      (state) => state.state === "error",
    );

    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const campaignId = await createCampaign({
          name: name.trim(),
          description: description.trim(),
          slug: slug.trim(),
        });

        toast.success("Campaign created successfully");
        onClose();

        // Redirect to the new campaign
        if (userProfile?.username) {
          router.push(
            `/campaigns/${userProfile.username}/${slug.trim()}/notes`,
          );
        }
      } else if (mode === "edit" && campaign) {
        await updateCampaign({
          campaignId: campaign._id,
          name: name.trim(),
          description: description.trim() || undefined,
          slug: slug.trim(),
        });

        toast.success("Campaign updated successfully");
        onClose();
      }
    } catch (error) {
      console.error("Failed to save campaign:", error);
      toast.error(`Failed to ${mode} campaign`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          type="text"
          label="Campaign Name"
          value={name}
          onChange={setName}
          placeholder="Enter campaign name"
          validators={campaignNameValidators}
          onValidationChange={handleValidationChange("name")}
          disabled={isSubmitting}
          required
        />

        <FormField
          type="textarea"
          label="Description (Optional)"
          value={description}
          onChange={setDescription}
          placeholder="A thrilling adventure in the Sword Coast..."
          disabled={isSubmitting}
          rows={3}
        />

        <FormField
          type="text"
          label="Custom Link"
          value={slug}
          onChange={setSlug}
          placeholder="campaign-link"
          validators={linkValidators(slugExists ?? false)}
          onValidationChange={handleValidationChange("customLink")}
          icon={<Link className="h-4 w-4" />}
          disabled={isSubmitting}
          required
        />

        {mode === "create" && (
          <UrlPreview
            baseUrl={baseUrl || ""}
            path={`/campaigns/${userProfile?.username}/${slug}`}
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
              disabled: !isFormValid() || isSubmitting,
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
