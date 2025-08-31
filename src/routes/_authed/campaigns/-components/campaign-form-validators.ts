import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { ConvexReactClient } from "convex/react";

/**
 * Formats a slug to the expected format (letters, numbers, single hyphens).
 */
export function removeInvalidCharacters(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/--+/g, "-")
}

export function validateCampaignName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Campaign name is required";
  if (v.length < 3) return "Campaign name must be at least 3 characters";
  return undefined;
}

export function validateCampaignSlugSync(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Campaign link is required";
  const normalized = removeInvalidCharacters(trimmed);
  if (normalized !== trimmed) {
    return "Link can only contain letters, numbers, and single hyphens";
  }
  if (normalized.startsWith("-") || normalized.endsWith("-")) {
    return "Link cannot start or end with a hyphen";
  }
  if (normalized.length < 3) return "Campaign link must be at least 3 characters";
  if (normalized.length > 30) return "Campaign link must be less than 30 characters";
  return undefined;
}

export async function validateCampaignSlugAsync(
  convex: ConvexReactClient,
  normalizedSlug: string,
  excludeCampaignId?: Id<"campaigns">
): Promise<string | undefined> {
  const exists = await convex.query(api.campaigns.queries.checkCampaignSlugExists, {
    slug: normalizedSlug,
    excludeCampaignId,
  });
  return exists ? "This link is already taken." : undefined;
}