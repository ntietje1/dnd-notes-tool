"use client";

import type React from "react";
import { useState } from "react";
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
  playerCountValidators,
  customLinkValidators,
} from "./validators";
import type { ValidationResult } from "@/lib/validation";

interface CreateCampaignDialogProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  handleCreateCampaign: (e: React.FormEvent) => void;
  formData: {
    name: string;
    description: string;
    playerCount: number;
    artwork: File | null;
    customLink: string;
  };
  handleInputChange: (
    field: string,
    value: string | number | File | null,
  ) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  checkTokenExists: (token: string) => Promise<boolean>;
}

// Separate card component for creating a new campaign
export function CreateCampaignCard({ onClick }: { onClick: () => void }) {
  return (
    <Card className="border-2 border-dashed border-amber-300 hover:border-amber-400 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg">
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
  handleFileUpload,
  isLoading,
  checkTokenExists,
}: CreateCampaignDialogProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [validationStates, setValidationStates] = useState<
    Record<string, ValidationResult>
  >({});

  const handleValidationChange =
    (field: string) => (result: ValidationResult) => {
      setValidationStates((prev) => ({ ...prev, [field]: result }));
    };

  const isFormValid = () => {
    return Object.values(validationStates).every(
      (state) => state.state === "success" || state.state === "none",
    );
  };

  const shouldShowLinkPreview = validationStates.customLink?.state !== "error";
  const previewUrl = `${baseUrl}/join/${formData.customLink}`;

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-amber-600" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            Set up a new D&D campaign to share with your players.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateCampaign} className="space-y-6">
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
            label="Number of Players"
            type="text"
            inputMode="numeric"
            value={formData.playerCount}
            onChange={(e) => handleInputChange("playerCount", e.target.value)}
            validators={playerCountValidators}
            onValidationChange={handleValidationChange("playerCount")}
            required
          />

          <ValidatedInput
            label="Campaign Link"
            value={formData.customLink}
            onChange={(e) => handleInputChange("customLink", e.target.value)}
            placeholder="my-awesome-campaign"
            validators={customLinkValidators(checkTokenExists)}
            onValidationChange={handleValidationChange("customLink")}
            helperText="Share this link with your players"
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

          <div className="space-y-2">
            <ValidatedInput
              type="file"
              label="Campaign Artwork"
              accept="image/*"
              onChange={handleFileUpload}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
            {formData.artwork && (
              <p className="text-sm text-slate-600 mt-1">
                Selected: {formData.artwork.name}
              </p>
            )}
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
