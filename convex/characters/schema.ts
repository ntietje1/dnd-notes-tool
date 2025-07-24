import { v } from "convex/values";
import { defineTable } from "convex/server";

export const characterTables = {
  characters: defineTable({
    name: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
    userId: v.id("users"),
    campaignId: v.id("campaigns"),
  }),
};
