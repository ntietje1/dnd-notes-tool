"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Sword, Link, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ValidatedInput } from "@/components/ui/validated-input";
import { campaignNameValidators, linkValidators } from "./validators";
import type { ValidationResult } from "@/lib/validation";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

const defaultFormData = {
  name: "",
  description: "",
  customLink: Math.random().toString(36).substring(2, 15),
};

// Separate card component for creating a new campaign
export function CreateCampaignCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="border-2 border-dashed border-amber-300 hover:border-amber-400 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg"
    >
      <CardContent className="flex flex-col items-center justify-center h-64 text-center">
        <div className="p-4 bg-amber-100 rounded-full mb-4 group-hover:bg-amber-200 transition-colors">
          <Plus className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Create New Campaign
        </h3>
        <p className="text-slate-600">Start a new adventure with your party</p>
      </CardContent>
    </Card>
  );
}

export default function CreateCampaignDialog() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [validationStates, setValidationStates] = useState<
    Record<string, ValidationResult>
  >({});

  const userProfile = useQuery(api.users.queries.getUserProfile);
  const createCampaign = useMutation(api.campaigns.mutations.createCampaign);
  const slugExists = useQuery(api.campaigns.queries.checkCampaignSlugExists, {
    slug: formData.customLink,
  });

  // Listen for custom events to open the dialog
  useEffect(() => {
    const handleOpenDialog = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener("openCreateCampaign", handleOpenDialog);
    return () => {
      window.removeEventListener("openCreateCampaign", handleOpenDialog);
    };
  }, []);

  const handleInputChange = (
    field: string,
    value: string | number | File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleValidationChange =
    (field: string) => (result: ValidationResult) => {
      setValidationStates((prev) => ({ ...prev, [field]: result }));
    };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const campaignId = await createCampaign({
        name: formData.name,
        description: formData.description,
        slug: formData.customLink,
      });

      setIsCreateModalOpen(false);
      setFormData(defaultFormData);

      // Redirect to the new campaign with the new URL structure
      if (userProfile?.username) {
        router.push(
          `/campaigns/${userProfile.username}/${formData.customLink}/notes`,
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if required fields are empty
  const areRequiredFieldsEmpty = () => {
    return !formData.name.trim() || !formData.customLink.trim();
  };

  // Check if form is valid (no validation errors and no required fields empty)
  const isFormValid = () => {
    if (areRequiredFieldsEmpty()) {
      return false;
    }

    // Check if any validation has failed
    const hasErrors = Object.values(validationStates).some(
      (state) => state.state === "error",
    );

    return !hasErrors;
  };

  // Run validation on form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if required fields are empty
    if (areRequiredFieldsEmpty()) {
      return;
    }

    // Check if form is valid
    if (!isFormValid()) {
      return;
    }

    handleCreateCampaign(e);
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-amber-600" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            Start a new D&D adventure and invite your party to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <ValidatedInput
              label="Campaign Name"
              placeholder="Enter campaign name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              validators={campaignNameValidators}
              onValidationChange={handleValidationChange("name")}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              placeholder="A thrilling adventure in the Sword Coast..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <ValidatedInput
              label="Custom Link"
              placeholder="campaign-link"
              value={formData.customLink}
              onChange={(e) => handleInputChange("customLink", e.target.value)}
              validators={linkValidators(slugExists ?? false)}
              onValidationChange={handleValidationChange("customLink")}
              icon={<Link className="h-4 w-4" />}
              required
            />
            <p className="text-xs text-gray-500 flex flex-col gap-1">
              <span className="font-medium">
                Your campaign will be available at:
              </span>
              <span className="font-mono">
                {baseUrl}/campaigns/{userProfile?.username}/
                {formData.customLink}
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
