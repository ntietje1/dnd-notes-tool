import { query } from "../_generated/server";
import { v } from "convex/values";
import { getBaseUserId, verifyUserIdentity } from "../model/helpers";

export const getCurrentEditor = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

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
