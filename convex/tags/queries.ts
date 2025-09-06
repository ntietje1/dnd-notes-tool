import { v } from "convex/values";
import { Tag, TagCategory, TagWithCategory } from "./types";
import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { getPlayerSharedTag, getSharedAllTag } from "./shared";

export const getSharedTags = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{
    sharedAllTag: Tag;
    playerSharedTags: Tag[];
  }> => {
    const campaignMembers = await ctx.db.query("campaignMembers").withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId)).collect();
    const sharedAllTag = await getSharedAllTag(ctx, args.campaignId);
    const playerSharedTags = await Promise.all(
      campaignMembers.map(async (member) => {
        return await getPlayerSharedTag(ctx, args.campaignId, member._id);
      })
    )
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

    const q = ctx.db.query("tags");
    const tags = args.categoryId
      ? await q
          .withIndex("by_campaign_categoryId", (qi) =>
            qi.eq("campaignId", args.campaignId).eq("categoryId", args.categoryId as Id<"tagCategories">),
          )
          .collect()
          .then((t) => t.map((t) => ({
            ...t,
            category: categories.find((c) => c._id === t.categoryId)!,
          })))
      : await q
          .withIndex("by_campaign_categoryId", (qi) => qi.eq("campaignId", args.campaignId))
          .collect()
          .then((t) => t.map((t) => ({
            ...t,
            category: categories.find((c) => c._id === t.categoryId)!,
          })));

    return tags;
  },
});
