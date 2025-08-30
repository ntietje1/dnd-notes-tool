import { defineTable } from "convex/server";
import { v } from "convex/values";
import { SORT_DIRECTIONS, SORT_ORDERS } from "./types";

export const editorTables = {
  editor: defineTable({
    userId: v.string(),
    campaignId: v.id("campaigns"),
    sortOrder: v.union(
      v.literal(SORT_ORDERS.Alphabetical),
      v.literal(SORT_ORDERS.DateCreated),
      v.literal(SORT_ORDERS.DateModified),
    ),
    sortDirection: v.union(v.literal(SORT_DIRECTIONS.Ascending), v.literal(SORT_DIRECTIONS.Descending)),
    foldersAlwaysOnTop: v.boolean(),
  }).index("by_campaign_user", ["campaignId", "userId"]),
};
