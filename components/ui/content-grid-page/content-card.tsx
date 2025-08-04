import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface ContentCardProps {
  title: string;
  description?: string;
  color?: string;
  badge?: {
    text: string;
    icon?: ReactNode;
    variant?: "default" | "secondary" | "destructive" | "outline" | "destructive-subtle";
  };
  actionButtons?: {
    icon: ReactNode;
    onClick: (e: React.MouseEvent) => void;
    "aria-label"?: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "destructive-subtle";
  }[];
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ContentCard({
  title,
  description,
  color,
  badge,
  actionButtons,
  footer,
  onClick,
  className = "",
}: ContentCardProps) {
  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer group bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-amber-300 ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {color && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
              )}
              <CardTitle className="text-lg text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-1">
                {title}
              </CardTitle>
            </div>
            {badge && (
              <Badge variant={badge.variant || "secondary"} className="w-fit text-xs">
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.text}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {actionButtons && actionButtons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "ghost"}
                size="sm"
                onClick={button.onClick}
                className={`opacity-0 group-hover:opacity-100 transition-opacity`}
                aria-label={button["aria-label"]}
              >
                {button.icon}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      {(description || footer) && (
        <CardContent className="pt-0">
          {description && (
            <CardDescription className="line-clamp-3 mb-3">
              {description}
            </CardDescription>
          )}
          {footer}
        </CardContent>
      )}
    </Card>
  );
} 