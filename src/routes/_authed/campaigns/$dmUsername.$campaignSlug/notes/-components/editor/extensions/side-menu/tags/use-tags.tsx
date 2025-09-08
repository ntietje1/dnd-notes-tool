import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { CATEGORY_KIND, type TagWithCategory } from "convex/tags/types";
import { convexQuery } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";

export function useTags() {
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const tags = useQuery(
    convexQuery(api.tags.queries.getTags, campaign?._id ? { campaignId: campaign._id } : "skip"),
  );

  return {
    nonSystemManagedTags: tags.data?.filter((tag: TagWithCategory) => tag.category.kind !== CATEGORY_KIND.SystemManaged) || [],
    tags: tags.data || []
  };
}
