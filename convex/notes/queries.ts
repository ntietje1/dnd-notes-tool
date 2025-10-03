import { query } from '../_generated/server'
import { v } from 'convex/values'
import { AnySidebarItem, Block, NoteWithContent, Folder } from './types'
import { Id } from '../_generated/dataModel'
import {
  findBlock,
  filterOutChildBlocks,
  extractTagIdsFromBlockContent,
  getBlockLevelTags,
  getNoteLevelTag,
  doesBlockMatchRequiredTags,
} from '../tags/tags'
import { CAMPAIGN_MEMBER_ROLE } from '../campaigns/types'
import { requireCampaignMembership } from '../campaigns/campaigns'
import { hasAccessToBlock } from '../tags/shared'
import {
  getSidebarItems as getSidebarItemsFn,
  getFolder as getFolderFn,
  getNoteWithContent,
} from './notes'
import {
  blockValidator,
  folderWithChildrenValidator,
  noteValidator,
  noteWithContentValidator,
  sidebarItemValidator,
} from './validators'

export const getFolder = query({
  args: {
    folderId: v.id('folders'),
  },
  returns: folderWithChildrenValidator,
  handler: async (ctx, args): Promise<Folder> => {
    const folder = await getFolderFn(ctx, args.folderId)

    await requireCampaignMembership(
      ctx,
      { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const children = await getSidebarItemsFn(
      ctx,
      folder.campaignId,
      folder.categoryId,
      args.folderId,
    )

    return {
      ...folder,
      children,
    }
  },
})

export const getNote = query({
  args: {
    noteId: v.id('notes'),
  },
  returns: noteWithContentValidator,
  handler: async (ctx, args): Promise<NoteWithContent> => {
    const note = await getNoteWithContent(ctx, args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }
    return note
  },
})

export const getSidebarItems = query({
  args: {
    campaignId: v.id('campaigns'),
    categoryId: v.optional(v.id('tagCategories')),
    parentId: v.optional(v.id('folders')),
  },
  returns: v.array(sidebarItemValidator),
  handler: async (ctx, args): Promise<AnySidebarItem[]> => {
    await requireCampaignMembership(
      ctx,
      { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )
    return getSidebarItemsFn(
      ctx,
      args.campaignId,
      args.categoryId,
      args.parentId,
    )
  },
})

export const getBlocksByTags = query({
  args: {
    campaignId: v.id('campaigns'),
    tagIds: v.array(v.id('tags')),
  },
  returns: v.array(blockValidator),
  handler: async (ctx, args): Promise<Block[]> => {
    const { campaignWithMembership } = await requireCampaignMembership(
      ctx,
      { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] },
    )

    const allBlocks = await ctx.db
      .query('blocks')
      .withIndex('by_campaign_note_toplevel_pos', (q) =>
        q.eq('campaignId', args.campaignId!),
      )
      .collect()

    const checks = await Promise.all(
      allBlocks.map(async (block) => {
        try {
          const [hasSharedTag, matchesRequired] = await Promise.all([
            hasAccessToBlock(
              ctx,
              args.campaignId!,
              campaignWithMembership.member._id,
              block._id,
            ),
            doesBlockMatchRequiredTags(ctx, block._id, args.tagIds),
          ])
          return hasSharedTag && matchesRequired ? block : null
        } catch (error) {
          console.warn(
            `Error checking block access/tags for block ${block._id}:`,
            error,
          )
          return null
        }
      }),
    )
    const matchingBlocks: Block[] = checks.filter(Boolean) as Block[]

    const noteGroups = new Map<Id<'notes'>, Block[]>()
    matchingBlocks.forEach((block) => {
      if (!noteGroups.has(block.noteId)) {
        noteGroups.set(block.noteId, [])
      }
      noteGroups.get(block.noteId)!.push(block)
    })

    const filteredResults: Block[] = []
    const matchedNoteIds = Array.from(noteGroups.keys())
    const topByNote = new Map<Id<'notes'>, Block[]>()
    for (const b of allBlocks) {
      if (b.isTopLevel && matchedNoteIds.includes(b.noteId)) {
        const arr = topByNote.get(b.noteId) ?? []
        arr.push(b)
        topByNote.set(b.noteId, arr)
      }
    }
    for (const [noteId, noteBlocks] of noteGroups) {
      const topLevelBlocks = (topByNote.get(noteId) ?? []).sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      )

      const topLevelContent = topLevelBlocks.map((block) => block.content)

      const filtered = filterOutChildBlocks(noteBlocks, topLevelContent)
      filteredResults.push(...filtered)
    }

    return filteredResults
  },
})

export const getBlockTagState = query({
  args: {
    noteId: v.id('notes'),
    blockId: v.string(),
  },
  returns: v.object({
    allTagIds: v.array(v.id('tags')),
    inlineTagIds: v.array(v.id('tags')),
    blockTagIds: v.array(v.id('tags')),
    noteTagId: v.optional(v.id('tags')),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    allTagIds: Id<'tags'>[]
    inlineTagIds: Id<'tags'>[]
    blockTagIds: Id<'tags'>[]
    noteTagId: Id<'tags'> | undefined
  }> => {
    const note = await ctx.db.get(args.noteId)
    if (!note) throw new Error('Note not found')

    await requireCampaignMembership(
      ctx,
      { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] },
    )

    const block = await findBlock(ctx, args.noteId, args.blockId)
    if (!block) throw new Error('Block not found')

    const blockTagIds = await getBlockLevelTags(ctx, block._id)
    const inlineTagIds = extractTagIdsFromBlockContent(block.content)
    const noteLevelTag = await getNoteLevelTag(ctx, note._id)

    const noteTagIdList = noteLevelTag ? [noteLevelTag._id] : []
    const allTagIds = [
      ...new Set([...blockTagIds, ...inlineTagIds, ...noteTagIdList]),
    ]

    return {
      allTagIds,
      inlineTagIds,
      blockTagIds,
      noteTagId: noteLevelTag?._id,
    }
  },
})
