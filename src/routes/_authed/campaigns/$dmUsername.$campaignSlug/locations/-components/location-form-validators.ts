export function validateLocationName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Location name is required";
  if (v.length > 50) return "Location name must be less than 100 characters";
  return undefined;
}

import { api } from "convex/_generated/api";
import type { ConvexReactClient } from "convex/react";
import type { Id } from "convex/_generated/dataModel";

export async function validateLocationNameAsync(
  convex: ConvexReactClient,
  campaignId: Id<"campaigns">,
  displayName: string,
  excludeTagId?: Id<"tags">
): Promise<string | undefined> {
  const syncErr = validateLocationName(displayName);
  if (syncErr) return undefined;

  const exists = await convex.query(api.tags.queries.checkTagNameExists, {
    campaignId,
    displayName: displayName.trim(),
    excludeTagId,
  });
  return exists ? "This name is already taken." : undefined;
}

