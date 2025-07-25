import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notesTables = {
  notes: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    content: v.any(), // TipTap JSON content
    parentFolderId: v.optional(v.id("folders")),
    updatedAt: v.number(),
    // Add note-level tags
    tagIds: v.optional(v.array(v.id("tags"))),
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

  taggedBlocks: defineTable({
    noteId: v.id("notes"),
    blockId: v.string(),
    campaignId: v.id("campaigns"),
    tagIds: v.array(v.id("tags")), // All tags on this block
    updatedAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_note", ["noteId"])
    .index("by_block_unique", ["noteId", "blockId"]),
};
