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
      v.literal("custom"),
    ),
    updatedAt: v.number(),
  }).index("by_campaign", ["campaignId"]),

  noteTags: defineTable({
    noteId: v.id("notes"),
    tagId: v.id("tags"),
    blockId: v.optional(v.string()), // BlockNote block ID if tag is attached to specific block
    position: v.optional(v.number()), // For inline mentions
  })
    .index("by_note", ["noteId"])
    .index("by_tag", ["tagId"]),
};
