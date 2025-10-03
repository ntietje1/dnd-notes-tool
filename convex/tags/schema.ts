import { defineTable } from 'convex/server'
import { v } from 'convex/values'
import { CATEGORY_KIND } from './types'

export const categoryKindValidator = v.union(
  v.literal(CATEGORY_KIND.SystemCore),
  v.literal(CATEGORY_KIND.SystemManaged),
  v.literal(CATEGORY_KIND.User),
)

const tagCategoryTableFields = {
  displayName: v.string(),
  name: v.string(),
  kind: categoryKindValidator,
  campaignId: v.id('campaigns'),
  updatedAt: v.number(),
}

const tagTableFields = {
  displayName: v.string(),
  name: v.string(),
  color: v.string(),
  description: v.optional(v.string()),
  campaignId: v.id('campaigns'),
  categoryId: v.id('tagCategories'),
  memberId: v.optional(v.id('campaignMembers')),
  createdBy: v.string(),
  updatedAt: v.number(),
}

export const tagTables = {
  tagCategories: defineTable({
    ...tagCategoryTableFields,
  }).index('by_campaign_name', ['campaignId', 'name']),

  tags: defineTable({
    ...tagTableFields,
  })
    .index('by_campaign_categoryId', ['campaignId', 'categoryId'])
    .index('by_campaign_name', ['campaignId', 'name']),
}

const tagCategoryValidatorFields = {
  _id: v.id('tagCategories'),
  _creationTime: v.number(),
  ...tagCategoryTableFields,
} as const

export const tagValidatorFields = {
  _id: v.id('tags'),
  _creationTime: v.number(),
  ...tagTableFields,
  category: v.optional(v.object(tagCategoryValidatorFields)),
} as const

export const tagCategoryValidator = v.object(tagCategoryValidatorFields)

export const tagValidator = v.object(tagValidatorFields)
