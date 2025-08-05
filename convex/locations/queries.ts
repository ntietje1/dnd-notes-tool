import { v } from "convex/values";
import { query } from "../_generated/server";
import { verifyUserIdentity } from "../model/helpers";
import { LocationWithTag } from "./types";

export const getLocationsByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<LocationWithTag[]> => {
    await verifyUserIdentity(ctx);

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
            type: tag.type as "Location",
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
  handler: async (ctx, args): Promise<LocationWithTag | null> => {
    await verifyUserIdentity(ctx);

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      return null;
    }

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
        type: tag.type as "Location",
      },
    };
  },
});

export const getLocationByTag = query({
  args: {
    tagId: v.id("tags"),
  },
  handler: async (ctx, args): Promise<LocationWithTag | null> => {
    await verifyUserIdentity(ctx);

    const location = await ctx.db
      .query("locations")
      .withIndex("by_tag", (q) => q.eq("tagId", args.tagId))
      .first();

    if (!location) {
      return null;
    }

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
        type: tag.type as "Location",
      },
    };
  },
});
