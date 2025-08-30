import React, { forwardRef } from "react";
import { ValidatedInput } from "./validated-input";
import {
  useAsyncValidation,
  type AsyncValidator,
  type AsyncValidationOptions,
  type UseAsyncValidationResult,
} from "~/lib/use-async-validation";
import type { ValidationResult, ValidationState, Validator } from "~/lib/validation";

export interface AsyncValidatedInputProps {
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  labelIcon?: React.ReactNode;
  isTextarea?: boolean;
  validationConfig?: {
    // Sync validation (optional)
    validators?: Validator[];
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    onSyncValidationChange?: (result: ValidationResult) => void;
    // Async validation
    asyncValidators?: AsyncValidator[] | null;
    asyncValidationOptions?: AsyncValidationOptions;
    showValidationIcon?: boolean;
    showSuccessState?: boolean;
    errorDisplayDelay?: number;
    showCheckingMessage?: boolean;
    checkingMessage?: string;
    onStatusChange?: (status: { state: ValidationState; error?: string }) => void;
  };
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

export const AsyncValidatedInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  AsyncValidatedInputProps
>(function AsyncValidatedInput(
  {
    label,
    helperText,
    className,
    required,
    leftIcon,
    labelIcon,
    isTextarea = false,
    validationConfig = {},
    inputProps,
    textareaProps,
    value = "",
  },
  ref,
) {
  const {
    // sync
    validators = [],
    validateOnChange = false,
    validateOnBlur = true,
    onSyncValidationChange,
    // async
    asyncValidators,
    asyncValidationOptions,
    showValidationIcon = true,
    showSuccessState = false,
    errorDisplayDelay = 1000,
    showCheckingMessage = false,
    checkingMessage,
    onStatusChange,
  } = validationConfig;

  const validation: UseAsyncValidationResult = useAsyncValidation(
    String(value),
    asyncValidators ?? null,
    {
    ...asyncValidationOptions,
    errorDisplayDelay,
    },
  );

  // no external async callbacks; merged via asyncStatus

  // Handle blur - force immediate error display
  const handleInputBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    // Allow parent to modify the value on blur (e.g., normalization) before we validate
    inputProps?.onBlur?.(e);
    if (validation.state !== "invalid") {
      await validation.validate();
    }
    validation.forceShowError();
  };

  const handleTextareaBlur = async (
    e: React.FocusEvent<HTMLTextAreaElement>,
  ) => {
    textareaProps?.onBlur?.(e);
    if (validation.state !== "invalid") {
      await validation.validate();
    }
    validation.forceShowError();
  };

  return (
    <ValidatedInput
      ref={ref}
      label={label}
      helperText={helperText}
      className={className}
      required={required}
      leftIcon={leftIcon}
      icon={labelIcon}
      isTextarea={isTextarea}
      validationConfig={{
        validators,
        validateOnChange,
        validateOnBlur,
        onValidationChange: onSyncValidationChange,
        showSuccessState,
        errorDisplayDelay,
        showCheckingMessage,
        checkingMessage,
        onStatusChange,
      }}
      asyncStatus={{ state: validation.state, error: validation.error ?? validation.rawError }}
      inputProps={{
        ...inputProps,
        onBlur: handleInputBlur,
      }}
      textareaProps={{
        ...textareaProps,
        onBlur: handleTextareaBlur,
      }}
      value={value}
    />
  );
});
