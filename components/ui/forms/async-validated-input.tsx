"use client";

import React, { forwardRef, useEffect } from "react";
import { BaseValidatedInput } from "./base-validated-input";
import { 
  useAsyncValidation, 
  AsyncValidator, 
  AsyncValidationOptions 
} from "@/lib/use-async-validation";

export interface AsyncValidatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  helperText?: string;
  asyncValidator?: AsyncValidator | null;
  asyncValidationOptions?: AsyncValidationOptions;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  leftIcon?: React.ReactNode;
  labelIcon?: React.ReactNode;
  showValidationIcon?: boolean;
  errorDisplayDelay?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AsyncValidatedInput = forwardRef<HTMLInputElement, AsyncValidatedInputProps>(
  function AsyncValidatedInput({
    label,
    helperText,
    asyncValidator,
    asyncValidationOptions,
    onValidationChange,
    className,
    onChange,
    required,
    leftIcon,
    labelIcon,
    showValidationIcon = true,
    errorDisplayDelay = 500,
    value = "",
    ...props
  }, ref) {
    
    const validation = useAsyncValidation(
      String(value),
      asyncValidator ?? null,
      {
        ...asyncValidationOptions,
        errorDisplayDelay,
      }
    );

    // Notify parent of validation changes
    useEffect(() => {
      const isValid = validation.state === "valid" || validation.state === "idle";
      onValidationChange?.(isValid, validation.error);
    }, [validation.state, validation.error, onValidationChange]);

    // Map async validation state to base component state
    const getValidationState = () => {
      if (validation.isValidating) return "validating";
      return validation.state;
    };

    const showSuccessState = validation.state === "valid";

    return (
      <BaseValidatedInput
        ref={ref}
        label={label}
        helperText={helperText}
        className={className}
        onChange={onChange}
        required={required}
        leftIcon={leftIcon}
        labelIcon={labelIcon}
        showValidationIcon={showValidationIcon}
        validationState={getValidationState()}
        validationError={validation.error}
        showSuccessState={showSuccessState}
        value={value}
        {...props}
      />
    );
  }
);