import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const userTables = {
  userProfiles: defineTable({
    userId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_username', ['username']),
}
