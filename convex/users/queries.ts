import { v } from 'convex/values'
import { query } from '../_generated/server'
import { UserProfile } from './types'
import {
  getUserProfileByUserIdHandler,
  getUserProfileByUsernameHandler,
} from './users'

export const getUserProfile = query({
  handler: async (ctx): Promise<UserProfile | null> => {
    const userIdentity = await ctx.auth.getUserIdentity()
    if (!userIdentity) return null
    return await getUserProfileByUserIdHandler(ctx, userIdentity.subject)
  },
})

export const getUserProfileByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<UserProfile | null> => {
    return await getUserProfileByUserIdHandler(ctx, args.userId)
  },
})

export const getUserProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args): Promise<UserProfile | null> => {
    return await getUserProfileByUsernameHandler(ctx, args.username)
  },
})
