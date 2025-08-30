import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireCampaignMembership } from "../campaigns/campaigns";
import {
  insertUserCreatedTag,
  updateTagAndContent,
  deleteTagAndCleanupContent,
} from "../tags/tags";
import { TAG_TYPES } from "../tags/types";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { Id } from "../_generated/dataModel";

export const createLocation = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{ locationId: Id<"locations">, tagId: Id<"tags">, noteId: Id<"notes"> }> => {
    const { identityWithProfile } = await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    const { profile } = identityWithProfile;

    const { tagId, noteId } = await insertUserCreatedTag(ctx, {
      name: args.name,
      type: TAG_TYPES.Location,
      color: args.color,
      campaignId: args.campaignId,
    });

    const locationId = await ctx.db.insert("locations", {
      name: args.name,
      description: args.description,
      color: args.color,
      campaignId: args.campaignId,
      tagId,
      createdBy: profile.userId,
      updatedAt: Date.now(),
    });

    return { locationId, tagId, noteId };
  },
});

export const updateLocation = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"locations">> => {
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    await requireCampaignMembership(ctx, { campaignId: location.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const locationUpdates: {
      name?: string;
      description?: string;
      color?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      locationUpdates.name = args.name;
    }
    if (args.description !== undefined) {
      locationUpdates.description = args.description;
    }
    if (args.color !== undefined) {
      locationUpdates.color = args.color;
    }

    await ctx.db.patch(args.locationId, locationUpdates);

    if (args.name !== undefined || args.color !== undefined) {
      await updateTagAndContent(
        ctx,
        location.tagId,
        location.campaignId,
        location.name,
        location.color,
        {
          name: args.name,
          color: args.color,
        },
      );

      // Also update the associated note name if location name changed
      if (args.name !== undefined) {
        const associatedNote = await ctx.db
          .query("notes")
          .withIndex("by_campaign_tag", (q) =>
            q.eq("campaignId", location.campaignId).eq("tagId", location.tagId),
          )
          .unique();

        if (associatedNote) {
          await ctx.db.patch(associatedNote._id, {
            name: args.name,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return args.locationId;
  },
});

export const deleteLocation = mutation({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args): Promise<Id<"locations">> => {
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    await requireCampaignMembership(ctx, { campaignId: location.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    await deleteTagAndCleanupContent(ctx, location.tagId);

    await ctx.db.delete(args.locationId);

    return args.locationId;
  },
});
