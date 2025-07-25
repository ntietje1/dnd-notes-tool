import { v } from "convex/values";
import { Tag } from "./types";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const getTag = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    tagId: v.string(),
  },
  handler: async (ctx, args): Promise<Tag | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.campaignId) {
      return null;
    }

    const tagId = args.tagId as Id<"tags">;

    const tag = await ctx.db
      .query("tags")
      .withIndex("by_id", (q) => q.eq("_id", tagId))
      .first();
    return tag;
  },
});

export const getTags = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args): Promise<Tag[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.campaignId) {
      return [];
    }

    const tags = await ctx.db
      .query("tags")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    return tags;
  },
});
