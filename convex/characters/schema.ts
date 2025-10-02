import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const characterTables = {
  characters: defineTable({
    campaignId: v.id('campaigns'),
    tagId: v.id('tags'),
    playerId: v.optional(v.id('campaignMembers')),
  }).index('by_campaign_tag', ['campaignId', 'tagId']),
}
