import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a campaign link URL
 * @param campaignSlug - The campaign's slug
 * @param dmUsername - The DM's username
 * @param baseUrl - The base URL (e.g., "https://example.com")
 * @returns The complete campaign URL
 */
export function createCampaignLink(
  campaignSlug: string,
  dmUsername: string,
  baseUrl: string
): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/${dmUsername}/campaigns/${campaignSlug}`;
}
