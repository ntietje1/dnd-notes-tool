"use client";

import React, { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Check, X, Loader2 } from "lucide-react";
import type {
  ValidationResult,
  Validator,
  ValidationState,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

export interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  validators?: Validator[];
  helperText?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (result: ValidationResult) => void;
  icon?: React.ReactNode;
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
  ...props
}: ValidatedInputProps) {
  const [validationState, setValidationState] = useState<ValidationResult>({
    state: "none",
  });
  const [isDirty, setIsDirty] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValidationState({ state: "none" });
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

  const showSuccessState =
    validationState.state === "success" &&
    validationState.showSuccess !== false;

  const getValidationIcon = (state: ValidationState) => {
    switch (state) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
      case "success":
        return showSuccessState && <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = (state: ValidationState) => {
    switch (state) {
      case "loading":
        return validationState.message;
      case "success":
        return showSuccessState && validationState.successMessage;
      case "error":
        return validationState.message;
      default:
        return null;
    }
  };

  const getMessageIcon = (state: ValidationState) => {
    switch (state) {
      case "loading":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "success":
        return showSuccessState && <Check className="h-3 w-3" />;
      case "error":
        return <X className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const currentMessage = getValidationMessage(validationState.state);
  const hasMessage =
    currentMessage ||
    (validationState.state === "error" && validationState.message);

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          {...props}
          className={cn(
            "pr-8",
            validationState.state === "error" && "border-red-500",
            showSuccessState && "border-green-500",
            className,
          )}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {getValidationIcon(validationState.state)}
        </div>
      </div>

      {hasMessage && (
        <p
          className={cn(
            "text-sm flex items-center gap-1",
            validationState.state === "error" && "text-red-600",
            showSuccessState && "text-green-600",
            validationState.state === "loading" && "text-slate-600",
          )}
        >
          {getMessageIcon(validationState.state)}
          {currentMessage}
        </p>
      )}

      {helperText &&
        !validationState.message &&
        !validationState.successMessage && (
          <p className="text-sm text-slate-500 text-left">{helperText}</p>
        )}
    </div>
  );
}
