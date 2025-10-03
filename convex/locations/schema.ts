import { defineTable } from 'convex/server'
import { v } from 'convex/values'
import { tagValidatorFields } from '../tags/schema'

const locationTableFields = {
  campaignId: v.id('campaigns'),
  tagId: v.id('tags'),
}

export const locationTables = {
  locations: defineTable({
    ...locationTableFields,
  }).index('by_campaign_tag', ['campaignId', 'tagId']),
}

const locationValidatorFields = {
  ...tagValidatorFields,
  ...locationTableFields,
} as const

export const locationValidator = v.object({
  ...locationValidatorFields,
  locationId: v.id('locations'), // additional field to be explicit about which field is the id
})
