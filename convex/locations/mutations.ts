import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyUserIdentity } from "../model/helpers";
import {
  insertTag,
  updateTagAndContent,
  deleteTagAndCleanupContent,
} from "../model/tags/helpers";

export const createLocation = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

    const tagId = await insertTag(ctx, {
      name: args.name,
      type: "Location",
      color: args.color,
      campaignId: args.campaignId,
    });

    const locationId = await ctx.db.insert("locations", {
      name: args.name,
      description: args.description,
      color: args.color,
      campaignId: args.campaignId,
      tagId,
      createdBy: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });

    return locationId;
  },
});

export const updateLocation = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

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
    }

    return args.locationId;
  },
});

export const deleteLocation = mutation({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    await deleteTagAndCleanupContent(ctx, location.tagId);

    await ctx.db.delete(args.locationId);

    return args.locationId;
  },
});
