import { v } from "convex/values";
import { SYSTEM_TAGS, Tag } from "./types";
import { query } from "../_generated/server";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";

export const getTag = query({
  args: {
    tagId: v.id("tags"),
  },
  handler: async (ctx, args): Promise<Tag> => {
    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    await requireCampaignMembership(ctx, { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );

    return tag;
  },
});

export const getTags = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<Tag[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );

    const tags = await ctx.db
      .query("tags")
      .withIndex("by_campaign_name", (q) =>
        q.eq("campaignId", args.campaignId!),
      )
      .collect();

    return tags;
  },
});

export const getSystemTagByName = query({
  args: {
    campaignId: v.id("campaigns"),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<Tag> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    if (!Object.values(SYSTEM_TAGS).includes(args.name)) {
      throw new Error("Tag is not a system tag");
    }

    const tag = await ctx.db
      .query("tags")
      .withIndex("by_campaign_name", (q) =>
        q.eq("campaignId", args.campaignId).eq("name", args.name),
      )
      .unique();

    if (!tag) {
      throw new Error("Tag not found");
    }

    return tag;
  },
});
