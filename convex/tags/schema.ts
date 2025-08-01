import { defineTable } from "convex/server";
import { v } from "convex/values";

export const tagTables = {
  tags: defineTable({
    name: v.string(),
    color: v.string(),
    campaignId: v.id("campaigns"),
    type: v.union(
      v.literal("character"),
      v.literal("location"),
      v.literal("session"),
      v.literal("system"),
      v.literal("other"),
    ),
    updatedAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_name", ["campaignId", "name"]),
};
