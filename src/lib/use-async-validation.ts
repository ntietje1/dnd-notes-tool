import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { debounce } from "lodash-es";

export type AsyncValidationState = "idle" | "validating" | "valid" | "invalid";

export interface AsyncValidationResult {
  state: AsyncValidationState;
  error?: string;
  isValidating: boolean;
}

export type UseAsyncValidationResult = AsyncValidationResult & {
  validate: () => Promise<boolean>;
  forceShowError: () => void;
  rawError?: string;
};

export interface AsyncValidationOptions {
  /**
   * Minimum length before validation is triggered
   */
  minLength?: number;
  /**
   * Debounce delay in milliseconds
   */
  debounceMs?: number;
  /**
   * Whether to validate immediately on value change
   */
  validateOnChange?: boolean;
  /**
   * Whether validation should be enabled
   */
  enabled?: boolean;
  /**
   * Delay before showing error messages in milliseconds
   * Prevents errors from flashing while user is typing
   */
  errorDisplayDelay?: number;
  /**
   * Initial value; if provided and skipWhenEqualToInitial is true,
   * validation is bypassed when value === initialValue
   */
  initialValue?: string;
  /**
   * If true, validation is skipped when value equals initialValue
   */
  skipWhenEqualToInitial?: boolean;
}

export interface AsyncValidator<T = any> {
  /**
   * The validation function that returns a promise
   * Should return true for valid, string for error message
   */
  validate: (value: string, context?: T) => Promise<boolean | string>;
  /**
   * Optional context data to pass to the validator
   */
  context?: T;
}

/**
 * A reusable hook for async validation with debouncing
 *
 * @example
 * ```ts
 * const slugValidator: AsyncValidator = {
 *   validate: async (slug) => {
 *     const exists = await checkSlugExists(slug);
 *     return exists ? "Slug already taken" : true;
 *   }
 * };
 *
 * const validation = useAsyncValidation(
 *   slugValue,
 *   slugValidator,
 *   { minLength: 3, debounceMs: 500 }
 * );
 * ```
 */
export function useAsyncValidation(
  value: string,
  validators: AsyncValidator[] | null,
  options: AsyncValidationOptions = {},
): UseAsyncValidationResult {
  const {
    minLength = 0,
    debounceMs = 500,
    validateOnChange = true,
    enabled = true,
    errorDisplayDelay = 0,
    initialValue,
    skipWhenEqualToInitial = false,
  } = options;

  const [debouncedValue, setDebouncedValue] = useState(value);
  const [validationState, setValidationState] =
    useState<AsyncValidationState>("idle");
  const [error, setError] = useState<string | undefined>();
  const [displayedError, setDisplayedError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);
  const manualLockRef = useRef(false);

  // Create debounced functions
  const debouncedSetValue = useMemo(
    () =>
      debounce((newValue: string) => {
        setDebouncedValue(newValue);
      }, debounceMs),
    [debounceMs],
  );

  const debouncedSetDisplayedError = useMemo(
    () =>
      debounce((error: string | undefined) => {
        setDisplayedError(error);
      }, errorDisplayDelay),
    [errorDisplayDelay],
  );

  // Update debounced value when input value changes
  const lastValueRef = useRef<string>(value);
  useEffect(() => {
    const hasValueChanged = value !== lastValueRef.current;

    if (hasValueChanged) {
      // Unlock manual validation hold when user changes input
      manualLockRef.current = false;
      if (enabled && validateOnChange && value.length >= minLength) {
        setIsValidating(true);
        setValidationState("validating");
      }

      if (errorDisplayDelay > 0 && displayedError) {
        setDisplayedError(undefined);
        debouncedSetDisplayedError.cancel();
      }
    }

    debouncedSetValue(value);
    lastValueRef.current = value;

    return () => {
      debouncedSetValue.cancel();
      debouncedSetDisplayedError.cancel();
    };
  }, [
    value,
    debouncedSetValue,
    debouncedSetDisplayedError,
    enabled,
    validateOnChange,
    minLength,
    errorDisplayDelay,
    displayedError,
  ]);

  // Handle error display debouncing
  useEffect(() => {
    if (errorDisplayDelay > 0) {
      if (error) {
        debouncedSetDisplayedError(error);
      } else {
        debouncedSetDisplayedError.cancel();
        // Preserve the existing displayed error if nothing new to show,
        // prevents a brief flicker where the error disappears on blur
      }
    } else {
      setDisplayedError(error);
    }
  }, [error, errorDisplayDelay, debouncedSetDisplayedError]);

  const runValidators = async (val: string): Promise<true | string> => {
    if (!validators || validators.length === 0) return true;
    for (const v of validators) {
      const result = await v.validate(val, v.context);
      if (result !== true) {
        return typeof result === "string" ? result : "Validation failed";
      }
    }
    return true;
  };

  // Run validation when debounced value changes
  useEffect(() => {
    if (manualLockRef.current) {
      // Preserve manual validation result until the user types again
      return;
    }

    if (!enabled || !validators || validators.length === 0 || !validateOnChange) {
      setIsValidating(false);
      setValidationState("idle");
      setError(undefined);
      return;
    }

    if (debouncedValue.length < minLength) {
      setIsValidating(false);
      setValidationState("idle");
      setError(undefined);
      return;
    }

    if (skipWhenEqualToInitial && initialValue !== undefined && debouncedValue === initialValue) {
      setIsValidating(false);
      setValidationState("valid");
      setError(undefined);
      return;
    }

    // Only validate if the debounced value matches the current value
    if (debouncedValue !== value) {
      return;
    }

    const runValidation = async () => {
      try {
        const result = await runValidators(debouncedValue);

        // Check if value is still current (prevent race conditions)
        if (debouncedValue === value) {
          setIsValidating(false);
          if (result === true) {
            setValidationState("valid");
            setError(undefined);
          } else {
            setValidationState("invalid");
            setError(result);
          }
        }
      } catch (err) {
        if (debouncedValue === value) {
          setIsValidating(false);
          setValidationState("invalid");
          setError(err instanceof Error ? err.message : "Validation error");
        }
      }
    };

    runValidation();
  }, [debouncedValue, value, validators, enabled, validateOnChange, minLength, initialValue, skipWhenEqualToInitial]);

  // Manual validation trigger
  const validate = useCallback(async (): Promise<boolean> => {
    if (!validators || validators.length === 0 || !enabled) return true;

    if (skipWhenEqualToInitial && initialValue !== undefined && value === initialValue) {
      setValidationState("valid");
      setError(undefined);
      return true;
    }

    manualLockRef.current = true;
    setIsValidating(true);
    setValidationState("validating");

    try {
      const result = await runValidators(value);
      setIsValidating(false);

      if (result === true) {
        setValidationState("valid");
        setError(undefined);
        return true;
      } else {
        setValidationState("invalid");
        setError(result);
        return false;
      }
    } catch (err) {
      setIsValidating(false);
      setValidationState("invalid");
      setError(err instanceof Error ? err.message : "Validation error");
      return false;
    }
  }, [value, validators, enabled, skipWhenEqualToInitial, initialValue]);

  // Force immediate error display (bypass debounce)
  const forceShowError = useCallback(() => {
    if (error) {
      debouncedSetDisplayedError.cancel();
      setDisplayedError(error);
    }
  }, [error, debouncedSetDisplayedError]);

  const result: UseAsyncValidationResult = {
    state: validationState,
    error: displayedError,
    // Expose the immediate (non-debounced) error as well for external consumers
    rawError: error,
    isValidating,
    validate,
    forceShowError,
  };

  return result;
}
