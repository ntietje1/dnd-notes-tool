import { v } from "convex/values";
import { query } from "../_generated/server";
import { getBaseUserId } from "../auth";
import { Campaign, UserCampaign } from "./types";

export const getUserCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const campaignMemberships = await ctx.db
      .query("campaignMembers")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .collect();

    const campaigns = await Promise.all(
      campaignMemberships.map((membership) =>
        ctx.db.get(membership.campaignId),
      ),
    );

    const campaignsWithNotes = await Promise.all(
      campaigns.map(async (campaign) => {
        const membership = campaignMemberships.find(
          (membership) => membership.campaignId === campaign?._id,
        );

        let notes = undefined;
        if (membership?.role === "DM") {
          notes = await ctx.db
            .query("notes")
            .withIndex("by_campaign", (q) => q.eq("campaignId", campaign!._id))
            .collect();
        }

        return {
          ...campaign,
          role: membership?.role,
          notes,
        } as UserCampaign;
      }),
    );

    return campaignsWithNotes as UserCampaign[];
  },
});

export const getCampaignByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    return (await ctx.db
      .query("campaigns")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique()) as Campaign | null;
  },
});

export const checkCampaignTokenExists = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique()
      .then((campaign) => campaign !== null);
  },
});

export const getActiveCampaign = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const state = await ctx.db
      .query("userCampaignState")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();

    if (!state) return null;

    const campaign = await ctx.db.get(state.activeCampaignId);
    if (!campaign) return null;

    const membership = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
      .unique();

    return {
      ...campaign,
      role: membership?.role,
    } as UserCampaign;
  },
});
