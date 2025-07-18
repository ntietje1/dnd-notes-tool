import { defineTable } from "convex/server";
import { v } from "convex/values";

export const campaignTables = {
  campaigns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    token: v.string(),
    playerCount: v.number(),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
  }).index("by_token", ["token"]),

  campaignMembers: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    role: v.union(v.literal("DM"), v.literal("Player")),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_campaign", ["campaignId"]),

  userCampaignState: defineTable({
    userId: v.string(),
    activeCampaignId: v.id("campaigns"),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};
