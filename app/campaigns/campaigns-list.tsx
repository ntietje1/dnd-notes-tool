"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import type { UserCampaign } from "@/convex/campaigns/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, Sword } from "lucide-react";
import { CreateCampaignCard } from "./create-campaign-card";
import { CampaignsListSkeleton } from "./campaigns-list-skeleton";

export function CampaignsList() {
  const router = useRouter();
  const campaigns = useQuery(api.campaigns.queries.getUserCampaigns);

  if (!campaigns) {
    return <CampaignsListSkeleton />;
  }

  const handleCampaignSelect = (campaignId: string) => {
    const campaign = campaigns?.find((campaign) => campaign._id === campaignId);
    if (campaign && campaign.campaignSlug) {
      router.push(
        `/campaigns/${campaign.campaignSlug.username}/${campaign.campaignSlug.slug}/notes`,
      );
    }
  };

  if (campaigns.length === 0) {
    return (
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
              Create your first campaign to start sharing notes and managing
              your D&D adventures.
            </CardDescription>
            <Button
              onClick={() => {
                // This will be handled by the CreateCampaignDialog component
                const event = new CustomEvent("openCreateCampaign");
                window.dispatchEvent(event);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="mr-2">Create Your First Campaign</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Campaign Card */}
        <CreateCampaignCard />

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
                    {campaign.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {campaign.description}
                      </CardDescription>
                    )}
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
                      {new Date(campaign._creationTime).toLocaleDateString()}
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
    </>
  );
}
