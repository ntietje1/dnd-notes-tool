import { defineTable } from "convex/server";
import { v } from "convex/values";
import { TAG_TYPES } from "./types";

export const tagTables = {
  tags: defineTable({
    name: v.string(),
    color: v.string(),
    campaignId: v.id("campaigns"),
    type: v.union(
      v.literal(TAG_TYPES.Character),
      v.literal(TAG_TYPES.Location),
      v.literal(TAG_TYPES.Session),
      v.literal(TAG_TYPES.System),
      v.literal(TAG_TYPES.Other),
    ),
    updatedAt: v.number(),
  })
    .index("by_campaign_name", ["campaignId", "name"])
    .index("by_campaign_type", ["campaignId", "type"]),
};
