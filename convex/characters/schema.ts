import { defineTable } from 'convex/server'
import { v } from 'convex/values'
import { tagValidatorFields } from '../tags/schema'

const characterTableFields = {
  campaignId: v.id('campaigns'),
  tagId: v.id('tags'),
  playerId: v.optional(v.id('campaignMembers')),
}

export const characterTables = {
  characters: defineTable({
    ...characterTableFields,
  }).index('by_campaign_tag', ['campaignId', 'tagId']),
}

const characterValidatorFields = {
  ...tagValidatorFields,
  ...characterTableFields,
} as const

export const characterValidator = v.object({
  ...characterValidatorFields,
  characterId: v.id('characters'), // additional field to be explicit about which field is the id
})
