import { defineTable } from "convex/server";
import { v } from "convex/values";

export const campaignTables = {
  campaigns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    playerCount: v.number(),
    dmUserId: v.string(),
    slug: v.string(),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
  }).index("by_slug_dm", ["slug", "dmUserId"]),

  campaignMembers: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    role: v.union(v.literal("DM"), v.literal("Player")),
    status: v.union(v.literal("Pending"), v.literal("Accepted"), v.literal("Rejected"), v.literal("Removed")),
    updatedAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_user", ["userId"]),
};
