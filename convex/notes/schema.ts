import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notesTables = {
  notes: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
    updatedAt: v.number(),
  })
    .index("by_folder", ["parentFolderId"])
    .index("by_campaign", ["campaignId"]),

  folders: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    updatedAt: v.number(),
    parentFolderId: v.optional(v.id("folders")),
  })
    .index("by_folder", ["parentFolderId"])
    .index("by_campaign", ["campaignId"]),

  blocks: defineTable({
    noteId: v.id("notes"),
    blockId: v.string(),
    position: v.optional(v.number()),
    content: v.any(), // BlockNote block content
    tagIds: v.array(v.id("tags")),
    isTopLevel: v.boolean(),
    campaignId: v.id("campaigns"),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_campaign", ["campaignId"])
    .index("by_note_position", ["noteId", "position"])
    .index("by_block_unique", ["noteId", "blockId"]),
};
