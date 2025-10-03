import { mutation } from '../_generated/server'
import { v } from 'convex/values'
import { Doc } from '../_generated/dataModel'
import { Id } from '../_generated/dataModel'
import {
  addTagToBlock,
  removeTagFromBlock,
  saveTopLevelBlocks,
  findBlockById,
  extractTagIdsFromBlockContent,
  updateTagAndContent,
  findBlock,
} from '../tags/tags'
import { CAMPAIGN_MEMBER_ROLE } from '../campaigns/types'
import { requireCampaignMembership } from '../campaigns/campaigns'
import { getFolder as getFolderFn } from './notes'
import { blockNoteIdValidator, customBlockValidator } from './schema'
import {
  deleteNoteBlocks,
  getTopLevelBlocksByNote,
  deleteNote as deleteNoteFn,
} from './helpers'

export const updateNote = mutation({
  args: {
    noteId: v.id('notes'),
    content: v.optional(v.array(customBlockValidator)),
    name: v.optional(v.string()),
  },
  returns: v.id('notes'),
  handler: async (ctx, args): Promise<Id<'notes'>> => {
    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const now = Date.now()
    const updates: Partial<Doc<'notes'>> = {
      updatedAt: now,
    }

    if (args.content !== undefined) {
      await saveTopLevelBlocks(ctx, args.noteId, args.content)
    }

    if (args.name !== undefined) {
      updates.name = args.name

      if (note.tagId) {
        await updateTagAndContent(ctx, note.tagId, { displayName: args.name })
      }
    }

    await ctx.db.patch(args.noteId, updates)
    return args.noteId
  },
})

export const moveNote = mutation({
  args: {
    noteId: v.id('notes'),
    parentFolderId: v.optional(v.id('folders')),
  },
  returns: v.id('notes'),
  handler: async (ctx, args): Promise<Id<'notes'>> => {
    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    await ctx.db.patch(args.noteId, { parentFolderId: args.parentFolderId })
    return args.noteId
  },
})

