import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyUserIdentity } from "../model/helpers";

export const createTag = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("character"),
      v.literal("location"),
      v.literal("session"),
      v.literal("shared"),
      v.literal("custom"),
    ),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const tag = await ctx.db.insert("tags", {
      name: args.name,
      type: args.type,
      color: args.color,
      campaignId: args.campaignId,
      mutable: true,
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
    await verifyUserIdentity(ctx);

    await ctx.db.delete(args.tagId);

    return args.tagId;
  },
});
