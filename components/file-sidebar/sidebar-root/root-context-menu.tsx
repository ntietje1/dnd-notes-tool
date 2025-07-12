"use client";

import { FileText } from "lucide-react";
import {
  ContextMenu,
  type ContextMenuItem,
} from "@/components/context-menu/context-menu";
import { cn } from "@/lib/utils";

interface RootContextMenuProps {
  children: React.ReactNode;
  onNewPage: () => void;
  className?: string;
}

export function RootContextMenu({
  children,
  onNewPage,
  className,
}: RootContextMenuProps) {
  const menuItems: ContextMenuItem[] = [
    {
      label: "New Page",
      icon: <FileText className="h-4 w-4" />,
      onClick: onNewPage,
    },
  ];

  return (
    <ContextMenu items={menuItems} className={className}>
      {children}
    </ContextMenu>
  );
}
