import { v } from "convex/values";
import { Tag } from "./types";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getPlayerSharedTags, getSharedAllTag } from "./shared";
import { getTag as getTagFn, getTagsByCategory as getTagsByCategoryFn, getTagsByCampaign as getTagsByCampaignFn } from "./tags";

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
  handler: async (ctx, args): Promise<Tag[]> => {
    return await getTagsByCampaignFn(ctx, args.campaignId);
  },
});

export const getTagsByCategoryName = query({
  args: {
    campaignId: v.id("campaigns"),
    categoryName: v.string(),
  },
  handler: async (ctx, args): Promise<Tag[]> => {
    const category = await ctx.db
      .query("tagCategories")
      .withIndex("by_campaign_name", (q) =>
        q.eq("campaignId", args.campaignId).eq("name", args.categoryName.toLowerCase()),
      )
      .unique();

    if (!category) {
      throw new Error("Category not found");
    }
    return await getTagsByCategoryFn(ctx, category._id);
  },
});



export const getTagsByCategory = query({
  args: {
    campaignId: v.id("campaigns"),
    categoryId: v.id("tagCategories"),
  },
  handler: async (ctx, args): Promise<Tag[]> => {
    return await getTagsByCategoryFn(ctx, args.categoryId);
  },
});

export const checkTagNameExists = query({
  args: {
    campaignId: v.id("campaigns"),
    tagName: v.string(),
    excludeTagId: v.optional(v.id("tags")),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_campaign_name", (q) =>
        q.eq("campaignId", args.campaignId).eq("name", args.tagName.toLowerCase()),
      )
      .unique();

    if (!existing) return false;
    if (args.excludeTagId && existing._id === args.excludeTagId) return false;
    return true;
  },
});

export const getTagCategoryByName = query({
  args: {
    campaignId: v.id("campaigns"),
    categoryName: v.string(),
  },
  handler: async (ctx, args): Promise<{ _id: Id<"tagCategories"> }> => {
    const category = await ctx.db
      .query("tagCategories")
      .withIndex("by_campaign_name", (q) => q.eq("campaignId", args.campaignId).eq("name", args.categoryName.toLowerCase()))
      .unique();

    if (!category) {
      throw new Error(`Category not found: ${args.categoryName}`);
    }

    return { _id: category._id };
  },
});

export const getTagCategoriesByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{ name: string; displayName: string; _id: Id<"tagCategories"> }[]> => {
    const categories = await ctx.db
      .query("tagCategories")
      .withIndex("by_campaign_name", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    return categories.map(c => ({
      _id: c._id,
      name: c.name,
      displayName: c.displayName
    }));
  },
});
