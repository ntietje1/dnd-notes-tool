import React, { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ValidatedInput } from "@/components/ui/forms/validated-input";
import { ValidationResult } from "@/lib/validation";
import { Validator } from "@/lib/validation";

interface BaseFieldProps {
  label: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: "text";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  icon?: ReactNode;
  validators?: Validator[];
  onValidationChange?: (result: ValidationResult) => void;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

interface CustomFieldProps extends BaseFieldProps {
  type: "custom";
  children: ReactNode;
}

type FormFieldProps = TextFieldProps | TextareaFieldProps | CustomFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, disabled = false, required = false, className = "" } = props;

  const renderField = () => {
    switch (props.type) {
      case "text":
        const { value, onChange, placeholder, maxLength, icon, validators, onValidationChange } = props;
        
        if (validators && onValidationChange) {
          return (
            <ValidatedInput
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              validators={validators}
              onValidationChange={onValidationChange}
              icon={icon}
              required={required}
              label={label}
              className="break-all min-w-0 focus:ring-offset-0"
            />
          );
        }
        
        return (
          <>
            <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={label.toLowerCase().replace(/\s+/g, '-')}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className="break-all min-w-0 focus:ring-offset-0"
            />
          </>
        );

      case "textarea":
        const { value: textareaValue, onChange: textareaOnChange, placeholder: textareaPlaceholder, maxLength: textareaMaxLength, rows = 3 } = props;
        return (
          <>
            <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={label.toLowerCase().replace(/\s+/g, '-')}
              value={textareaValue}
              onChange={(e) => textareaOnChange(e.target.value)}
              placeholder={textareaPlaceholder}
              disabled={disabled}
              maxLength={textareaMaxLength}
              rows={rows}
              className="resize-none min-w-0 focus:ring-offset-0"
            />
          </>
        );

      case "custom":
        return (
          <>
            <Label>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {props.children}
          </>
        );

      default:
        return null;
    }
  };

  // For validated inputs, don't wrap in space-y-2 since ValidatedInput handles its own spacing
  if (props.type === "text" && props.validators && props.onValidationChange) {
    return <div className={`px-px ${className}`}>{renderField()}</div>;
  }

  return (
    <div className={`space-y-2 px-px ${className}`}>
      {renderField()}
    </div>
  );
} 