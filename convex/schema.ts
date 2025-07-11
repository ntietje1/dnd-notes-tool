import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  notes: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    content: v.any(), // TipTap JSON content
    folderId: v.optional(v.id("folders")), // Reference to parent folder
    hasSharedContent: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_folder", ["folderId"])
    .index("by_shared", ["hasSharedContent", "userId"]),
  folders: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    updatedAt: v.number(),
    folderId: v.optional(v.id("folders")),
  })
    .index("by_user", ["userId"])
    .index("by_folder", ["folderId"]),
  editor: defineTable({
    userId: v.string(),
    noteId: v.optional(v.id("notes")),
  }).index("by_user", ["userId"]),
});
