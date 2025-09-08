import { defineTable } from "convex/server";
import { v } from "convex/values";
import { CATEGORY_KIND } from "./types";

export const tagTables = {
  tagCategories: defineTable({
    displayName: v.string(),
    name: v.string(),
    kind: v.union(
      v.literal(CATEGORY_KIND.SystemCore),
      v.literal(CATEGORY_KIND.SystemManaged),
      v.literal(CATEGORY_KIND.User),
    ),
    campaignId: v.id("campaigns"),
    updatedAt: v.number(),
  }).index("by_campaign_name", ["campaignId", "name"]),

  tags: defineTable({
    displayName: v.string(),
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    campaignId: v.id("campaigns"),
    noteId: v.optional(v.id("notes")),
    categoryId: v.id("tagCategories"),
    memberId: v.optional(v.id("campaignMembers")),
    createdBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_campaign_categoryId", ["campaignId", "categoryId"])
    .index("by_campaign_noteId", ["campaignId", "noteId"])
    .index("by_campaign_name", ["campaignId", "name"]),
};
