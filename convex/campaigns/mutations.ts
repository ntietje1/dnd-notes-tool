import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getBaseUserId } from "../auth";

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    return await ctx.db.insert("campaigns", {
      userId: getBaseUserId(identity.subject),
      name: args.name,
      description: args.description,
      updatedAt: now,
      token: args.token,
    });
  },
});
