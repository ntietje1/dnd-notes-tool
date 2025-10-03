import { defineTable } from 'convex/server'
import { v } from 'convex/values'
import { tagCategoryValidator, tagValidator } from '../tags/schema'

export const blockNoteIdValidator = v.string()

export const customBlockValidator = v.any() // BlockNote block content

const blockTableFields = {
  noteId: v.id('notes'),
  blockId: v.string(),
  position: v.optional(v.number()),
  content: customBlockValidator,
  isTopLevel: v.boolean(),
  campaignId: v.id('campaigns'),
  updatedAt: v.number(),
}

const blockTable = defineTable({
  noteId: v.id('notes'),
  blockId: v.string(),
  position: v.optional(v.number()),
  content: customBlockValidator,
  isTopLevel: v.boolean(),
  campaignId: v.id('campaigns'),
  updatedAt: v.number(),
})
  .index('by_campaign_note_toplevel_pos', [
    'campaignId',
    'noteId',
    'isTopLevel',
    'position',
  ])
  .index('by_campaign_note_block', ['campaignId', 'noteId', 'blockId'])

export const blockValidator = v.object({
  _id: v.id('blocks'),
  _creationTime: v.number(),
  ...blockTableFields,
})

const blockTagTableFields = {
  campaignId: v.id('campaigns'),
  blockId: v.id('blocks'),
  tagId: v.id('tags'),
}

const blockTagTable = defineTable({
  ...blockTagTableFields,
}).index('by_campaign_block_tag', ['campaignId', 'blockId', 'tagId'])

const noteTableFields = {
  userId: v.string(),
  campaignId: v.id('campaigns'),
  name: v.optional(v.string()),
  updatedAt: v.number(),
  categoryId: v.optional(v.id('tagCategories')),
  tagId: v.optional(v.id('tags')),
  parentFolderId: v.optional(v.id('folders')),
}

const noteTable = defineTable({
  ...noteTableFields,
})
  .index('by_campaign_category_parent', [
    'campaignId',
    'categoryId',
    'parentFolderId',
  ])
  .index('by_campaign_category_tag', ['campaignId', 'categoryId', 'tagId'])

const noteValidatorFields = {
  _id: v.id('notes'),
  _creationTime: v.number(),
  ...noteTableFields,
  category: v.optional(tagCategoryValidator),
  type: v.literal('notes'),
  tag: v.optional(tagValidator),
} as const

export const noteValidator = v.object({
  ...noteValidatorFields,
})

export const noteWithContentValidator = v.object({
  ...noteValidatorFields,
  content: v.array(customBlockValidator),
})

const folderTableFields = {
  userId: v.string(),
  campaignId: v.id('campaigns'),
  name: v.optional(v.string()),
  updatedAt: v.number(),
  categoryId: v.optional(v.id('tagCategories')),
  parentFolderId: v.optional(v.id('folders')),
}

const folderTable = defineTable({
  ...folderTableFields,
}).index('by_campaign_category_parent', [
  'campaignId',
  'categoryId',
  'parentFolderId',
])

const folderValidatorFields = {
  _id: v.id('folders'),
  _creationTime: v.number(),
  ...folderTableFields,
  category: v.optional(tagCategoryValidator),
  type: v.literal('folders'),
} as const

export const folderValidator = v.object(folderValidatorFields)

export const sidebarItemValidator = v.union(noteValidator, folderValidator)

export const folderWithChildrenValidator = v.object({
  ...folderValidatorFields,
  children: v.optional(v.array(sidebarItemValidator)),
})

export const notesTables = {
  notes: noteTable,
  folders: folderTable,

  blocks: blockTable,
  blockTags: blockTagTable,
}
