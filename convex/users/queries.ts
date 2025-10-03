import { v } from 'convex/values'
import { query } from '../_generated/server'
import { userProfileValidator } from './schema'
import { UserProfile } from './types'
import { getUserProfileByUserIdHandler } from './users'

export const getUserProfile = query({
  returns: v.union(v.null(), userProfileValidator),
  handler: async (ctx): Promise<UserProfile | null> => {
    const userIdentity = await ctx.auth.getUserIdentity()
    if (!userIdentity) return null
    return await getUserProfileByUserIdHandler(ctx, userIdentity.subject)
  },
})
