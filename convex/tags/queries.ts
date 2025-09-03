import { v } from "convex/values";
import { SYSTEM_TAGS, Tag, TagCategory, CATEGORY_KIND } from "./types";
import { Id } from "../_generated/dataModel";
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
    categoryId: v.optional(v.id("tagCategories")),
  },
  handler: async (ctx, args): Promise<Tag[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );

    const q = ctx.db.query("tags");
    const tags = args.categoryId
      ? await q
          .withIndex("by_campaign_categoryId", (qi) =>
            qi.eq("campaignId", args.campaignId).eq("categoryId", args.categoryId as Id<"tagCategories">),
          )
          .collect()
      : await q
          .withIndex("by_campaign_name", (qi) => qi.eq("campaignId", args.campaignId))
          .collect();

    return tags;
  },
});

export const getTagCategories = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<TagCategory[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );
    return await ctx.db
      .query("tagCategories")
      .withIndex("by_campaign_kind_name", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});
