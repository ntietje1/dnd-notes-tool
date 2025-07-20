"use client";

import React, { useState } from "react";
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
import {
  campaignNameValidators,
  linkValidators,
} from "./validators";
import type { ValidationResult } from "@/lib/validation";

interface CreateCampaignDialogProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  handleCreateCampaign: (e: React.FormEvent) => void;
  formData: {
    name: string;
    description: string;
    customLink: string;
  };
  handleInputChange: (
    field: string,
    value: string | number | File | null,
  ) => void;
  isLoading: boolean;
  dmUsername: string | undefined;
  slugExists: boolean;
}

// Separate card component for creating a new campaign
export function CreateCampaignCard({ onClick }: { onClick: () => void }) {
  return (
    <Card onClick={onClick} className="border-2 border-dashed border-amber-300 hover:border-amber-400 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg">
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

export default function CreateCampaignDialog({
  isCreateModalOpen,
  setIsCreateModalOpen,
  handleCreateCampaign,
  formData,
  handleInputChange,
  isLoading,
  dmUsername,
  slugExists,
}: CreateCampaignDialogProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [validationStates, setValidationStates] = useState<
    Record<string, ValidationResult>
  >({});

  const handleValidationChange =
    (field: string) => (result: ValidationResult) => {
      setValidationStates((prev) => ({ ...prev, [field]: result }));
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
      (state) => state.state === "error"
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
    
    // Check if there are any validation errors
    const hasErrors = Object.values(validationStates).some(
      (state) => state.state === "error"
    );
    
    if (!hasErrors) {
      // Only proceed with form submission if no errors
      handleCreateCampaign(e);
    }
  };

  const shouldShowLinkPreview = validationStates.customLink?.state !== "error" && dmUsername;
  const previewUrl = `${baseUrl}/${dmUsername}/${formData.customLink}/join`;

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="max-h-screen">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-amber-600" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            Set up a new D&D campaign to share with your players.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <ValidatedInput
            label="Campaign Name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="The Lost Mines of Phandelver"
            validators={campaignNameValidators}
            onValidationChange={handleValidationChange("name")}
            required
          />

          <div className="space-y-2">
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="A thrilling adventure in the Sword Coast..."
              rows={3}
            />
          </div>

          <ValidatedInput
            label="Campaign Link"
            value={formData.customLink}
            onChange={(e) => handleInputChange("customLink", e.target.value)}
            placeholder="my-awesome-campaign"
            validators={linkValidators(slugExists)}
            onValidationChange={handleValidationChange("customLink")}
            helperText="This can't be changed later!"
            required
            icon={<Link className="h-4 w-4" />}
          />

          <div className="p-3 bg-slate-50 rounded-md border">
            <p className="text-sm text-slate-600 mb-2">Players will join at:</p>
            <div className="bg-white p-2 rounded border break-all h-10">
              <code className="text-sm text-amber-700 font-mono">
                {shouldShowLinkPreview ? previewUrl : ""}
              </code>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-500">
              Additional settings and customization options will be available after creating your campaign.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
