import {
  required,
  minLength,
  type Validator,
  maxLength,
} from "@/lib/validation";

const formatLink = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
};

const linkFormatValidator: Validator<string> = {
  validate: (value) => {
    if (!value) return { state: "none" };
    const formatted = formatLink(value);
    return {
      state: formatted === value ? "success" : "error",
      message:
        "Link can only contain lowercase letters, numbers, and single hyphens",
    };
  },
};

export const campaignNameValidators: Validator[] = [
  required("Campaign name is required"),
  minLength(3, "Campaign name must be at least 3 characters"),
];

export const playerCountValidators: Validator<string>[] = [
  {
    validate: (value) => {
      if (value === "")
        return { state: "error", message: "Number of players is required" };
      const num = Number(value);
      if (isNaN(num))
        return { state: "error", message: "Please enter a valid number" };
      if (num < 1 || num > 8)
        return {
          state: "error",
          message: "Player count must be between 1 and 8",
        };
      return { state: "success" };
    },
  },
];

export const customLinkValidators = (
  checkTokenExists: (token: string) => Promise<boolean>,
): Validator<string>[] => {
  const availabilityValidator: Validator<string> = {
    validate: async (value: string) => {
      if (!value || value.length < 3) return { state: "none" };
      try {
        const exists = await checkTokenExists(value);
        return {
          state: exists ? "error" : "success",
          message: exists ? "This link is already taken" : undefined,
          successMessage: "Your campaign link looks good!",
          showSuccess: true,
        };
      } catch (error) {
        return {
          state: "error",
          message: "Failed to check link availability",
        };
      }
    },
    message: "Checking link availability...",
  };

  const baseLinkValidators: Validator<string>[] = [
    required("Campaign link is required"),
    linkFormatValidator,
    minLength(4, "Campaign link must be at least 4 characters"),
    maxLength(30, "Campaign link must be less than 30 characters"),
  ];

  return [...baseLinkValidators, availabilityValidator];
};