export const moveFolder = mutation({
  args: {
    folderId: v.id('folders'),
    parentId: v.optional(v.id('folders')),
  },
  returns: v.id('folders'),
  handler: async (ctx, args): Promise<Id<'folders'>> => {
    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error('Folder not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    //TODO: check if folder is being put into one of it's own children

    await ctx.db.patch(args.folderId, { parentFolderId: args.parentId })
    return args.folderId
  },
})

export const deleteNote = mutation({
  args: {
    noteId: v.id('notes'),
  },
  returns: v.id('notes'),
  handler: async (ctx, args): Promise<Id<'notes'>> => {
    return await deleteNoteFn(ctx, args.noteId)
  },
})

export const deleteFolder = mutation({
  args: {
    folderId: v.id('folders'),
  },
  returns: v.id('folders'),
  handler: async (ctx, args): Promise<Id<'folders'>> => {
    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error('Folder not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const recursiveDelete = async (folderId: Id<'folders'>) => {
      const childFolders = await ctx.db
        .query('folders')
        .withIndex('by_campaign_category_parent', (q) =>
          q
            .eq('campaignId', folder.campaignId)
            .eq('categoryId', folder.categoryId)
            .eq('parentFolderId', folderId),
        )
        .collect()

      const notesInFolder = await ctx.db
        .query('notes')
        .withIndex('by_campaign_category_parent', (q) =>
          q
            .eq('campaignId', folder.campaignId)
            .eq('categoryId', folder.categoryId)
            .eq('parentFolderId', folderId),
        )
        .collect()

      for (const childFolder of childFolders) {
        await recursiveDelete(childFolder._id)
      }

      for (const note of notesInFolder) {
        await deleteNoteBlocks(ctx, note._id, note.campaignId)
        await ctx.db.delete(note._id)
      }

      await ctx.db.delete(folderId)
    }

    await recursiveDelete(args.folderId)
    return args.folderId
  },
})

export const updateFolder = mutation({
  args: {
    folderId: v.id('folders'),
    name: v.optional(v.string()),
  },
  returns: v.id('folders'),
  handler: async (ctx, args): Promise<Id<'folders'>> => {
    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error('Folder not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )
    await ctx.db.patch(args.folderId, { name: args.name })
    return args.folderId
  },
})

export const createFolder = mutation({
  args: {
    name: v.optional(v.string()),
    campaignId: v.optional(v.id('campaigns')),
    categoryId: v.optional(v.id('tagCategories')),
    parentFolderId: v.optional(v.id('folders')),
  },
  returns: v.id('folders'),
  handler: async (ctx, args): Promise<Id<'folders'>> => {
    let campaignId: Id<'campaigns'>
    let parentFolderId: Id<'folders'> | undefined
    let categoryId: Id<'tagCategories'> | undefined

    if (args.parentFolderId) {
      // Creating child folder - inherit categoryId from parent
      const parentFolder = await getFolderFn(ctx, args.parentFolderId)
      campaignId = parentFolder.campaignId
      parentFolderId = args.parentFolderId
      categoryId = parentFolder.categoryId
    } else if (args.campaignId) {
      // Creating root folder
      campaignId = args.campaignId
      parentFolderId = undefined
      categoryId = args.categoryId
    } else {
      throw new Error('Must provide either campaignId or parentFolderId')
    }

    const { identityWithProfile } = await requireCampaignMembership(
      ctx,
      { campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )
    const { profile } = identityWithProfile

    return await ctx.db.insert('folders', {
      userId: profile.userId,
      name: args.name || '',
      campaignId,
      updatedAt: Date.now(),
      categoryId: categoryId,
      parentFolderId,
    })
  },
})

export const createNote = mutation({
  args: {
    name: v.optional(v.string()),
    categoryId: v.optional(v.id('tagCategories')),
    parentFolderId: v.optional(v.id('folders')),
    campaignId: v.id('campaigns'),
  },
  returns: v.id('notes'),
  handler: async (ctx, args): Promise<Id<'notes'>> => {
    const { identityWithProfile } = await requireCampaignMembership(
      ctx,
      { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )
    const { profile } = identityWithProfile

    const noteId = await ctx.db.insert('notes', {
      userId: profile.userId,
      name: args.name || '',
      categoryId: args.categoryId,
      parentFolderId: args.parentFolderId,
      updatedAt: Date.now(),
      campaignId: args.campaignId,
    })

    return noteId
  },
})

export const addTagToBlockMutation = mutation({
  args: {
    noteId: v.id('notes'),
    blockId: blockNoteIdValidator,
    tagId: v.id('tags'),
  },
  returns: blockNoteIdValidator,
  handler: async (ctx, args): Promise<string> => {
    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const existingBlock = await findBlock(ctx, args.noteId, args.blockId)

    if (existingBlock) {
      const inlineTagIds = extractTagIdsFromBlockContent(existingBlock.content)
      if (inlineTagIds.includes(args.tagId)) {
        throw new Error(
          'Cannot manually add tag that already exists as inline tag in block content',
        )
      }

      await addTagToBlock(ctx, existingBlock._id, args.tagId)
    } else {
      const topLevelBlocks = await getTopLevelBlocksByNote(
        ctx,
        args.noteId,
        note.campaignId,
      )

      const currentContent = topLevelBlocks.map((block) => block.content)

      const targetBlock = findBlockById(currentContent, args.blockId)

      if (targetBlock) {
        const inlineTagIds = extractTagIdsFromBlockContent(targetBlock)
        if (inlineTagIds.includes(args.tagId)) {
          throw new Error(
            'Cannot manually add tag that already exists as inline tag in block content',
          )
        }

        const newBlockDbId = await ctx.db.insert('blocks', {
          noteId: args.noteId,
          blockId: args.blockId,
          position: undefined,
          content: targetBlock,
          isTopLevel: false,
          campaignId: note.campaignId,
          updatedAt: Date.now(),
        })

        await ctx.db.insert('blockTags', {
          campaignId: note.campaignId,
          blockId: newBlockDbId,
          tagId: args.tagId,
        })
      }
    }

    return args.blockId
  },
})

export const removeTagFromBlockMutation = mutation({
  args: {
    noteId: v.id('notes'),
    blockId: blockNoteIdValidator,
    tagId: v.id('tags'),
  },
  returns: blockNoteIdValidator,
  handler: async (ctx, args): Promise<string> => {
    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const block = await findBlock(ctx, args.noteId, args.blockId)

    if (block) {
      const inlineTagIds = extractTagIdsFromBlockContent(block.content)
      if (inlineTagIds.includes(args.tagId)) {
        throw new Error(
          'Cannot manually remove tag that exists as inline tag in block content',
        )
      }

      await removeTagFromBlock(ctx, block._id, args.tagId, block.isTopLevel)
    }

    return args.blockId
  },
})
