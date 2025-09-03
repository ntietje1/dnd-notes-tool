import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Tag } from "convex/tags/types";
import { convexQuery } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";

export function useTags() {
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const tags = useQuery(
    convexQuery(api.tags.queries.getTags, campaign?._id ? { campaignId: campaign._id } : "skip"),
  );

  return {
    tags: tags.data?.filter((tag: Tag) => tag.categoryId !== "System") || []
  };
}
