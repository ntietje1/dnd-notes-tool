import { defineTable } from "convex/server";
import { v } from "convex/values";

export const tagTables = {
  tags: defineTable({
    name: v.string(),
    color: v.string(),
    campaignId: v.id("campaigns"),
    type: v.union(
      v.literal("Character"),
      v.literal("Location"),
      v.literal("Session"),
      v.literal("System"),
      v.literal("Other"),
    ),
    updatedAt: v.number(),
  })
  .index("by_campaign_name", ["campaignId", "name"])
  .index("by_campaign_type", ["campaignId", "type"]),
};
