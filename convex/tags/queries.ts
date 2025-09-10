import { v } from "convex/values";
import { Tag, TagWithCategory } from "./types";
import { query } from "../_generated/server";
import { getPlayerSharedTags, getSharedAllTag } from "./shared";
import { getTag as getTagFn, getTagsByCategory as getTagsByCategoryFn, getTagsByCampaign as getTagsByCampaignFn } from "./tags";
import type { Id } from "../_generated/dataModel";

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
    return await getTagFn(ctx, args.tagId);
  },
});

export const getTagsByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<TagWithCategory[]> => {
    return await getTagsByCampaignFn(ctx, args.campaignId);
  },
});


export const getTagsByCategory = query({
  args: {
    campaignId: v.id("campaigns"),
    categoryId: v.id("tagCategories"),
  },
  handler: async (ctx, args): Promise<TagWithCategory[]> => {
    return await getTagsByCategoryFn(ctx, args.categoryId);
  },
});

export const checkTagNameExists = query({
  args: {
    campaignId: v.id("campaigns"),
    displayName: v.string(),
    excludeTagId: v.optional(v.id("tags")),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_campaign_name", (q) =>
        q.eq("campaignId", args.campaignId).eq("name", args.displayName.toLowerCase()),
      )
      .unique();

    if (!existing) return false;
    if (args.excludeTagId && existing._id === args.excludeTagId) return false;
    return true;
  },
});
