import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { getTag } from '../tags/tags'
import { CAMPAIGN_MEMBER_ROLE } from '../campaigns/types'
import { requireCampaignMembership } from '../campaigns/campaigns'
import { Id } from '../_generated/dataModel'

export const createCharacter = mutation({
  args: {
    tagId: v.id('tags'),
    playerId: v.optional(v.id('campaignMembers')),
  },
  returns: v.id('characters'),
  handler: async (ctx, args): Promise<Id<'characters'>> => {
    console.log('createCharacter.playerId', args.playerId)
    const tag = await getTag(ctx, args.tagId)
    await requireCampaignMembership(
      ctx,
      { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    if (args.playerId) {
      const player = await ctx.db.get(args.playerId)
      if (!player) {
        throw new Error('Player not found')
      }
      if (player.campaignId !== tag.campaignId) {
        throw new Error('Player not found in campaign')
      }
    }

    const characterId = await ctx.db.insert('characters', {
      campaignId: tag.campaignId,
      tagId: tag._id,
      playerId: args.playerId,
    })

    return characterId
  },
})

export const updateCharacter = mutation({
  args: {
    characterId: v.id('characters'),
    playerId: v.optional(v.id('campaignMembers')),
  },
  returns: v.id('characters'),
  handler: async (ctx, args): Promise<Id<'characters'>> => {
    console.log('updateCharacter.playerId', args.playerId)
    const character = await ctx.db.get(args.characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: character.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    if (args.playerId) {
      const player = await ctx.db.get(args.playerId)
      if (!player || player.campaignId !== character.campaignId) {
        throw new Error(
          'Player must belong to the same campaign as the character',
        )
      }

      await ctx.db.patch(args.characterId, {
        playerId: args.playerId,
      })
    }

    return args.characterId
  },
})

export const deleteCharacter = mutation({
  args: {
    characterId: v.id('characters'),
  },
  returns: v.id('characters'),
  handler: async (ctx, args): Promise<Id<'characters'>> => {
    const character = await ctx.db.get(args.characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: character.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    return args.characterId
  },
})
