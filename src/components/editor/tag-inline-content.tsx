
import { api } from "convex/_generated/api";
import { createReactInlineContentSpec } from "@blocknote/react";
import { TagConfig } from "convex/tags/editorSpecs";
import { useCampaign } from "~/contexts/CampaignContext";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

export const TagInlineContent = createReactInlineContentSpec(
  TagConfig,
  {
    render: (props) => {
      const { campaignWithMembership } = useCampaign();
      const campaign = campaignWithMembership?.data?.campaign;
      const tag = useQuery(convexQuery(api.tags.queries.getTag, campaign?._id ? {
        campaignId: campaign._id,
        tagId: props.inlineContent.props.tagId,
      } : "skip"));

      const name = tag.data?.name ?? props.inlineContent.props.tagName;
      const color = tag.data?.color ?? props.inlineContent.props.tagColor;
      return (
        <span className="opacity-65" style={{ backgroundColor: `${color}35` }}>
          @{name}
        </span>
      );
    },
  },
);
