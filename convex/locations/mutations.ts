import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireCampaignMembership } from "../campaigns/campaigns";
import {
  updateTagAndContent,
  deleteTagAndCleanupContent,
  getTagCategoryByName,
  insertTagAndNote,
} from "../tags/tags";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { Id } from "../_generated/dataModel";
import { CATEGORY_KIND, SYSTEM_TAG_CATEGORY_NAMES } from "../tags/types";

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

    const locationCategory = await getTagCategoryByName(ctx, args.campaignId, SYSTEM_TAG_CATEGORY_NAMES.Location);

    const tagId = await insertTagAndNote(ctx, {
      name: args.name,
      categoryId: locationCategory._id,
      color: args.color,
      campaignId: args.campaignId,
      description: args.description,
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

    const noteId = (await ctx.db.get(tagId))?.noteId;
    if (!noteId) {
      throw new Error("Failed to create note for location");
    }

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
        const tag = await ctx.db.get(location.tagId);
        if (!tag) {
          throw new Error("Location tag not found");
        }
        if (!tag.noteId) {
          throw new Error("Location note not found");
        }
        const associatedNote = await ctx.db.get(tag.noteId);

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
