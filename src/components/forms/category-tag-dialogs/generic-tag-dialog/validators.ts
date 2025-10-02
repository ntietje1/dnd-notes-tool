import { api } from 'convex/_generated/api'
import type { ConvexReactClient } from 'convex/react'
import type { Id } from 'convex/_generated/dataModel'
import { MAX_NAME_LENGTH } from '../base-tag-dialog/types'

export function validateTagDescription(
  value: string,
  maxLength: number,
  singular: string,
): string | undefined {
  const v = value.trim()
  if (!v) return undefined
  if (v.length > maxLength)
    return `${singular} description must be ${maxLength} characters or fewer`
  return undefined
}

export function validateTagName(
  value: string,
  maxLength: number,
  singular: string,
): string | undefined {
  const v = value.trim()
  if (!v) return `${singular} name is required`
  if (v.length > maxLength)
    return `${singular} name must be ${maxLength} characters or fewer`
  return undefined
}

export async function validateTagNameAsync(
  convex: ConvexReactClient,
  campaignId: Id<'campaigns'>,
  displayName: string,
  excludeTagId?: Id<'tags'>,
): Promise<string | undefined> {
  const syncErr = validateTagName(displayName, MAX_NAME_LENGTH, 'Tag')
  if (syncErr) return syncErr

  const exists = await convex.query(api.tags.queries.checkTagNameExists, {
    campaignId,
    tagName: displayName.trim(),
    excludeTagId,
  })

  return exists ? 'This name is already taken.' : undefined
}
