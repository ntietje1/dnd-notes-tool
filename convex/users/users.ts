import { UserIdentity } from 'convex/server'
import { MutationCtx } from '../_generated/server'
import { requireUserIdentity } from '../common/identity'
import { Ctx } from '../common/types'
import { UserProfile } from './types'
import { Id } from '../_generated/dataModel'

export async function getUserProfileByUserIdHandler(ctx: Ctx, userId: string) {
  const profile = await ctx.db
    .query('userProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique()
  return profile
}

export async function getUserProfileByUsernameHandler(
  ctx: Ctx,
  username: string,
) {
  const profile = await ctx.db
    .query('userProfiles')
    .withIndex('by_username', (q) => q.eq('username', username))
    .unique()
  return profile
}

const MAX_USERNAME_TRIES = 10

export async function createUserProfileHandler(
  ctx: MutationCtx,
  identity: UserIdentity,
): Promise<Id<'userProfiles'>> {
  // Generate a unique username
  const baseUsername =
    identity.preferredUsername ||
    identity.email?.split('@')[0] ||
    `user${identity.subject.slice(-8)}`

  let username = baseUsername
  let counter = 1

  while (true) {
    const existingUsername = await ctx.db
      .query('userProfiles')
      .withIndex('by_username', (q) => q.eq('username', username))
      .unique()

    if (!existingUsername || counter > MAX_USERNAME_TRIES) {
      break
    }

    username = `${baseUsername}${counter}`
    counter++
  }

  return await ctx.db.insert('userProfiles', {
    userId: identity.subject,
    username: username,
    email: identity.email,
    name: identity.name,
    firstName: identity.givenName,
    lastName: identity.familyName,
    updatedAt: Date.now(),
  })
}

export async function updateUserProfileHandler(
  ctx: MutationCtx,
  identity: UserIdentity,
): Promise<Id<'userProfiles'>> {
  const { profile } = await requireUserIdentity(ctx)
  const updates: Partial<UserProfile> = {}

  const username = identity.username as string

  if (username && username !== profile.username) {
    const existingUser = await ctx.db
      .query('userProfiles')
      .withIndex('by_username', (q) => q.eq('username', username))
      .unique()

    if (existingUser) {
      throw new Error('Username already taken')
    }
    updates.username = username
  }

  if (identity.name && identity.name !== profile.name) {
    updates.name = identity.name
  }

  if (identity.givenName && identity.givenName !== profile.firstName) {
    updates.firstName = identity.givenName
  }

  if (identity.familyName && identity.familyName !== profile.lastName) {
    updates.lastName = identity.familyName
  }

  if (Object.keys(updates).length > 0) {
    await ctx.db.patch(profile._id, {
      ...updates,
      updatedAt: Date.now(),
    })
  }

  return profile._id
}

export async function upsertUserProfileHandler(
  ctx: MutationCtx,
): Promise<Id<'userProfiles'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('User not authenticated')
  }

  const existingProfile = await getUserProfileByUserIdHandler(
    ctx,
    identity.subject,
  )

  if (existingProfile) {
    return await updateUserProfileHandler(ctx, identity)
  } else {
    return await createUserProfileHandler(ctx, identity)
  }
}

export async function deleteUserProfileHandler(
  ctx: MutationCtx,
): Promise<void> {
  const { profile } = await requireUserIdentity(ctx)
  await ctx.db.delete(profile._id)
}
