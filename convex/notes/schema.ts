import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notesTable = defineTable({
  userId: v.string(),
  name: v.optional(v.string()),
  content: v.any(), // TipTap JSON content
  parentFolderId: v.optional(v.id("folders")),
  hasSharedContent: v.optional(v.boolean()),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_folder", ["parentFolderId"])
  .index("by_shared", ["hasSharedContent", "userId"]);

export const foldersTable = defineTable({
  userId: v.string(),
  name: v.optional(v.string()),
  updatedAt: v.number(),
  parentFolderId: v.optional(v.id("folders")),
})
  .index("by_user", ["userId"])
  .index("by_folder", ["parentFolderId"]);

export const editorTable = defineTable({
  userId: v.string(),
  activeNoteId: v.optional(v.id("notes")),
  sortOrder: v.union(
    v.literal("alphabetical"),
    v.literal("dateCreated"),
    v.literal("dateModified"),
  ),
  sortDirection: v.union(v.literal("asc"), v.literal("desc")),
}).index("by_user", ["userId"]);
