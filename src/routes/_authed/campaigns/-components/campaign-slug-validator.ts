import { type AsyncValidator } from "~/lib/use-async-validation";
import { api } from "convex/_generated/api";
import { ConvexReactClient } from "convex/react";
import type { Id } from "convex/_generated/dataModel";

export interface CampaignSlugValidatorContext {
  convex: ConvexReactClient;
  excludeCampaignId?: Id<"campaigns">;
}

/**
 * Creates an async validator for campaign slugs
 * 
 * @param convex - The Convex client instance
 * @param excludeCampaignId - Optional campaign ID to exclude from the check (for edit mode)
 * @returns AsyncValidator for campaign slug validation
 */
export function createCampaignSlugValidator(
  convex: ConvexReactClient,
  excludeCampaignId?: Id<"campaigns">
): AsyncValidator<CampaignSlugValidatorContext> {
  return {
    validate: async (slug: string, context?: CampaignSlugValidatorContext) => {
      const trimmed = slug.trim();
      if (!trimmed) return "Campaign link is required";

      // Normalize and validate format
      const normalized = formatSlug(trimmed);
      if (normalized !== trimmed) {
        return "Link can only contain lowercase letters, numbers, and single hyphens";
      }

      if (normalized.startsWith("-") || normalized.endsWith("-")) {
        return "Link cannot start or end with a hyphen";
      }

      if (normalized.length < 3) return "Campaign link must be at least 3 characters";
      if (normalized.length > 30) return "Campaign link must be less than 30 characters";

      // Check if slug exists (respect excludeCampaignId for edit mode)
      const exists = await convex.query(
        api.campaigns.queries.checkCampaignSlugExists,
        {
          slug: normalized,
          excludeCampaignId: context?.excludeCampaignId || excludeCampaignId,
        },
      );

      if (exists) {
        return "This link is already taken.";
      }

      return true;
    },
    context: {
      convex,
      excludeCampaignId,
    },
  };
}

/**
 * Formats a slug to the expected format
 */
export function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-");
}