import type { Validator } from "@/lib/validation";

/**
 * Creates validators for campaign name field
 */
export function createCampaignNameValidators(): Validator[] {
  return [
    {
      validate: (value: string) => {
        if (!value || !value.trim()) {
          return { state: "error", message: "Campaign name is required" };
        }
        return { state: "success" };
      },
    },
    {
      validate: (value: string) => {
        if (value && value.trim().length < 3) {
          return { state: "error", message: "Campaign name must be at least 3 characters" };
        }
        return { state: "success" };
      },
    },
  ];
}