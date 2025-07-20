import { query } from "../_generated/server";
import { getBaseUserId } from "../auth";
import { v } from "convex/values";

export const getCurrentEditor = query(
  { args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.campaignId) {
      return null;
    }

    const userId = getBaseUserId(identity.subject);
    const editor = await ctx.db
      .query("editor")
      .withIndex("by_campaign_user", (q) =>
        q.eq("campaignId", args.campaignId!).eq("userId", userId),
      )
      .unique();

    if (!editor) {
      return null;
    }

    return editor;
  },
});
