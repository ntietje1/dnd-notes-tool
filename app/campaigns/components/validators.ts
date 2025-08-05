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
    .replace(/--+/g, "-");
};

const linkFormatValidator: Validator<string> = {
  validate: (value) => {
    if (!value) return { state: "none" };
    const formatted = formatLink(value);
    if (formatted === value) {
      return { state: "success" };
    }
    return {
      state: "error",
      message: "Link can only contain lowercase letters, numbers, and single hyphens",
    };
  },
};

const leadingOrTrailingHyphenValidator: Validator<string> = {
  validate: (value) => {
    if (!value) return { state: "none" };
    if (value.startsWith("-") || value.endsWith("-")) {
      return { state: "error", message: "Link cannot start or end with a hyphen" };
    }
    return { state: "success" };
  },
};

const slugExistsValidator = (slugExists: boolean): Validator<string> => {
  return slugExists ? {
    validate: (_) => {
      return { state: "error", message: `This link is already taken.` };
    },
  } : {
    validate: (_) => {
      return { state: "success" };
    },
  };
};

export const campaignNameValidators: Validator[] = [
  required("Campaign name is required"),
  minLength(3, "Campaign name must be at least 3 characters"),
];

export const linkValidators = (slugExists: boolean): Validator<string>[] => {
  return [
    required("Campaign link is required"),
    minLength(4, "Campaign link must be at least 4 characters"),
    maxLength(30, "Campaign link must be less than 30 characters"),
    linkFormatValidator,
    leadingOrTrailingHyphenValidator,
    slugExistsValidator(slugExists),
  ];
};