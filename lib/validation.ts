export type ValidationState = "none" | "success" | "loading" | "error";

export interface ValidationResult {
  state: ValidationState;
  message?: string;
  showSuccess?: boolean;
  successMessage?: string;
}

export interface Validator<T = any> {
  validate: (value: T) => Promise<ValidationResult> | ValidationResult;
  message?: string;
  showSuccess?: boolean;
  successMessage?: string;
}

export const combineValidators = <T>(validators: Validator<T>[]) => {
  return async (value: T): Promise<ValidationResult> => {
    for (const validator of validators) {
      const result = await validator.validate(value);
      if (result.state !== "success") {
        return result;
      }
    }
    // Use showSuccess and successMessage from the last validator that specified them
    const lastValidator = validators
      .slice()
      .reverse()
      .find(
        (v) =>
          typeof v.showSuccess !== "undefined" ||
          typeof v.successMessage !== "undefined",
      );
    return {
      state: "success",
      showSuccess: lastValidator?.showSuccess,
      successMessage: lastValidator?.successMessage,
    };
  };
};

// Common validators
export const required = (message = "This field is required"): Validator => ({
  validate: (value: any) => ({
    state:
      (!value && value !== 0) || (typeof value === "string" && !value.trim())
        ? "error"
        : "success",
    message,
  }),
});

export const minLength = (
  min: number,
  message?: string,
): Validator<string> => ({
  validate: (value) => ({
    state: value.length < min ? "error" : "success",
    message: message || `Must be at least ${min} characters`,
  }),
});

export const maxLength = (
  max: number,
  message?: string,
): Validator<string> => ({
  validate: (value) => ({
    state: value.length > max ? "error" : "success",
    message: message || `Must be at most ${max} characters`,
  }),
});

export const isValidNumber = (
  message = "Please enter a valid number",
): Validator<string> => ({
  validate: (value) => {
    if (value === "") {
      return { state: "none" };
    }
    return {
      state: !isNaN(Number(value)) ? "success" : "error",
      message,
      showSuccess: false,
    };
  },
});

export const numberRange = (
  min: number,
  max: number,
  message?: string,
): Validator<string | number> => ({
  validate: (value) => {
    if (value === "") {
      return { state: "none" };
    }
    const num = typeof value === "string" ? Number(value) : value;
    if (isNaN(num)) {
      return { state: "error", message: "Please enter a valid number" };
    }
    return {
      state: num < min || num > max ? "error" : "success",
      message: message || `Must be between ${min} and ${max}`,
      showSuccess: false,
    };
  },
});

export const pattern = (regex: RegExp, message: string): Validator<string> => ({
  validate: (value) => ({
    state: !regex.test(value) ? "error" : "success",
    message,
  }),
});

// Async validator helper
export const createAsyncValidator = <T>(
  validateFn: (value: T) => Promise<boolean>,
  errorMessage: string,
  loadingMessage: string,
  successMessage?: string,
): Validator<T> => ({
  validate: async (value) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return { state: "none" };
    }

    try {
      const result = await validateFn(value);
      return {
        state: result ? "success" : "error",
        message: result ? undefined : errorMessage,
        successMessage: result ? successMessage : undefined,
      };
    } catch (error) {
      return {
        state: "error",
        message: "Validation failed",
      };
    }
  },
  message: loadingMessage,
  showSuccess: true,
});
