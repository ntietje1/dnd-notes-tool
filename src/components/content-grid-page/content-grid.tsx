import { type ReactNode } from "react";

interface ContentGridProps {
  children: ReactNode;
  className?: string;
}

export function ContentGrid({ children, className = "" }: ContentGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
} 