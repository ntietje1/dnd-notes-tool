import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { updateTagAndContent, deleteTagAndCleanupContent, getTagCategoryByName, insertTagAndNote, getTag } from "../tags/tags";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { Id } from "../_generated/dataModel";
import { SYSTEM_TAG_CATEGORY_NAMES } from "../tags/types";

export const createLocation = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{ locationId: Id<"locations">, tagId: Id<"tags">, noteId: Id<"notes"> }> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const locationCategory = await getTagCategoryByName(ctx, args.campaignId, SYSTEM_TAG_CATEGORY_NAMES.Location);

    const { tagId, noteId } = await insertTagAndNote(ctx, {
      displayName: args.name,
      categoryId: locationCategory._id,
      color: args.color,
      campaignId: args.campaignId,
      description: args.description,
    });
    const locationId = await ctx.db.insert("locations", {
      campaignId: args.campaignId,
      tagId,
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

    const tag = await getTag(ctx, location.tagId);

    await updateTagAndContent(
      ctx,
      tag._id,
      {
        displayName: args.name,
        color: args.color,
        description: args.description,
      },
    );


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
