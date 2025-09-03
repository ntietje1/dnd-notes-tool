import { defineTable } from "convex/server";
import { v } from "convex/values";
import { CATEGORY_KIND } from "./types";

export const tagTables = {
  tagCategories: defineTable({
    name: v.string(),
    kind: v.union(
      v.literal(CATEGORY_KIND.Core),
      v.literal(CATEGORY_KIND.SystemManaged),
      v.literal(CATEGORY_KIND.User),
    ),
    campaignId: v.id("campaigns"),
    updatedAt: v.number(),
  }).index("by_campaign_kind_name", ["campaignId", "kind", "name"]),

  tags: defineTable({
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    campaignId: v.id("campaigns"),
    noteId: v.optional(v.id("notes")),
    categoryId: v.id("tagCategories"),
    createdBy: v.string(),
    updatedAt: v.number(),
  })
    .index("by_campaign_name", ["campaignId", "name"])
    .index("by_campaign_categoryId", ["campaignId", "categoryId"])
    .index("by_campaign_noteId", ["campaignId", "noteId"]),
};
