import { v } from "convex/values";
import { query } from "../_generated/server";
import { LocationWithTag } from "./types";
import { TAG_TYPES } from "../tags/types";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";

export const getLocationsByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<LocationWithTag[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    ); //TODO: allow players to see locations that have been "introduced" to them

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const locationsWithTags = await Promise.all(
      locations.map(async (location) => {
        const tag = await ctx.db.get(location.tagId);
        if (!tag) {
          throw new Error(`Tag not found for location ${location._id}`);
        }

        return {
          ...location,
          tag: {
            _id: tag._id,
            name: tag.name,
            color: tag.color,
            type: tag.type as typeof TAG_TYPES.Location,
          },
        };
      }),
    );

    return locationsWithTags.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getLocationById = query({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args): Promise<LocationWithTag> => {
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    await requireCampaignMembership(ctx, { campaignId: location.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    ); //TODO: allow players to see locations that have been "introduced" to them

    const tag = await ctx.db.get(location.tagId);
    if (!tag) {
      throw new Error(`Tag not found for location ${location._id}`);
    }

    return {
      ...location,
      tag: {
        _id: tag._id,
        name: tag.name,
        color: tag.color,
        type: tag.type as typeof TAG_TYPES.Location,
      },
    };
  },
});
