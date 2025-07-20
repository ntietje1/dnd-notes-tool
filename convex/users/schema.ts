import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userTables = {
  userProfiles: defineTable({
    userId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isOnboarded: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"]),
}; 