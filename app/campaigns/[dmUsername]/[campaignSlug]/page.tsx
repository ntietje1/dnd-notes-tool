"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface CampaignPageProps {
  params: {
    dmUsername: string;
    campaignSlug: string;
  };
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const { dmUsername, campaignSlug } = params;
  const router = useRouter();

  const campaign = useQuery(api.campaigns.queries.getCampaignBySlug, {
    dmUsername,
    slug: campaignSlug,
  });

  if (campaign === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (campaign === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <p className="text-gray-600 mb-4">
            The campaign you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push("/campaigns")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{campaign.name}</h1>
      {campaign.description && (
        <p className="text-gray-600 mb-6">{campaign.description}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => router.push(`/campaigns/${dmUsername}/${campaignSlug}/notes`)}
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-semibold">Notes</h3>
          <p className="text-sm text-gray-600">Manage campaign notes</p>
        </button>
        
        <button
          onClick={() => router.push(`/campaigns/${dmUsername}/${campaignSlug}/characters`)}
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-semibold">Characters</h3>
          <p className="text-sm text-gray-600">Manage characters</p>
        </button>
        
        <button
          onClick={() => router.push(`/campaigns/${dmUsername}/${campaignSlug}/locations`)}
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-semibold">Locations</h3>
          <p className="text-sm text-gray-600">Manage locations</p>
        </button>
      </div>
    </div>
  );
} 