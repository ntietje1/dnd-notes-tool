import { v } from 'convex/values'
import { tagCategoryValidator, tagValidator } from '../tags/validators'

export const blockNoteIdValidator = v.string()

export const customBlockValidator = v.object({
  id: blockNoteIdValidator,
  type: v.string(),
  props: v.optional(v.any()),
  content: v.optional(v.any()),
  children: v.optional(v.array(v.any())),
})

export const noteBaseFields = {
    _id: v.id('notes'),
    _creationTime: v.number(),
    userId: v.string(),
    campaignId: v.id('campaigns'),
    name: v.optional(v.string()),
    updatedAt: v.number(),
    categoryId: v.optional(v.id('tagCategories')),
    category: v.optional(tagCategoryValidator),
    parentFolderId: v.optional(v.id('folders')),
    type: v.literal('notes'),
    tagId: v.optional(v.id('tags')),
    tag: v.optional(tagValidator),
} as const

export const noteValidator = v.object({
  ...noteBaseFields,
})

export const blockValidator = v.object({
  _id: v.id('blocks'),
  _creationTime: v.number(),
  noteId: v.id('notes'),
  blockId: v.string(),
  position: v.optional(v.number()),
  content: customBlockValidator,
  isTopLevel: v.boolean(),
  campaignId: v.id('campaigns'),
  updatedAt: v.number(),
})

// Note with content validator - content is array of CustomBlock (BlockNote blocks), not database blocks
export const noteWithContentValidator = v.object({
  ...noteBaseFields,
  content: v.array(customBlockValidator), // CustomBlock[] from BlockNote
})

const baseFolderFields = {
  _id: v.id('folders'),
  _creationTime: v.number(),
  userId: v.string(),
  campaignId: v.id('campaigns'),
  name: v.optional(v.string()),
  updatedAt: v.number(),
  categoryId: v.optional(v.id('tagCategories')),
  category: v.optional(tagCategoryValidator),
  parentFolderId: v.optional(v.id('folders')),
  type: v.literal('folders'),
} as const

export const folderValidator = v.object(baseFolderFields)

export const sidebarItemValidator = v.union(noteValidator, folderValidator)

export const folderWithChildrenValidator = v.object({
  ...baseFolderFields,
  children: v.optional(v.array(sidebarItemValidator)),
})
