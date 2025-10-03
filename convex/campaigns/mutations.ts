import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireUserIdentity } from '../common/identity'
import {
  CAMPAIGN_MEMBER_ROLE,
  CAMPAIGN_MEMBER_STATUS,
  CAMPAIGN_STATUS,
  CampaignMemberStatus,
} from './types'
import { ensureDefaultTagCategories } from '../tags/tags'
import {
  ensureAllPlayerSharedTags,
  ensurePlayerSharedTag,
  ensureSharedAllTag,
} from '../tags/shared'
import { requireCampaignMembership } from './campaigns'
import { Id } from '../_generated/dataModel'
import { getUserProfileByUsernameHandler } from '../users/users'
import { campaignMemberStatusValidator } from './schema'

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
  },
  returns: v.id('campaigns'),
  handler: async (ctx, args): Promise<Id<'campaigns'>> => {
    const { profile } = await requireUserIdentity(ctx)

    const now = Date.now()

    const existingCampaign = await ctx.db
      .query('campaigns')
      .withIndex('by_slug_dm', (q) =>
        q.eq('slug', args.slug).eq('dmUserId', profile.userId),
      )
      .unique()

    if (existingCampaign) {
      throw new Error('Slug already exists')
    }

    const campaignId = await ctx.db.insert('campaigns', {
      name: args.name,
      description: args.description,
      updatedAt: now,
      playerCount: 0,
      dmUserId: profile.userId,
      slug: args.slug,
      status: CAMPAIGN_STATUS.Active,
    })

    await ctx.db.insert('campaignMembers', {
      userId: profile.userId,
      campaignId,
      role: CAMPAIGN_MEMBER_ROLE.DM,
      status: CAMPAIGN_MEMBER_STATUS.Accepted,
      updatedAt: now,
    })

    await ensureDefaultTagCategories(ctx, campaignId)
    await ensureSharedAllTag(ctx, campaignId)
    await ensureAllPlayerSharedTags(ctx, campaignId)
    return campaignId
  },
})

export const joinCampaign = mutation({
  args: {
    dmUsername: v.string(),
    slug: v.string(),
  },
  returns: campaignMemberStatusValidator,
  handler: async (ctx, args): Promise<CampaignMemberStatus> => {
    const { profile } = await requireUserIdentity(ctx)

    const dmUserProfile = await getUserProfileByUsernameHandler(
      ctx,
      args.dmUsername,
    )
    if (!dmUserProfile) {
      throw new Error('Campaign not found')
    }

    const campaign = await ctx.db
      .query('campaigns')
      .withIndex('by_slug_dm', (q) =>
        q.eq('slug', args.slug).eq('dmUserId', dmUserProfile.userId),
      )
      .unique()

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const campaignMembers = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaign', (q) => q.eq('campaignId', campaign._id))
      .collect()

    if (campaignMembers.some((member) => member.userId === profile.userId)) {
      return campaignMembers.find((member) => member.userId === profile.userId)!
        .status
    }

    const now = Date.now()

    const memberId = await ctx.db.insert('campaignMembers', {
      userId: profile.userId,
      campaignId: campaign._id,
      role: CAMPAIGN_MEMBER_ROLE.Player,
      status: CAMPAIGN_MEMBER_STATUS.Pending,
      updatedAt: now,
    })

    await ensurePlayerSharedTag(ctx, campaign._id, memberId)

    return CAMPAIGN_MEMBER_STATUS.Pending
  },
})

