"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { Campaign, UserCampaign } from "@/convex/campaigns/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, ImageIcon, Sword, Shield } from "lucide-react";
import CreateCampaignDialog, {
  CreateCampaignCard,
} from "./create-campaign-dialog";

export default function CampaignDashboard() {
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    playerCount: 4,
    artwork: null as File | null,
    customLink: Math.random().toString(36).substring(2, 15),
  });

  const campaigns = useQuery(api.campaigns.queries.getUserCampaigns);
  const createCampaign = useMutation(api.campaigns.mutations.createCampaign);
  const linkNotAvailable = useQuery(
    api.campaigns.queries.checkCampaignTokenExists,
    {
      token: formData.customLink || "",
    },
  );

  const handleInputChange = (
    field: string,
    value: string | number | File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const checkTokenExists = async (token: string): Promise<boolean> => {
    if (!token || token.length < 3) {
      return false;
    }

    // The query hook will automatically revalidate when the token changes
    return linkNotAvailable ?? false;
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const campaignId = await createCampaign({
        name: formData.name,
        description: formData.description,
        token: formData.customLink,
      });

      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        description: "",
        playerCount: 4,
        artwork: null,
        customLink: "",
      });

      // Navigate to notes editor with the new campaign
      router.push(`/notes/${campaignId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        console.error("Image must be smaller than 5MB");
        return;
      }
      handleInputChange("artwork", file);
    }
  };

  const handleCampaignSelect = (campaignId: string) => {
    router.push(`/notes/${campaignId}`);
  };

  if (!campaigns) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="min-h-full w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Sword className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-4xl font-bold text-slate-800">
                Campaign Manager
              </h1>
              <div className="p-3 bg-amber-100 rounded-full">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Manage your D&D campaigns and share notes with your party. Create
              new adventures or continue existing ones.
            </p>
          </div>

          {/* Create Campaign Dialog - Available for both empty and non-empty states */}
          <CreateCampaignDialog
            isCreateModalOpen={isCreateModalOpen}
            setIsCreateModalOpen={setIsCreateModalOpen}
            handleCreateCampaign={handleCreateCampaign}
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileUpload={handleFileUpload}
            isLoading={isLoading}
            checkTokenExists={checkTokenExists}
          />

          {campaigns.length === 0 ? (
            /* Empty State */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="col-span-full md:col-span-2 lg:col-span-3 max-w-2xl mx-auto hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-slate-50 border border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-amber-100 rounded-full mb-4">
                    <Sword className="h-8 w-8 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-800 mb-2">
                    No campaigns yet
                  </CardTitle>
                  <CardDescription className="text-slate-600 mb-6 max-w-md text-center">
                    Create your first campaign to start sharing notes and
                    managing your D&D adventures.
                  </CardDescription>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="mr-2">Create Your First Campaign</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Campaigns Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Campaign Card */}
              <div onClick={() => setIsCreateModalOpen(true)}>
                <CreateCampaignCard
                  onClick={() => setIsCreateModalOpen(true)}
                />
              </div>

              {/* Existing Campaigns */}
              {campaigns
                .sort((a, b) => b._creationTime - a._creationTime)
                .map((campaign: UserCampaign) => (
                  <Card
                    key={campaign._id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer group bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-amber-300"
                    onClick={() => handleCampaignSelect(campaign._id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-1">
                            {campaign.name}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {campaign.description || "No description provided"}
                          </CardDescription>
                        </div>
                        <div className="ml-3 p-2 bg-slate-100 rounded-lg group-hover:bg-amber-100 transition-colors">
                          <ImageIcon className="h-5 w-5 text-slate-600 group-hover:text-amber-600" />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Users className="h-4 w-4" />
                          <span>{campaign.playerCount} players</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Created{" "}
                            {new Date(
                              campaign._creationTime,
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              campaign.status === "Active"
                                ? "bg-green-100 text-green-600"
                                : campaign.status === "Inactive"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {campaign.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              campaign.role === "DM"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {campaign.role}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {campaign.notes?.length || 0} notes
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-16 pt-8 border-t border-slate-200">
            <p className="text-slate-500 text-sm">
              Ready to embark on your next adventure? Select a campaign or
              create a new one to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
