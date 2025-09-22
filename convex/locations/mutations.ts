import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { deleteTagAndCleanupContent, getTag, getTagCategoryByName, insertTagAndNote } from "../tags/tags";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { Id } from "../_generated/dataModel";
import { createTag } from "../tags/mutations";
import { SYSTEM_TAG_CATEGORY_NAMES } from "../tags/types";

export const createLocation = mutation({
  args: {
    tagId: v.id("tags")
  },
  handler: async (ctx, args): Promise<Id<"locations">> => {
    const tag = await getTag(ctx, args.tagId);
    await requireCampaignMembership(ctx, { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const locationId = await ctx.db.insert("locations", {
      campaignId: tag.campaignId,
      tagId: tag._id,
    });

    return locationId;
  },
});

export const createLocationFromForm = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{ tagId: Id<"tags">; locationId: Id<"locations"> }> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const locationCategory = await getTagCategoryByName(ctx, args.campaignId, SYSTEM_TAG_CATEGORY_NAMES.Location);

    const { tagId, noteId } = await insertTagAndNote(ctx, {
      displayName: args.name.trim(),
      description: args.description,
      color: args.color,
      campaignId: args.campaignId,
      categoryId: locationCategory._id,
    });

    const locationId = await ctx.db.insert("locations", {
      campaignId: args.campaignId,
      tagId: tagId,
    });

    return { tagId, locationId };
  },
});

export const updateLocation = mutation({
  args: {
    locationId: v.id("locations")
  },
  handler: async (ctx, args): Promise<Id<"locations">> => {
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    await requireCampaignMembership(ctx, { campaignId: location.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    await ctx.db.patch(args.locationId, {
      // put location specific fields here
    });


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
      throw new Error("Character not found");
    }

    await requireCampaignMembership(ctx, { campaignId: location.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    await deleteTagAndCleanupContent(ctx, location.tagId);
    await ctx.db.delete(args.locationId);

    return args.locationId;
  },
});
