import { AsyncValidator } from "@/lib/use-async-validation";
import { api } from "@/convex/_generated/api";
import { ConvexReactClient } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

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
      if (!slug) return "Campaign link is required";
      if (slug.length < 4) return "Campaign link must be at least 4 characters";
      if (slug.length > 30) return "Campaign link must be less than 30 characters";
      
      // Format validation
      const formatted = formatSlug(slug);
      if (formatted !== slug) {
        return "Link can only contain lowercase letters, numbers, and single hyphens";
      }
      
      if (slug.startsWith("-") || slug.endsWith("-")) {
        return "Link cannot start or end with a hyphen";
      }
      
      // Check if slug exists
      const exists = await convex.query(api.campaigns.queries.checkCampaignSlugExists, {
        slug,
        excludeCampaignId: context?.excludeCampaignId || excludeCampaignId,
      });
      
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