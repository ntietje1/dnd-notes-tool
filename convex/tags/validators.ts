import { v } from 'convex/values'

export const tagCategoryValidator = v.object({
  _id: v.id('tagCategories'),
  _creationTime: v.number(),
  displayName: v.string(),
  name: v.string(),
  kind: v.union(
    v.literal('system_managed'),
    v.literal('system_core'),
    v.literal('user'),
  ),
  campaignId: v.id('campaigns'),
  updatedAt: v.number(),
})

export const tagValidator = v.object({
  _id: v.id('tags'),
  _creationTime: v.number(),
  displayName: v.string(),
  name: v.string(),
  color: v.string(),
  description: v.optional(v.string()),
  campaignId: v.id('campaigns'),
  categoryId: v.id('tagCategories'),
  category: v.optional(tagCategoryValidator),
  memberId: v.optional(v.id('campaignMembers')),
  createdBy: v.string(),
  updatedAt: v.number(),
})
