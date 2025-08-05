"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { UserCampaign } from "@/convex/campaigns/types";
import { ContentGrid } from "@/components/ui/content-grid-page/content-grid";
import { ContentCard } from "@/components/ui/content-grid-page/content-card";
import { EmptyState } from "@/components/ui/content-grid-page/empty-state";
import { CardGridSkeleton } from "@/components/ui/content-grid-page/card-grid-skeleton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, Sword, Edit, Trash2 } from "lucide-react";
import { CreateCampaignCard } from "./create-campaign-card";
import { CampaignDialog } from "./campaign-dialog";

export function CampaignsList() {
  const router = useRouter();
  const [editingCampaign, setEditingCampaign] = useState<UserCampaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<UserCampaign | null>(null);
  
  const campaigns = useQuery(api.campaigns.queries.getUserCampaigns);
  const deleteCampaign = useMutation(api.campaigns.mutations.deleteCampaign);

  if (!campaigns) {
    return <CardGridSkeleton count={6} showCreateCard={true} />;
  }

  const handleCampaignSelect = (campaignId: string) => {
    const campaign = campaigns?.find((campaign) => campaign._id === campaignId);
    if (campaign && campaign.campaignSlug) {
      router.push(
        `/campaigns/${campaign.campaignSlug.username}/${campaign.campaignSlug.slug}/notes`,
      );
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deletingCampaign) return;

    try {
      await deleteCampaign({
        campaignId: deletingCampaign._id,
      });

      toast.success("Campaign deleted successfully");
      setDeletingCampaign(null);
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  if (campaigns.length === 0) {
    return (
      <ContentGrid>
        <EmptyState
          icon={Sword}
          title="No campaigns yet"
          description="Create your first campaign to start sharing notes and managing your D&D adventures."
          action={{
            label: "Create Your First Campaign",
            onClick: () => {
                // This will be handled by the CreateCampaignDialog component
                const event = new CustomEvent("openCreateCampaign");
                window.dispatchEvent(event);
            },
            icon: Plus
          }}
          className="col-span-full md:col-span-2 lg:col-span-3 max-w-2xl mx-auto"
        />
      </ContentGrid>
    );
  }

  // Helper function to render campaign footer
  const renderCampaignFooter = (campaign: UserCampaign) => (
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
  );

  return (
    <>
      <ContentGrid>
        {/* Create New Campaign Card */}
        {(campaigns.length > 0) && (
          <CreateCampaignCard />
        )}

        {/* Existing Campaigns */}
        {campaigns
          .sort((a, b) => b._creationTime - a._creationTime)
          .map((campaign: UserCampaign) => (
            <ContentCard
              key={campaign._id}
              title={campaign.name}
              description={campaign.description}
              footer={renderCampaignFooter(campaign)}
              onClick={() => handleCampaignSelect(campaign._id)}
              actionButtons={campaign.role === "DM" ? [
                {
                  icon: <Edit className="w-4 h-4" />,
                  onClick: (e) => {
                    e.stopPropagation();
                    setEditingCampaign(campaign);
                  },
                  "aria-label": "Edit campaign"
                },
                {
                  icon: <Trash2 className="w-4 h-4" />,
                  onClick: (e) => {
                    e.stopPropagation();
                    setDeletingCampaign(campaign);
                  },
                  "aria-label": "Delete campaign",
                  variant: "destructive-subtle"
                }
              ] : undefined}
            />
          ))}
      </ContentGrid>

      {editingCampaign && (
        <CampaignDialog
          mode="edit"
          isOpen={true}
          onClose={() => setEditingCampaign(null)}
          campaign={editingCampaign}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingCampaign}
        onClose={() => setDeletingCampaign(null)}
        onConfirm={handleDeleteCampaign}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${deletingCampaign?.name}"? This will permanently delete the entire campaign including all notes, characters, locations, and settings. This action cannot be undone.`}
        confirmLabel="Delete Campaign"
        isLoading={false}
        icon={Sword}
      />
    </>
  );
}