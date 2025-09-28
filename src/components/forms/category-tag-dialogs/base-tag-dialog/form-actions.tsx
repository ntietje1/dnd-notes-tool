import { Button } from "~/components/shadcn/ui/button";
import { Loader2, type LucideIcon } from "~/lib/icons";

interface FormAction {
  label: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  loadingText?: string;
  type?: "button" | "submit";
  className?: string;
}

interface FormActionsProps {
  actions: FormAction[];
  className?: string;
}

export function FormActions({ actions, className = "pt-4" }: FormActionsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {actions.map((action, index) => {
        const {
          label,
          onClick = () => {},
          variant = "default",
          disabled = false,
          icon: Icon,
          loading = false,
          loadingText,
          type = "button",
          className: actionClassName = "",
        } = action;

        const isLoading = loading;
        const buttonText = isLoading && loadingText ? loadingText : label;

        return (
          <Button
            key={index}
            type={type}
            variant={variant}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`flex-1 ${variant === "default" ? "bg-amber-600 hover:bg-amber-700" : ""} ${actionClassName}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {buttonText}
              </>
            ) : (
              <>
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {buttonText}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
} 