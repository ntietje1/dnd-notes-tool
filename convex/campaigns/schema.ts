import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const campaignMemberStatusValidator = v.union(
  v.literal('Pending'),
  v.literal('Accepted'),
  v.literal('Rejected'),
  v.literal('Removed'),
)

export const campaignTableFields = {
  name: v.string(),
  description: v.optional(v.string()),
  updatedAt: v.number(),
  playerCount: v.number(),
  dmUserId: v.string(),
  slug: v.string(),
  status: v.union(v.literal('Active'), v.literal('Inactive')),
}

export const campaignMemberTableFields = {
  userId: v.string(),
  campaignId: v.id('campaigns'),
  role: v.union(v.literal('DM'), v.literal('Player')),
  status: campaignMemberStatusValidator,
  updatedAt: v.number(),
}

export const campaignTables = {
  campaigns: defineTable({
    ...campaignTableFields,
  }).index('by_slug_dm', ['slug', 'dmUserId']),

  campaignMembers: defineTable({
    ...campaignMemberTableFields,
  })
    .index('by_campaign', ['campaignId'])
    .index('by_user', ['userId']),
}

export const campaignValidatorFields = {
  _id: v.id('campaigns'),
  _creationTime: v.number(),
  ...campaignTableFields,
}

export const campaignMemberValidatorFields = {
  _id: v.id('campaignMembers'),
  _creationTime: v.number(),
  ...campaignMemberTableFields,
}
