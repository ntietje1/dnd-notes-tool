import React, { forwardRef, useId } from "react";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { Label } from "~/components/shadcn/ui/label";
import { Check, X, Loader2 } from "~/lib/icons";
import { cn } from "~/lib/utils";

export type ValidationState =
  | "idle"
  | "validating"
  | "valid"
  | "invalid"
  | "loading"
  | "success"
  | "error"
  | "none";

export interface ValidationConfig {
  state?: ValidationState;
  error?: string;
  showValidationIcon?: boolean;
  showSuccessState?: boolean;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  showCheckingMessage?: boolean;
  checkingMessage?: string;
}

export interface BaseValidatedInputProps {
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  labelIcon?: React.ReactNode;
  isTextarea?: boolean;
  validationConfig?: ValidationConfig;
  id?: string;
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
  className?: string;
  value?: string | number;
  required?: boolean;
}

export const BaseValidatedInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  BaseValidatedInputProps
>(function BaseValidatedInput(
  {
    label,
    helperText,
    className,
    required,
    leftIcon,
    labelIcon,
    isTextarea = false,
    validationConfig = {},
    id,
    inputProps,
    textareaProps,
    value = "",
  },
  ref,
) {
  const {
    state: validationState = "idle",
    error: validationError,
    showValidationIcon = true,
    showSuccessState = false,
    onValidationChange,
    showCheckingMessage = false,
    checkingMessage = "Checking...",
  } = validationConfig;
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const getValidationIcon = (state: ValidationState) => {
    if (!showValidationIcon) return null;

    switch (state) {
      case "validating":
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
      case "valid":
      case "success":
        return showSuccessState ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : null;
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
        return showSuccessState
          ? "border-green-500 focus-visible:ring-green-500"
          : "";
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
  const hasError =
    validationError &&
    (validationState === "invalid" || validationState === "error");
  const isChecking =
    (validationState === "validating" || validationState === "loading") &&
    !hasError;

  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-2" htmlFor={inputId}>
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
        {isTextarea ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...textareaProps}
            id={inputId}
            value={value}
            required={required}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={messageId}
            className={cn(
              hasLeftIcon && "pl-10",
              hasValidationIcon && "pr-10",
              getBorderColor(validationState),
              className,
            )}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            {...inputProps}
            id={inputId}
            value={value}
            required={required}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={messageId}
            className={cn(
              hasLeftIcon && "pl-10",
              hasValidationIcon && "pr-10",
              getBorderColor(validationState),
              className,
            )}
          />
        )}
        {hasValidationIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validationIcon}
          </div>
        )}
      </div>

      <p
        id={messageId}
        aria-live="polite"
        className={cn(
          "text-sm flex items-center gap-1 min-h-[1.25rem]",
          hasError
            ? getMessageColor(validationState)
            : isChecking
              ? "text-slate-600"
              : "text-slate-500",
        )}
      >
        {hasError ? (
          <>
            {getMessageIcon(validationState)}
            {validationError}
          </>
        ) : isChecking && showCheckingMessage ? (
          <>
            {getMessageIcon(validationState)}
            {checkingMessage}
          </>
        ) : (
          helperText || null
        )}
      </p>
    </div>
  );
});
