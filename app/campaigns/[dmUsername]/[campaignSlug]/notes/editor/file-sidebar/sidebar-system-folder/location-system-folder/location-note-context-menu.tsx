"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  ContextMenu,
  type ContextMenuItem,
} from "@/components/context-menu/context-menu";

interface LocationNoteContextMenuProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function LocationNoteContextMenu({
  children,
  onEdit,
  onDelete,
}: LocationNoteContextMenuProps) {
  const menuItems: ContextMenuItem[] = [
    {
      label: "Rename",
      icon: <Pencil className="h-4 w-4" />,
      onClick: onEdit,
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      className: "text-red-600 focus:text-red-600",
    },
  ];

  return <ContextMenu items={menuItems}>{children}</ContextMenu>;
}
