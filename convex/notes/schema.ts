import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notesTables = {
  notes: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    content: v.any(), // TipTap JSON content
    parentFolderId: v.optional(v.id("folders")),
    hasSharedContent: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_folder", ["parentFolderId"])
    .index("by_shared", ["hasSharedContent", "userId"])
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
};
