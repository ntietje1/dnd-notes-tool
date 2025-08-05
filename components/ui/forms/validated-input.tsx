"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BaseValidatedInput } from "./base-validated-input";
import { debounce } from "lodash-es";
import type {
  ValidationResult,
  Validator,
  ValidationState,
} from "@/lib/validation";

export interface ValidatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  validators?: Validator[];
  helperText?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (result: ValidationResult) => void;
  icon?: React.ReactNode;
  errorDisplayDelay?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ValidatedInput({
  label,
  validators = [],
  helperText,
  validateOnChange = false,
  validateOnBlur = true,
  onValidationChange,
  className,
  onChange,
  onBlur,
  required,
  icon,
  errorDisplayDelay = 500,
  value = "",
  ...props
}: ValidatedInputProps) {
  const [validationState, setValidationState] = useState<ValidationResult>({
    state: "none",
  });
  const [displayedValidationState, setDisplayedValidationState] = useState<ValidationResult>({
    state: "none",
  });
  const [isDirty, setIsDirty] = useState(false);

  // Create debounced function for error display
  const debouncedSetDisplayedValidationState = useMemo(
    () => debounce((state: ValidationResult) => {
      setDisplayedValidationState(state);
    }, errorDisplayDelay),
    [errorDisplayDelay]
  );

  const runValidation = async (value: string) => {
    if (!validators.length) return { state: "none" as const };

    // Show loading state if any validator has a loading message
    const loadingValidator = validators.find((v) => v.message);
    if (loadingValidator) {
      const loadingState = {
        state: "loading" as const,
        message: loadingValidator.message,
      };
      setValidationState(loadingState);
      onValidationChange?.(loadingState);
    }

    // Run all validators in sequence
    for (const validator of validators) {
      const result = await validator.validate(value);
      if (result.state !== "success") {
        return result;
      }
      // Keep the first success message we find
      if (result.successMessage && result.showSuccess) {
        return result;
      }
    }

    return { state: "success" as const };
  };

  const handleValidation = async (value: string) => {
    const result = await runValidation(value);
    setValidationState(result);
    onValidationChange?.(result);
  };

  // Handle error display debouncing
  useEffect(() => {
    if (errorDisplayDelay > 0) {
      if (validationState.state === "error") {
        debouncedSetDisplayedValidationState(validationState);
      } else {
        debouncedSetDisplayedValidationState.cancel();
        setDisplayedValidationState(validationState);
      }
    } else {
      setDisplayedValidationState(validationState);
    }

    return () => {
      debouncedSetDisplayedValidationState.cancel();
    };
  }, [validationState, errorDisplayDelay, debouncedSetDisplayedValidationState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValidationState({ state: "none" });
    // Clear displayed error immediately when user starts typing (if we have error display delay)
    if (errorDisplayDelay > 0 && displayedValidationState.state === "error") {
      setDisplayedValidationState({ state: "none" });
      debouncedSetDisplayedValidationState.cancel();
    }
    onChange?.(e);
    if (!isDirty) {
      setIsDirty(true);
    }
    if (validateOnChange) {
      handleValidation(value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onBlur?.(e);
    if (validateOnBlur && isDirty && validationState.state === "none") {
      handleValidation(value);
    }
  };

  // Map validation state to base component state
  const getBaseValidationState = () => {
    return displayedValidationState.state;
  };

  const showSuccessState =
    displayedValidationState.state === "success" &&
    displayedValidationState.showSuccess !== false;

  const getValidationError = () => {
    if (displayedValidationState.state === "error") {
      return displayedValidationState.message;
    }
    return undefined;
  };

  return (
    <BaseValidatedInput
      label={label}
      helperText={helperText}
      className={className}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      labelIcon={icon}
      showValidationIcon={true}
      validationState={getBaseValidationState()}
      validationError={getValidationError()}
      showSuccessState={showSuccessState}
      value={String(value)}
      {...props}
    />
  );
}
