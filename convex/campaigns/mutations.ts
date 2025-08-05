import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getBaseUserId, verifyUserIdentity } from "../common/identity";
import { SYSTEM_TAGS } from "../tags/types";
import { insertTag } from "../tags/helpers";

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

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

    await insertTag(ctx, {
      name: SYSTEM_TAGS.shared,
      color: "#FFFF00",
      campaignId,
      type: "System",
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
    const identity = await verifyUserIdentity(ctx);

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

export const updateCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);
    const baseUserId = getBaseUserId(identity.subject);

    const campaignMember = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq("userId", baseUserId))
      .unique();

    if (!campaignMember || campaignMember.role !== "DM") {
      throw new Error("Only the DM can update this campaign");
    }

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const now = Date.now();

    const campaignUpdates: {
      name?: string;
      description?: string;
      updatedAt: number;
    } = {
      updatedAt: now,
    };

    if (args.name !== undefined) {
      campaignUpdates.name = args.name;
    }
    if (args.description !== undefined) {
      campaignUpdates.description = args.description;
    }

    await ctx.db.patch(args.campaignId, campaignUpdates);

    if (args.slug !== undefined) {
      const userProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", baseUserId))
        .unique();
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      const existingSlug = await ctx.db
        .query("campaignSlugs")
        .withIndex("by_slug_username", (q) =>
          q.eq("slug", args.slug!).eq("username", userProfile.username),
        )
        .unique();

      if (existingSlug && existingSlug.campaignId !== args.campaignId) {
        throw new Error("Slug already exists");
      }

      const campaignSlug = await ctx.db
        .query("campaignSlugs")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
        .unique();

      if (campaignSlug) {
        await ctx.db.patch(campaignSlug._id, {
          slug: args.slug!,
          updatedAt: now,
        });
      }
    }

    return args.campaignId;
  },
});

export const deleteCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);
    const baseUserId = getBaseUserId(identity.subject);

    const campaignMember = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq("userId", baseUserId))
      .unique();

    if (!campaignMember || campaignMember.role !== "DM") {
      throw new Error("Only the DM can delete this campaign");
    }

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q.eq("campaignId", args.campaignId),
      )
      .collect();

    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_campaign_parent", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_campaign_parent", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const folder of folders) {
      await ctx.db.delete(folder._id);
    }

    const campaignTags = await ctx.db
      .query("tags")
      .withIndex("by_campaign_name", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const tag of campaignTags) {
      await ctx.db.delete(tag._id);
    }

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const location of locations) {
      await ctx.db.delete(location._id);
    }

    const characters = await ctx.db
      .query("characters")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const character of characters) {
      await ctx.db.delete(character._id);
    }

    const campaignMembers = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const member of campaignMembers) {
      await ctx.db.delete(member._id);
    }

    const campaignSlug = await ctx.db
      .query("campaignSlugs")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .unique();

    if (campaignSlug) {
      await ctx.db.delete(campaignSlug._id);
    }

    await ctx.db.delete(args.campaignId);

    return args.campaignId;
  },
});
