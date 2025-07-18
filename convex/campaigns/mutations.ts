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
    const baseUserId = getBaseUserId(identity.subject);

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      description: args.description,
      updatedAt: now,
      token: args.token,
      playerCount: 1,
      status: "Active",
    });

    await ctx.db.insert("campaignMembers", {
      userId: baseUserId,
      campaignId,
      role: "DM",
      updatedAt: now,
    });

    await ctx.db.insert("userCampaignState", {
      userId: baseUserId,
      activeCampaignId: campaignId,
      updatedAt: now,
    });

    return campaignId;
  },
});

export const joinCampaign = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const campaign = await ctx.db
      .query("campaigns")
      .withIndex("by_token", (q) => q.eq("token", args.token))
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

    // Get existing state
    const state = await ctx.db
      .query("userCampaignState")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();

    if (state) {
      // Update existing state
      await ctx.db.patch(state._id, {
        activeCampaignId: campaign._id,
        updatedAt: now,
      });
    } else {
      // Create new state
      await ctx.db.insert("userCampaignState", {
        userId: baseUserId,
        activeCampaignId: campaign._id,
        updatedAt: now,
      });
    }

    return campaign._id;
  },
});

export const setActiveCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    // Verify the campaign exists and user has access
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const membership = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq(q.field("userId"), baseUserId))
      .unique();

    if (!membership) {
      throw new Error("Not a member of this campaign");
    }

    const state = await ctx.db
      .query("userCampaignState")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();

    const now = Date.now();

    if (state) {
      // Update existing state
      return await ctx.db.patch(state._id, {
        activeCampaignId: args.campaignId,
        updatedAt: now,
      });
    } else {
      // Create new state
      return await ctx.db.insert("userCampaignState", {
        userId: baseUserId,
        activeCampaignId: args.campaignId,
        updatedAt: now,
      });
    }
  },
});
