"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Campaign } from "@/convex/campaigns/types";

export default function CampaignSelect() {
  const campaigns = useQuery(api.campaigns.queries.getCampaigns);

  return (
    <div>
      <h1>Campaign Select</h1>
      <div>
        {campaigns?.map((campaign: Campaign) => (
          <div key={campaign._id}>{campaign.name}</div>
        ))}
      </div>
    </div>
  );
}
