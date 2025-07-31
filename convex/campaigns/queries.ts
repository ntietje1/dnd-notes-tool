import { v } from "convex/values";
import { query } from "../_generated/server";
import { Campaign, CampaignSlug, UserCampaign } from "./types";
import { getBaseUserId, verifyUserIdentity } from "../auth/helpers";

export const getUserCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyUserIdentity(ctx);

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
        if (!campaign) {
          return null;
        }

        const membership = campaignMemberships.find(
          (membership) => membership.campaignId === campaign._id,
        );

        const campaignSlug = (await ctx.db
          .query("campaignSlugs")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .unique()) as CampaignSlug | null;

        let notes = undefined;
        if (membership?.role === "DM") {
          notes = await ctx.db
            .query("notes")
            .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
            .collect();
        }

        return {
          ...campaign,
          role: membership?.role,
          campaignSlug,
          notes,
        } as UserCampaign;
      }),
    );

    return campaignsWithNotes as UserCampaign[];
  },
});

export const getCampaignBySlug = query({
  args: {
    dmUsername: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

    const campaignSlug = await ctx.db
      .query("campaignSlugs")
      .withIndex("by_slug_username", (q) =>
        q.eq("slug", args.slug).eq("username", args.dmUsername),
      )
      .unique();
    if (!campaignSlug) {
      return null;
    }

    const campaign = (await ctx.db.get(
      campaignSlug.campaignId,
    )) as Campaign | null;

    if (!campaign) {
      return null;
    }

    const baseUserId = getBaseUserId(identity.subject);
    const membership = await ctx.db
      .query("campaignMembers")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .filter((q) => q.eq(q.field("campaignId"), campaign._id))
      .unique();

    if (!membership) {
      return null;
    }

    return campaign;
  },
});

export const checkCampaignSlugExists = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

    const baseUserId = getBaseUserId(identity.subject);

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();
    if (!userProfile) {
      return undefined;
    }

    const slug = await ctx.db
      .query("campaignSlugs")
      .withIndex("by_slug_username", (q) =>
        q.eq("slug", args.slug).eq("username", userProfile.username),
      )
      .unique();

    return slug !== null;
  },
});
