import React, { forwardRef, useEffect, useRef, useState } from "react";
import { BaseValidatedInput } from "./base-validated-input";
import type { ValidationResult, Validator, ValidationState } from "~/lib/validation";

export interface ValidatedInputProps {
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  isTextarea?: boolean;
  validationConfig?: {
    validators?: Validator[];
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    onValidationChange?: (result: ValidationResult) => void;
    showSuccessState?: boolean;
    errorDisplayDelay?: number;
    onStatusChange?: (status: {
      state: ValidationState;
      error?: string;
    }) => void;
     // Note: Prefer memoizing this callback (e.g., useCallback) to avoid unnecessary re-renders.
    showCheckingMessage?: boolean;
    checkingMessage?: string;
  };
  // Optional overlay for async validation status. When provided,
  // this will be merged with the sync validation result for display.
  asyncStatus?: { state: "idle" | "validating" | "valid" | "invalid"; error?: string };
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, never> & {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  };
  textareaProps?: Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    never
  > & {
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  };
  // Common props that apply to both input and textarea
  className?: string;
  value?: string | number;
  required?: boolean;
}

export const ValidatedInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  ValidatedInputProps
>(function ValidatedInput({
  label,
  helperText,
  className,
  required,
  leftIcon,
  icon,
  isTextarea = false,
  validationConfig = {},
  asyncStatus,
  inputProps,
  textareaProps,
  value = "",
}, ref) {
  const {
    validators = [],
    validateOnChange = false,
    validateOnBlur = true,
    onValidationChange,
    showSuccessState = false,
    errorDisplayDelay = 600,
    onStatusChange,
    showCheckingMessage = false,
    checkingMessage = "Checking...",
  } = validationConfig;
  const [validationState, setValidationState] = useState<ValidationResult>({ state: "none" });
  const [visibleError, setVisibleError] = useState<string | undefined>(undefined);
  const errorTimerRef = useRef<number | undefined>(undefined);

  const runValidation = async (value: string) => {
    if (!validators.length) return { state: "none" as const };
    for (const validator of validators) {
      const result = await validator.validate(value);
      if (result.state !== "success") return result;
      if (result.successMessage && result.showSuccess) return result;
    }
    return { state: "success" as const };
  };

  const handleValidation = async (value: string) => {
    const result = await runValidation(value);
    setValidationState(result);
    onValidationChange?.(result);
    return result;
  };

  // Debounce only the display of the error message for sync validation
  useEffect(() => {
    if (validationState.state === "error") {
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => {
        setVisibleError(validationState.message);
      }, Math.max(0, errorDisplayDelay));
    } else {
      window.clearTimeout(errorTimerRef.current);
      setVisibleError(undefined);
    }

    return () => {
      window.clearTimeout(errorTimerRef.current);
    };
  }, [validationState, errorDisplayDelay]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    inputProps?.onChange?.(e);
    // Clear any visible error immediately while typing
    window.clearTimeout(errorTimerRef.current);
    setVisibleError(undefined);
    if (validateOnChange) {
      void handleValidation(value);
    } else {
      setValidationState({ state: "none" });
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    textareaProps?.onChange?.(e);
    // Clear any visible error immediately while typing
    window.clearTimeout(errorTimerRef.current);
    setVisibleError(undefined);
    if (validateOnChange) {
      void handleValidation(value);
    } else {
      setValidationState({ state: "none" });
    }
  };

  const handleInputBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    inputProps?.onBlur?.(e);
    if (validateOnBlur) {
      const result = await handleValidation(value);
      // Bypass debounce: show error immediately on blur
      window.clearTimeout(errorTimerRef.current);
      setVisibleError(result.state === "error" ? result.message : undefined);
    }
  };

  const handleTextareaBlur = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    textareaProps?.onBlur?.(e);
    if (validateOnBlur) {
      const result = await handleValidation(value);
      // Bypass debounce: show error immediately on blur
      window.clearTimeout(errorTimerRef.current);
      setVisibleError(result.state === "error" ? result.message : undefined);
    }
  };

  // Map validation state to base component state
  const getBaseValidationState = () => {
    if (validationState.state === "error") {
      return visibleError ? "error" : "none";
    }
    return validationState.state;
  };

  const shouldShowSuccessState =
    showSuccessState && validationState.state === "success" && validationState.showSuccess !== false;

  const getValidationError = () => (validationState.state === "error" ? visibleError : undefined);

  // Merge async status overlay with sync state for display purposes
  const mergeWithAsyncState = (): { state: ValidationState; error?: string } => {
    const baseState = getBaseValidationState();
    const baseError = getValidationError();

    if (!asyncStatus) {
      return { state: baseState, error: baseError };
    }

    switch (asyncStatus.state) {
      case "validating":
        // Always show loader while async is in-flight
        return { state: "loading" };
      case "invalid":
        return { state: "error", error: asyncStatus.error };
      case "valid":
        // Semantically mark as success regardless of whether we visually show success styling
        return { state: "success" };
      case "idle":
      default:
        return { state: baseState, error: baseError };
    }
  };

  const merged = mergeWithAsyncState();

  // Keep a stable reference to the latest onStatusChange to avoid dependency loops
  const onStatusChangeRef = useRef<typeof onStatusChange>(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // Notify merged status to consumers
  useEffect(() => {
    onStatusChangeRef.current?.({ state: merged.state, error: merged.error });
  }, [merged.state, merged.error]);

  return (
    <BaseValidatedInput
      ref={ref}
      label={label}
      helperText={helperText}
      className={className}
      required={required}
      leftIcon={leftIcon}
      labelIcon={icon}
      isTextarea={isTextarea}
      validationConfig={{
        state: merged.state,
        error: merged.error,
        showValidationIcon: true,
        showSuccessState: shouldShowSuccessState,
        onValidationChange: (isValid, error) => {
          const result: ValidationResult = isValid ? { state: "success" } : { state: "error", message: error || "" };
          onValidationChange?.(result);
          onStatusChange?.({ state: result.state, error: error || undefined });
        },
        showCheckingMessage,
        checkingMessage,
      }}
      inputProps={{
        ...inputProps,
        onChange: handleInputChange,
        onBlur: handleInputBlur,
      }}
      textareaProps={{
        ...textareaProps,
        onChange: handleTextareaChange,
        onBlur: handleTextareaBlur,
      }}
      value={String(value)}
    />
  );
});
