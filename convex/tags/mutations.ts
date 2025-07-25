import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createTag = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("character"),
      v.literal("location"),
      v.literal("session"),
      v.literal("custom"),
    ),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const tag = await ctx.db.insert("tags", {
      name: args.name,
      type: args.type,
      color: args.color,
      campaignId: args.campaignId,
      updatedAt: Date.now(),
    });

    return tag;
  },
});

export const deleteTag = mutation({
  args: {
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.tagId);

    return args.tagId;
  },
});
