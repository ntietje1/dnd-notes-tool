import { v } from "convex/values";
import { query } from "../_generated/server";
import { getBaseUserId } from "../auth/helpers";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const baseUserId = getBaseUserId(identity.subject);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();

    return profile;
  },
});

export const checkUsernameExists = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return false;
    }

    const normalizedUsername = args.username.toLowerCase();

    const existingUser = await ctx.db
      .query("userProfiles")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .unique();

    return existingUser !== null;
  },
});
