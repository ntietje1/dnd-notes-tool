import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getBaseUserId } from "../auth";

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const baseUserId = getBaseUserId(identity.subject);

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      description: args.description,
      updatedAt: now,
      playerCount: 0,
      status: "Active",
    });

    const existingSlug = await ctx.db
      .query("campaignSlugs")
      .withIndex("by_slug_username", (q) =>
        q.eq("slug", args.slug).eq("username", userProfile.username),
      )
      .unique();

    if (existingSlug) {
      throw new Error("Slug already exists");
    }

    await ctx.db.insert("campaignSlugs", {
      campaignId: campaignId,
      slug: args.slug,
      username: userProfile.username,
      updatedAt: now,
    });

    await ctx.db.insert("campaignMembers", {
      userId: baseUserId,
      campaignId,
      role: "DM",
      updatedAt: now,
    });

    return campaignId;
  },
});

export const joinCampaign = mutation({
  args: {
    dmUsername: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const campaignSlug = await ctx.db
      .query("campaignSlugs")
      .withIndex("by_slug_username", (q) =>
        q.eq("slug", args.slug).eq("username", args.dmUsername),
      )
      .unique();
    if (!campaignSlug) {
      throw new Error("Campaign slug not found");
    }

    const campaign = await ctx.db
      .query("campaigns")
      .withIndex("by_id", (q) => q.eq("_id", campaignSlug.campaignId))
      .unique();

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const now = Date.now();

    await ctx.db.insert("campaignMembers", {
      userId: baseUserId,
      campaignId: campaign._id,
      role: "Player",
      updatedAt: now,
    });

    await ctx.db.patch(campaign._id, {
      playerCount: campaign.playerCount + 1,
      updatedAt: now,
    });

    return campaign._id;
  },
});
