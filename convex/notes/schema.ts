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
    .index("by_campaign_parent", ["campaignId", "parentFolderId"]),

  folders: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    updatedAt: v.number(),
    parentFolderId: v.optional(v.id("folders")),
  })
    .index("by_campaign_parent", ["campaignId", "parentFolderId"]),

  blocks: defineTable({
    noteId: v.id("notes"),
    blockId: v.string(),
    position: v.optional(v.number()),
    content: v.any(), // BlockNote block content
    isTopLevel: v.boolean(),
    campaignId: v.id("campaigns"),
    updatedAt: v.number(),
  })
    .index("by_campaign_note_toplevel_pos", [
      "campaignId",
      "noteId",
      "isTopLevel",
      "position",
    ])
    .index("by_campaign_note_block", ["campaignId", "noteId", "blockId"]),

  blockTags: defineTable({
    campaignId: v.id("campaigns"),
    blockId: v.id("blocks"),
    tagId: v.id("tags"),
    createdAt: v.number(),
  })
    .index("by_campaign_block_tag", ["campaignId", "blockId", "tagId"]),
};
