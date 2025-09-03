import { validateCampaignName } from "../../../-components/campaign-form-validators";

export function validateCampaignSettingsName(value: string): string | undefined {
  return validateCampaignName(value);
}
