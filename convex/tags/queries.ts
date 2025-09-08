import { v } from "convex/values";
import { Tag, TagWithCategory } from "./types";
import { query } from "../_generated/server";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { getPlayerSharedTags, getSharedAllTag } from "./shared";

export const getSharedTags = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{
    sharedAllTag: Tag;
    playerSharedTags: Tag[];
  }> => {
    const sharedAllTag = await getSharedAllTag(ctx, args.campaignId);
    const playerSharedTags = await getPlayerSharedTags(ctx, args.campaignId);
    return {
      sharedAllTag,
      playerSharedTags,
    };
  },
});

export const getTag = query({
  args: {
    campaignId: v.id("campaigns"),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args): Promise<Tag> => {
    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );
    if (tag.campaignId !== args.campaignId) {
      throw new Error("Tag not found");
    }
    return tag;
  },
});

export const getTags = query({
  args: {
    campaignId: v.id("campaigns"),
    categoryId: v.optional(v.id("tagCategories")),
  },
  handler: async (ctx, args): Promise<TagWithCategory[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );
    
    const categories = await ctx.db
      .query("tagCategories")
      .withIndex("by_campaign_name", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const baseTags = await ctx.db
      .query("tags")
      .withIndex("by_campaign_categoryId", (q) => {
        const baseQuery = q.eq("campaignId", args.campaignId);
        return args.categoryId 
          ? baseQuery.eq("categoryId", args.categoryId)
          : baseQuery;
      })
      .collect();

      return baseTags.map((tag) => {
        const category = categories.find((c) => c._id === tag.categoryId);
        if (!category) {
          throw new Error(`Category not found for tag ${tag._id}`);
        }
      return { ...tag, category };
    });
  },
});
