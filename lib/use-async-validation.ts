"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash-es";

export type AsyncValidationState = "idle" | "validating" | "valid" | "invalid";

export interface AsyncValidationResult {
  state: AsyncValidationState;
  error?: string;
  isValidating: boolean;
}

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
  validator: AsyncValidator | null,
  options: AsyncValidationOptions = {}
): AsyncValidationResult {
  const {
    minLength = 0,
    debounceMs = 500,
    validateOnChange = true,
    enabled = true,
    errorDisplayDelay = 0,
  } = options;

  const [debouncedValue, setDebouncedValue] = useState(value);
  const [validationState, setValidationState] = useState<AsyncValidationState>("idle");
  const [error, setError] = useState<string | undefined>();
  const [displayedError, setDisplayedError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);

  // Create debounced functions
  const debouncedSetValue = useMemo(
    () => debounce((newValue: string) => {
      setDebouncedValue(newValue);
    }, debounceMs),
    [debounceMs]
  );

  const debouncedSetDisplayedError = useMemo(
    () => debounce((error: string | undefined) => {
      setDisplayedError(error);
    }, errorDisplayDelay),
    [errorDisplayDelay]
  );

  // Update debounced value when input value changes
  useEffect(() => {
    if (enabled && validateOnChange && value.length >= minLength) {
      setIsValidating(true);
      setValidationState("validating");
    }
    
    // Clear displayed error immediately when user starts typing (if we have error display delay)
    if (errorDisplayDelay > 0 && displayedError) {
      setDisplayedError(undefined);
      debouncedSetDisplayedError.cancel();
    }
    
    debouncedSetValue(value);
    
    return () => {
      debouncedSetValue.cancel();
      debouncedSetDisplayedError.cancel();
    };
  }, [value, debouncedSetValue, debouncedSetDisplayedError, enabled, validateOnChange, minLength, errorDisplayDelay, displayedError]);

  // Handle error display debouncing
  useEffect(() => {
    if (errorDisplayDelay > 0) {
      if (error) {
        debouncedSetDisplayedError(error);
      } else {
        debouncedSetDisplayedError.cancel();
        setDisplayedError(undefined);
      }
    } else {
      setDisplayedError(error);
    }
  }, [error, errorDisplayDelay, debouncedSetDisplayedError]);

  // Run validation when debounced value changes
  useEffect(() => {
    if (!enabled || !validator || !validateOnChange) {
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

    // Only validate if the debounced value matches the current value
    if (debouncedValue !== value) {
      return;
    }

    const runValidation = async () => {
      try {
        const result = await validator.validate(debouncedValue, validator.context);
        
        // Check if value is still current (prevent race conditions)
        if (debouncedValue === value) {
          setIsValidating(false);
          if (result === true) {
            setValidationState("valid");
            setError(undefined);
          } else {
            setValidationState("invalid");
            setError(typeof result === "string" ? result : "Validation failed");
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
  }, [debouncedValue, value, validator, enabled, validateOnChange, minLength]);

  // Manual validation trigger
  const validate = useCallback(async (): Promise<boolean> => {
    if (!validator || !enabled) return true;

    setIsValidating(true);
    setValidationState("validating");

    try {
      const result = await validator.validate(value, validator.context);
      setIsValidating(false);
      
      if (result === true) {
        setValidationState("valid");
        setError(undefined);
        return true;
      } else {
        setValidationState("invalid");
        setError(typeof result === "string" ? result : "Validation failed");
        return false;
      }
    } catch (err) {
      setIsValidating(false);
      setValidationState("invalid");
      setError(err instanceof Error ? err.message : "Validation error");
      return false;
    }
  }, [value, validator, enabled]);

  return {
    state: validationState,
    error: displayedError,
    isValidating,
    validate,
  } as AsyncValidationResult & { validate: () => Promise<boolean> };
}