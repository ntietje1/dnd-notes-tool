import { validateCampaignName } from "~/routes/_authed/campaigns/-components/campaign-form-validators";

export function validateCampaignSettingsName(value: string): string | undefined {
  return validateCampaignName(value);
}
