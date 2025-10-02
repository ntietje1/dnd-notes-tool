import { v } from 'convex/values'
import { query } from '../_generated/server'
import { CAMPAIGN_MEMBER_ROLE } from '../campaigns/types'
import { requireCampaignMembership } from '../campaigns/campaigns'
import { SYSTEM_TAG_CATEGORY_NAMES } from '../tags/types'
import { getTag, getTagCategoryByName, getTagsByCategory } from '../tags/tags'
import { Character } from './types'
import { combineCharacterAndTag } from './characters'

export const getCharactersByCampaign = query({
  args: {
    campaignId: v.id('campaigns'),
  },
  handler: async (ctx, args): Promise<Character[]> => {
    await requireCampaignMembership(
      ctx,
      { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    ) //TODO: allow players to see characters that have been "introduced" to them

    const category = await getTagCategoryByName(
      ctx,
      args.campaignId,
      SYSTEM_TAG_CATEGORY_NAMES.Character,
    )
    const tags = await getTagsByCategory(ctx, category._id)
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_campaign_tag', (q) => q.eq('campaignId', args.campaignId))
      .collect()

    const charsByTagId = new Map(characters.map((c) => [c.tagId, c]))

    return tags
      .map((t) => {
        const character = charsByTagId.get(t._id)
        if (!character) {
          console.warn(`Character not found for tag ${t._id}`)
          return null
        }
        return combineCharacterAndTag(character, t)
      })
      .filter((c) => c !== null)
      .sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const getCharacterById = query({
  args: {
    characterId: v.id('characters'),
  },
  handler: async (ctx, args): Promise<Character> => {
    const character = await ctx.db.get(args.characterId)
    if (!character) {
      throw new Error(`Character not found: ${args.characterId}`)
    }

    const tag = await getTag(ctx, character.tagId)

    await requireCampaignMembership(
      ctx,
      { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    ) //TODO: allow players to see characters that have been "introduced" to them

    return combineCharacterAndTag(character, tag)
  },
})

export const getCharacterByTagId = query({
  args: {
    tagId: v.id('tags'),
  },
  handler: async (ctx, args): Promise<Character> => {
    const tag = await getTag(ctx, args.tagId)

    await requireCampaignMembership(
      ctx,
      { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const character = await ctx.db
      .query('characters')
      .withIndex('by_campaign_tag', (q) =>
        q.eq('campaignId', tag.campaignId).eq('tagId', tag._id),
      )
      .unique()

    if (!character) {
      throw new Error(`Character not found: ${args.tagId}`)
    }

    return combineCharacterAndTag(character, tag)
  },
})
