export function validateCharacterName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Character name is required";
  if (v.length > 50) return "Character name must be 50 characters or fewer";
  return undefined;
}

import { api } from "convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { Id } from "convex/_generated/dataModel";

export async function validateCharacterNameAsync(
  convex: ConvexReactClient,
  campaignId: Id<"campaigns">,
  displayName: string,
  excludeTagId?: Id<"tags">
): Promise<string | undefined> {
  const syncErr = validateCharacterName(displayName);
  if (syncErr) return undefined;

  const exists = await convex.query(api.tags.queries.checkTagNameExists, {
    campaignId,
    displayName: displayName.trim(),
    excludeTagId,
  });
  return exists ? "This name is already taken." : undefined;
}