export const updateCampaign = mutation({
  args: {
    campaignId: v.id('campaigns'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  returns: v.id('campaigns'),
  handler: async (ctx, args): Promise<Id<'campaigns'>> => {
    const { identityWithProfile, campaignWithMembership } =
      await requireCampaignMembership(
        ctx,
        { campaignId: args.campaignId },
        { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
      )
    const { profile } = identityWithProfile
    const { campaign } = campaignWithMembership

    const now = Date.now()

    const campaignUpdates: {
      name?: string
      description?: string
      slug?: string
      updatedAt: number
    } = {
      updatedAt: now,
    }

    if (args.name !== undefined) {
      campaignUpdates.name = args.name
    }
    if (args.description !== undefined) {
      campaignUpdates.description = args.description
    }

    if (args.slug !== undefined) {
      const existingCampaign = await ctx.db
        .query('campaigns')
        .withIndex('by_slug_dm', (q) =>
          q.eq('slug', args.slug!).eq('dmUserId', profile.userId),
        )
        .unique()

      if (existingCampaign && existingCampaign._id !== campaign._id) {
        throw new Error('Slug already exists')
      }
    }

    await ctx.db.patch(campaign._id, campaignUpdates)

    return campaign._id
  },
})

export const deleteCampaign = mutation({
  args: {
    campaignId: v.id('campaigns'),
  },
  returns: v.id('campaigns'),
  handler: async (ctx, args): Promise<Id<'campaigns'>> => {
    await requireCampaignMembership(
      ctx,
      { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] },
    )

    const blocks = await ctx.db
      .query('blocks')
      .withIndex('by_campaign_note_toplevel_pos', (q) =>
        q.eq('campaignId', args.campaignId),
      )
      .collect()

    for (const block of blocks) {
      await ctx.db.delete(block._id)
    }

    const notes = await ctx.db
      .query('notes')
      .withIndex('by_campaign_category_parent', (q) =>
        q.eq('campaignId', args.campaignId),
      )
      .collect()

    for (const note of notes) {
      await ctx.db.delete(note._id)
    }

    const folders = await ctx.db
      .query('folders')
      .withIndex('by_campaign_category_parent', (q) =>
        q.eq('campaignId', args.campaignId),
      )
      .collect()

    for (const folder of folders) {
      await ctx.db.delete(folder._id)
    }

    const tagCategories = await ctx.db
      .query('tagCategories')
      .withIndex('by_campaign_name', (q) => q.eq('campaignId', args.campaignId))
      .collect()

    for (const category of tagCategories) {
      await ctx.db.delete(category._id)
    }

    const campaignTags = await ctx.db
      .query('tags')
      .withIndex('by_campaign_categoryId', (q) =>
        q.eq('campaignId', args.campaignId),
      )
      .collect()

    for (const tag of campaignTags) {
      await ctx.db.delete(tag._id)
    }

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_campaign_tag', (q) => q.eq('campaignId', args.campaignId))
      .collect()

    for (const location of locations) {
      await ctx.db.delete(location._id)
    }

    const characters = await ctx.db
      .query('characters')
      .withIndex('by_campaign_tag', (q) => q.eq('campaignId', args.campaignId))
      .collect()

    for (const character of characters) {
      await ctx.db.delete(character._id)
    }

    const campaignMembers = await ctx.db
      .query('campaignMembers')
      .withIndex('by_campaign', (q) => q.eq('campaignId', args.campaignId))
      .collect()

    for (const member of campaignMembers) {
      await ctx.db.delete(member._id)
    }

    await ctx.db.delete(args.campaignId)

    return args.campaignId
  },
})

export const updateCampaignMemberStatus = mutation({
  args: {
    memberId: v.id('campaignMembers'),
    status: v.union(
      v.literal('Accepted'),
      v.literal('Pending'),
      v.literal('Rejected'),
      v.literal('Removed'),
    ),
  },
  returns: v.id('campaignMembers'),
  handler: async (ctx, args): Promise<Id<'campaignMembers'>> => {
    const { profile } = await requireUserIdentity(ctx)

    const member = await ctx.db.get(args.memberId)
    if (!member) {
      throw new Error('Member not found')
    }

    const campaign = await ctx.db.get(member.campaignId)
    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Only allow updating players, not the DM membership
    if (member.role !== CAMPAIGN_MEMBER_ROLE.Player) {
      throw new Error('Only player membership status can be changed')
    }

    // Verify caller is the DM of this campaign
    const callerMembership = await ctx.db
      .query('campaignMembers')
      .withIndex('by_user', (q) => q.eq('userId', profile.userId))
      .collect()

    const callerAsDm = callerMembership.find(
      (m) =>
        m.campaignId === member.campaignId &&
        m.role === CAMPAIGN_MEMBER_ROLE.DM,
    )
    if (!callerAsDm) {
      throw new Error('Only the DM can update player status')
    }

    const now = Date.now()
    await ctx.db.patch(member._id, { status: args.status, updatedAt: now })

    if (
      args.status === CAMPAIGN_MEMBER_STATUS.Accepted &&
      member.status !== CAMPAIGN_MEMBER_STATUS.Accepted
    ) {
      await ctx.db.patch(member.campaignId, {
        playerCount: Math.max(0, campaign.playerCount + 1),
        updatedAt: now,
      })
    } else if (
      args.status === CAMPAIGN_MEMBER_STATUS.Removed &&
      member.status === CAMPAIGN_MEMBER_STATUS.Accepted
    ) {
      await ctx.db.patch(member.campaignId, {
        playerCount: Math.max(0, campaign.playerCount - 1),
        updatedAt: now,
      })
    }

    return member._id
  },
})
