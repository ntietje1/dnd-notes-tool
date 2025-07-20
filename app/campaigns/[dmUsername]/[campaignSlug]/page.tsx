"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Loader2, FileText, User, MapPin, Users, Sword, Settings } from "lucide-react";
import React from "react";

interface CampaignPageProps {
  params: Promise<{
    dmUsername: string;
    campaignSlug: string;
  }>;
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const { dmUsername, campaignSlug } = React.use(params);
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{campaign.name}</h1>
        {campaign.description && (
          <p className="text-slate-600 text-lg">{campaign.description}</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to your campaign!</h2>
        <p className="text-slate-600 mb-4">
          Use the sidebar navigation to access different sections of your campaign:
        </p>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600" />
            <span><strong>Notes:</strong> Manage campaign notes and documentation</span>
          </li>
          <li className="flex items-center gap-2">
            <User className="h-4 w-4 text-amber-600" />
            <span><strong>Characters:</strong> Manage player and NPC characters</span>
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-600" />
            <span><strong>Locations:</strong> Track important places and maps</span>
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            <span><strong>Players:</strong> Manage player information and permissions</span>
          </li>
          <li className="flex items-center gap-2">
            <Sword className="h-4 w-4 text-amber-600" />
            <span><strong>Scene:</strong> Current scene and encounter management</span>
          </li>
          <li className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-amber-600" />
            <span><strong>Settings:</strong> Campaign configuration and preferences</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 