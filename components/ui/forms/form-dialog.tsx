import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LucideIcon } from "lucide-react";

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  maxWidth?: string;
}

export function FormDialog({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  maxWidth = "max-w-md",
}: FormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-amber-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-1">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
} 