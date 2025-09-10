import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { CATEGORY_KIND } from "./types";
import { Id } from "../_generated/dataModel";
import { insertTag as insertTagFn, insertTagCategory, updateTagAndContent, deleteTagCategory as deleteTagCategoryFn, updateTagCategory as updateTagCategoryFn, deleteTagAndCleanupContent as deleteTagFn } from "./tags";

// note: these aren't used yet, will use them eventually

export const createTag = mutation({ //TODO: call helper
  args: {
    displayName: v.string(),
    categoryId: v.id("tagCategories"),
    color: v.string(),
    description: v.optional(v.string()),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<Id<"tags">> => {
    return await insertTagFn(ctx, {
      displayName: args.displayName,
      categoryId: args.categoryId,
      color: args.color,
      description: args.description,
      campaignId: args.campaignId,
    });
  },
});

export const updateTag = mutation({ //TODO: call helper
  args: {
    tagId: v.id("tags"),
    displayName: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"tags">> => {


    await updateTagAndContent(
      ctx,
      args.tagId,
      {
        displayName: args.displayName,
        color: args.color,
        description: args.description,
      },
    );

    return args.tagId;
  },
});

export const deleteTag = mutation({
  args: {
    tagId: v.id("tags"),
  },
  handler: async (ctx, args): Promise<Id<"tags">> => {
    return await deleteTagFn(ctx, args.tagId);
  },
});

export const createTagCategory = mutation({
  args: {
    campaignId: v.id("campaigns"),
    displayName: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tagCategories">> => {
    return await insertTagCategory(ctx, { campaignId: args.campaignId, kind: CATEGORY_KIND.User, displayName: args.displayName });
  },
});

export const updateTagCategory = mutation({
  args: {
    categoryId: v.id("tagCategories"),
    displayName: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tagCategories">> => {
    return await updateTagCategoryFn(ctx, args.categoryId, { displayName: args.displayName });
  },
});

export const deleteTagCategory = mutation({
  args: {
    categoryId: v.id("tagCategories"),
  },
  handler: async (ctx, args): Promise<Id<"tagCategories">> => {
    return await deleteTagCategoryFn(ctx, args.categoryId);
  },
});
