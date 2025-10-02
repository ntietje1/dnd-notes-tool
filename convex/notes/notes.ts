import { CAMPAIGN_MEMBER_ROLE } from '../campaigns/types'
import { requireCampaignMembership } from '../campaigns/campaigns'
import { Ctx } from '../common/types'
import { Id } from '../_generated/dataModel'
import {
  AnySidebarItem,
  Folder,
  Note,
  NoteWithContent,
  SIDEBAR_ITEM_TYPES,
} from './types'
import { Tag } from '../tags/types'

export const getNote = async (
  ctx: Ctx,
  noteId: Id<'notes'>,
): Promise<Note | null> => {
  const note = await ctx.db.get(noteId)
  if (!note) {
    return null
  }

  await requireCampaignMembership(
    ctx,
    { campaignId: note.campaignId },
    { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
  )

  const tag = note.tagId
    ? ((await ctx.db.get(note.tagId)) ?? undefined)
    : undefined

  const category = note.categoryId
    ? ((await ctx.db.get(note.categoryId)) ?? undefined)
    : undefined

  return {
    ...note,
    type: SIDEBAR_ITEM_TYPES.notes,
    tag,
    category,
  }
}

export const getNoteWithContent = async (
  ctx: Ctx,
  noteId: Id<'notes'>,
): Promise<NoteWithContent | null> => {
  const note = await getNote(ctx, noteId)
  if (!note) {
    return null
  }

  const topLevelBlocks = await ctx.db
    .query('blocks')
    .withIndex('by_campaign_note_toplevel_pos', (q) =>
      q
        .eq('campaignId', note.campaignId)
        .eq('noteId', note._id)
        .eq('isTopLevel', true),
    )
    .collect()

  const allBlocks = await ctx.db
    .query('blocks')
    .withIndex('by_campaign_note_toplevel_pos', (q) =>
      q.eq('campaignId', note.campaignId).eq('noteId', note._id),
    )
    .collect()

  const blocksMap = new Map(
    allBlocks.map((block) => [block.blockId, block.content]),
  )

  function reconstructContent(content: any): any {
    if (Array.isArray(content)) {
      return content.map(reconstructContent)
    } else if (content && typeof content === 'object' && content.id) {
      const dbBlock = blocksMap.get(content.id)
      if (dbBlock) {
        return {
          ...dbBlock,
          content: dbBlock.content
            ? reconstructContent(dbBlock.content)
            : dbBlock.content,
        }
      }
      return {
        ...content,
        content: content.content
          ? reconstructContent(content.content)
          : content.content,
      }
    } else if (content && typeof content === 'object') {
      const reconstructed: any = {}
      for (const [key, value] of Object.entries(content)) {
        reconstructed[key] = reconstructContent(value)
      }
      return reconstructed
    }
    return content
  }

  const content = topLevelBlocks.map((block) =>
    reconstructContent(block.content),
  )

  return {
    ...note,
    content,
  }
}

export const getFolder = async (
  ctx: Ctx,
  folderId: Id<'folders'>,
): Promise<Folder> => {
  const folder = await ctx.db.get(folderId)
  if (!folder) {
    throw new Error('Folder not found')
  }
  await requireCampaignMembership(
    ctx,
    { campaignId: folder.campaignId },
    { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
  )
  const category = folder.categoryId
    ? ((await ctx.db.get(folder.categoryId)) ?? undefined)
    : undefined

  return {
    ...folder,
    category,
    type: SIDEBAR_ITEM_TYPES.folders,
  }
}

export const getSidebarItems = async (
  ctx: Ctx,
  campaignId: Id<'campaigns'>,
  categoryId?: Id<'tagCategories'>,
  parentId?: Id<'folders'>,
): Promise<AnySidebarItem[]> => {
  await requireCampaignMembership(
    ctx,
    { campaignId: campaignId },
    { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
  )

  const category = categoryId
    ? ((await ctx.db.get(categoryId)) ?? undefined)
    : undefined

  let tags: Tag[] = []
  if (categoryId) {
    tags = await ctx.db
      .query('tags')
      .withIndex('by_campaign_categoryId', (q) =>
        q.eq('campaignId', campaignId).eq('categoryId', categoryId),
      )
      .collect()
      .then((tags) => tags.map((tag) => ({ ...tag, category })))
  }

  const folders = await ctx.db
    .query('folders')
    .withIndex('by_campaign_category_parent', (q) =>
      q
        .eq('campaignId', campaignId)
        .eq('categoryId', categoryId)
        .eq('parentFolderId', parentId),
    )
    .collect()
    .then((folders) =>
      folders.map((folder) => ({
        ...folder,
        type: SIDEBAR_ITEM_TYPES.folders,
        category,
      })),
    )

  const notes = await ctx.db
    .query('notes')
    .withIndex('by_campaign_category_parent', (q) =>
      q
        .eq('campaignId', campaignId)
        .eq('categoryId', categoryId)
        .eq('parentFolderId', parentId),
    )
    .collect()
    .then((notes) =>
      notes.map((note) => ({
        ...note,
        type: SIDEBAR_ITEM_TYPES.notes,
        category,
        tag: tags.find((t) => t._id === note.tagId),
      })),
    )

  return [...folders, ...notes] as AnySidebarItem[]
}
