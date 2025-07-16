import { defineTable } from "convex/server";
import { v } from "convex/values";

export const campaignTables = {
  campaigns: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    token: v.string(),
  }).index("by_user", ["userId"]),

  campaignMembers: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_campaign", ["campaignId"]),
};
