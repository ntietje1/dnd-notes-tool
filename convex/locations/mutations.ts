import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { deleteTagAndCleanupContent, getTag } from '../tags/tags'
import { CAMPAIGN_MEMBER_ROLE } from '../campaigns/types'
import { requireCampaignMembership } from '../campaigns/campaigns'
import { Id } from '../_generated/dataModel'

export const createLocation = mutation({
  args: {
    tagId: v.id('tags'),
  },
  handler: async (ctx, args): Promise<Id<'locations'>> => {
    const tag = await getTag(ctx, args.tagId)
    await requireCampaignMembership(
      ctx,
      { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const locationId = await ctx.db.insert('locations', {
      campaignId: tag.campaignId,
      tagId: tag._id,
    })

    return locationId
  },
})

export const updateLocation = mutation({
  args: {
    locationId: v.id('locations'),
  },
  handler: async (ctx, args): Promise<Id<'locations'>> => {
    const location = await ctx.db.get(args.locationId)
    if (!location) {
      throw new Error('Location not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: location.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    await ctx.db.patch(args.locationId, {
      // put location specific fields here
    })

    return args.locationId
  },
})

export const deleteLocation = mutation({
  args: {
    locationId: v.id('locations'),
  },
  handler: async (ctx, args): Promise<Id<'locations'>> => {
    const location = await ctx.db.get(args.locationId)
    if (!location) {
      throw new Error('Character not found')
    }

    await requireCampaignMembership(
      ctx,
      { campaignId: location.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    await deleteTagAndCleanupContent(ctx, location.tagId)
    await ctx.db.delete(args.locationId)

    return args.locationId
  },
})
