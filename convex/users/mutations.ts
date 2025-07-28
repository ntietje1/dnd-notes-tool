import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getBaseUserId } from "../auth";

export const createUserProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);
    const now = Date.now();

    // Check if username is already taken
    const existingUser = await ctx.db
      .query("userProfiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existingUser) {
      throw new Error("Username already taken");
    }

    // Check if user profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();

    if (existingProfile) {
      throw new Error("User profile already exists");
    }

    const profileId = await ctx.db.insert("userProfiles", {
      userId: baseUserId,
      username: args.username,
      displayName: args.displayName,
      email: args.email || identity.email || undefined,
      avatarUrl: args.avatarUrl || identity.pictureUrl || undefined,
      isOnboarded: true,
      createdAt: now,
      updatedAt: now,
    });

    return profileId;
  },
});

export const updateUserProfile = mutation({
  args: {
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // If username is being updated, check if it's available
    if (args.username && args.username !== profile.username) {
      const existingUser = await ctx.db
        .query("userProfiles")
        .withIndex("by_username", (q) => q.eq("username", args.username!))
        .unique();

      if (existingUser) {
        throw new Error("Username already taken");
      }
    }

    await ctx.db.patch(profile._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return profile._id;
  },
});
