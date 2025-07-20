import { required, minLength, maxLength } from "@/lib/validation";
import type { Validator } from "@/lib/validation";

const usernameFormatValidator: Validator<string> = {
    validate: (value) => {
      if (!value) return { state: "none" };
      const formatted = formatUsername(value);
      return {
        state: formatted === value ? "success" : "error",
        message:
          "Username can only contain letters, numbers, and single hyphens",
      };
    },
  };
  
  const usernameLeadingOrTrailingHyphenValidator: Validator<string> = {
    validate: (value) => {
      if (!value) return { state: "none" };
      if (value.startsWith("-") || value.endsWith("-")) {
        return { state: "error", message: "Username cannot start or end with a hyphen" };
      }
      return { state: "success" };
    },
  };

  const formatUsername = (value: string): string => {
    return value
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/--+/g, "-");
  };

export const usernameValidators = (usernameExists: boolean | undefined): Validator<string>[] => {
  return [
    required("Username is required"),
    minLength(3, "Username must be at least 3 characters"),
    maxLength(20, "Username must be at most 20 characters"),
    usernameFormatValidator,
    usernameLeadingOrTrailingHyphenValidator,
    {
        validate: (value: string) => {
          // Don't validate availability if username is too short or undefined
          if (!value || value.length < 3 || usernameExists === undefined) {
            return { state: "none" };
          }
          
          // usernameExists is true when username exists, so we want the opposite for availability
          const isAvailable = !usernameExists;
          
          return {
            state: isAvailable ? "success" : "error",
            message: isAvailable ? undefined : `Username ${value} already taken`,
            showSuccess: false
          };
        },
    }
    ];
};

export const displayNameValidators: Validator<string>[] = [
  maxLength(50, "Display name must be at most 50 characters"),
];
