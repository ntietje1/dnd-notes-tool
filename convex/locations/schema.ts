import { defineTable } from "convex/server";
import { v } from "convex/values";

export const locationTables = {
  locations: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
    tagId: v.id("tags"),
    createdBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_tag", ["tagId"]),
};
