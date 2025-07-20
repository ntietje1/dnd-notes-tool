import { defineTable } from "convex/server";
import { v } from "convex/values";

export const editorTables = {
  editor: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    sortOrder: v.union(
      v.literal("alphabetical"),
      v.literal("dateCreated"),
      v.literal("dateModified"),
    ),
    sortDirection: v.union(v.literal("asc"), v.literal("desc")),
  }).index("by_campaign_user", ["campaignId", "userId"]),
};
