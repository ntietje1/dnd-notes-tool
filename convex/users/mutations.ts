import { mutation } from '../_generated/server'
import { upsertUserProfileHandler } from './users'
import { Id } from '../_generated/dataModel'

export const ensureUserProfile = mutation({
  handler: async (ctx): Promise<Id<'userProfiles'>> => {
    return await upsertUserProfileHandler(ctx)
  },
})
