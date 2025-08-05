"use client";

import React, { forwardRef } from "react";
import { Input } from "../input";
import { Label } from "../label";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ValidationState = "idle" | "validating" | "valid" | "invalid" | "loading" | "success" | "error" | "none";

export interface BaseValidatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  helperText?: string;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  leftIcon?: React.ReactNode;
  labelIcon?: React.ReactNode;
  showValidationIcon?: boolean;
  validationState?: ValidationState;
  validationError?: string;
  showSuccessState?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Base validated input component with consistent styling
 * Used by both ValidatedInput and AsyncValidatedInput
 */
export const BaseValidatedInput = forwardRef<HTMLInputElement, BaseValidatedInputProps>(
  function BaseValidatedInput({
    label,
    helperText,
    className,
    onChange,
    required,
    leftIcon,
    labelIcon,
    showValidationIcon = true,
    validationState = "idle",
    validationError,
    showSuccessState = false,
    value = "",
    ...props
  }, ref) {
    
    const getValidationIcon = (state: ValidationState) => {
      if (!showValidationIcon) return null;
      
      switch (state) {
        case "validating":
        case "loading":
          return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
        case "valid":
        case "success":
          return showSuccessState ? <Check className="h-4 w-4 text-green-500" /> : null;
        case "invalid":
        case "error":
          return <X className="h-4 w-4 text-red-500" />;
        default:
          return null;
      }
    };

    const getBorderColor = (state: ValidationState) => {
      switch (state) {
        case "valid":
        case "success":
          return showSuccessState ? "border-green-500 focus-visible:ring-green-500" : "";
        case "invalid":
        case "error":
          return "border-red-500 focus-visible:ring-red-500";
        default:
          return "";
      }
    };

    const getMessageColor = (state: ValidationState) => {
      switch (state) {
        case "invalid":
        case "error":
          return "text-red-600";
        case "valid":
        case "success":
          return showSuccessState ? "text-green-600" : "";
        case "validating":
        case "loading":
          return "text-slate-600";
        default:
          return "";
      }
    };

    const getMessageIcon = (state: ValidationState) => {
      switch (state) {
        case "validating":
        case "loading":
          return <Loader2 className="h-3 w-3 animate-spin" />;
        case "valid":
        case "success":
          return showSuccessState ? <Check className="h-3 w-3" /> : null;
        case "invalid":
        case "error":
          return <X className="h-3 w-3" />;
        default:
          return null;
      }
    };

    const validationIcon = getValidationIcon(validationState);
    const hasValidationIcon = validationIcon !== null;
    const hasLeftIcon = leftIcon !== null && leftIcon !== undefined;
    const hasError = validationError && (validationState === "invalid" || validationState === "error");

    return (
      <div className="space-y-2">
        {label && (
          <Label className="flex items-center gap-2">
            {labelIcon}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        <div className="relative">
          {hasLeftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              {leftIcon}
            </div>
          )}
          <Input
            ref={ref}
            {...props}
            value={value}
            className={cn(
              hasLeftIcon && "pl-10",
              hasValidationIcon && "pr-10",
              getBorderColor(validationState),
              className,
            )}
            onChange={onChange}
          />
          {hasValidationIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {validationIcon}
            </div>
          )}
        </div>

        {hasError && (
          <p className={cn("text-sm flex items-center gap-1", getMessageColor(validationState))}>
            {getMessageIcon(validationState)}
            {validationError}
          </p>
        )}

        {helperText && !hasError && (
          <p className="text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);